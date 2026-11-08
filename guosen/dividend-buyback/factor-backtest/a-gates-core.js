'use strict';
// Same cash account and quarterly execution rules as the original A-share engine.
(function (root) {
  const sum = a => a.reduce((x, y) => x + y, 0);
  const product = a => a.reduce((x, y) => x * (1 + y), 1);
  function drawdown(r) {let nav = 1, peak = 1, low = 0;for (const x of r) {nav *= 1 + x;peak = Math.max(peak, nav);low = Math.min(low, nav / peak - 1);}return low;}
  function metrics(r, dates, bm) {
    if (!r.length) return null;
    const n = r.length, end = product(r), mean = sum(r) / n;
    const vol = n > 1 ? Math.sqrt(sum(r.map(x => (x - mean) ** 2)) / (n - 1) * 252) : null;
    const annual = end > 0 ? end ** (252 / n) - 1 : -1;
    const years = [...new Set(dates.map(d => d.slice(0, 4)))].sort().map(year => {
      const idx = dates.map((d, i) => d.startsWith(year) ? i : -1).filter(i => i >= 0), a = idx.map(i => r[i]);
      const rr = product(a) - 1, br = product(idx.map(i => bm[i])) - 1;
      return {year, return_rate: rr, max_drawdown: drawdown(a), days: a.length, benchmark_return: br, excess_return: rr - br};
    });
    return {annual_return: annual, volatility: vol, sharpe: vol > 0 ? mean * 252 / vol : null,
      max_drawdown: drawdown(r), annual_mdd_mean: sum(years.map(y => y.max_drawdown)) / years.length,
      excess_annual_return: annual - (product(bm) ** (252 / n) - 1), total_return: end - 1, days: n, years};
  }
  function conditional(r, dates, labels) {
    const by_year = Object.fromEntries([...new Set(dates.map(d => d.slice(0, 4)))].map(y => [y, {'牛市': null, '熊市': null, '震荡市': null}]));
    let begin = 0;
    for (let end = 1; end <= dates.length; end++) {
      if (end === dates.length || dates[end].slice(0, 4) !== dates[begin].slice(0, 4) || labels[end] !== labels[begin]) {
        const y = dates[begin].slice(0, 4), l = labels[begin], v = drawdown(r.slice(begin, end)), old = by_year[y][l];
        by_year[y][l] = old === null ? v : Math.min(old, v);begin = end;
      }
    }
    const mean_by_regime = {};
    for (const l of ['牛市', '熊市', '震荡市']) {const a = Object.values(by_year).map(r => r[l]).filter(x => x !== null);mean_by_regime[l] = a.length ? sum(a) / a.length : null;}
    return {by_year, mean_by_regime};
  }
  function regimes(r, dates, bm, info) {
    const labels = dates.map(d => {const a = info.intervals.filter(x => x.start <= d && d <= x.end);if (a.length !== 1) throw Error('市场状态未唯一覆盖 ' + d);return a[0].label;});
    const dd = conditional(r, dates, labels), bdd = conditional(bm, dates, labels);
    const calc = idx => {
      if (!idx.length) return {days: 0};
      const ds = idx.map(i => dates[i]), bs = idx.map(i => bm[i]), mm = metrics(idx.map(i => r[i]), ds, bs);
      return {...mm, start: ds[0], end: ds.at(-1), benchmark_total_return: product(bs) - 1};
    };
    const rows = ['牛市', '熊市', '震荡市'].map(l => {const x = calc(labels.map((a, i) => a === l ? i : -1).filter(i => i >= 0));delete x.max_drawdown;return {...x, regime: l, annual_mdd_mean: dd.mean_by_regime[l], benchmark_annual_mdd_mean: bdd.mean_by_regime[l]};});
    const periods = info.intervals.flatMap(p => {const idx = dates.map((d, i) => p.start <= d && d <= p.end ? i : -1).filter(i => i >= 0);return idx.length ? [{...calc(idx), regime: p.label, source_start: p.start, source_end: p.end}] : [];});
    return {info, labels, metrics: rows, periods, conditional_drawdown: dd, note: '事后归因，不参与选股和调仓。状态年化按实际交易日计时；条件回撤按年及连续状态片段重置，年内取最差片段后跨年平均。'};
  }
  function run(meta, pools, quotes, options) {
    const codes = [...new Set(pools.flat())].sort(), n = codes.length, map = new Map(codes.map((c, i) => [c, i]));
    for (const c of codes) if (!quotes[c]) throw Error('选中股票缺行情：' + c);
    const series = codes.map(c => quotes[c]), hold = new Float64Array(n), schedule = new Map(meta.periods.map((p, i) => [p.day, i]));
    const targets = pools.map(p => {const t = new Uint8Array(n);for (const c of p) t[map.get(c)] = 1;return t;});
    const cost = meta.cost_bps / 10000, returns = [], quality = [], holdings = [], trades = [], navRows = [];
    let cash = 1, nav = 1, benchmark = 1;
    const flags = (k, d) => {const s = series[k], i = d - s[1];return i >= 0 && i < s[3].length ? Number(s[3][i]) : 0;};
    for (let d = 0; d < meta.days.length; d++) {
      const old = sum(hold) + cash;
      for (let k = 0; k < n; k++) if (hold[k] > 1e-14) {const s = series[k], r = s[2][d - s[1]];if (!Number.isFinite(r)) throw Error('持仓收益缺失：' + meta.days[d] + ' ' + codes[k]);hold[k] *= 1 + r;}
      if (schedule.has(d)) {
        const p = schedule.get(d), target = targets[p], count = pools[p].length, before = sum(hold) + cash;
        let guess = before, newHold, newCash, fees, sold, bought;
        for (let iteration = 0; iteration <= 30; iteration++) {
          const goal = count ? guess / count : 0;newHold = new Float64Array(n);const wants = new Float64Array(n);sold = 0;let wish = 0;
          for (let k = 0; k < n; k++) {const value = target[k] ? goal : 0, f = flags(k, d), s = f & 2 ? Math.max(hold[k] - value, 0) : 0;newHold[k] = hold[k] - s;sold += s;wants[k] = f & 1 ? Math.max(value - newHold[k], 0) : 0;wish += wants[k];}
          const available = cash + sold * (1 - cost), scale = wish > 0 ? Math.min(1, Math.max(available, 0) / (wish * (1 + cost))) : 1;bought = 0;
          for (let k = 0; k < n; k++) {const b = wants[k] * scale;newHold[k] += b;bought += b;}
          fees = (sold + bought) * cost;newCash = Math.max(0, available - bought * (1 + cost));const next = before - fees;
          if (iteration === 30 || Math.abs(next - guess) < 1e-12 * Math.max(before, 1)) break;guess = next;
        }
        if (Math.abs(sum(newHold) + newCash + fees - before) > 1e-8 * Math.max(before, 1)) throw Error('交易资金不守恒');
        hold.set(newHold);cash = newCash;const per = meta.periods[p];
        holdings.push({quarter: per.quarter, signal_date: per.signal_date, execution_date: meta.days[d], selected: count, held: hold.filter(x => x > 1e-14).length, pool_ratio: count / per.total, cash_weight: cash / (cash + sum(hold)), gate_mask: options.mask, gate_date: per.gate_date});
        trades.push({date: meta.days[d], fees, sold, bought});
      }
      nav = sum(hold) + cash;returns.push(old > 0 ? nav / old - 1 : 0);let stale = 0;
      for (let k = 0; k < n; k++) if (flags(k, d) & 4) stale += hold[k];quality.push(nav > 0 ? stale / nav : 0);
      benchmark *= 1 + meta.benchmark[d];navRows.push({date: meta.days[d], nav, benchmark, excess_nav: nav / benchmark});
    }
    return {metrics: metrics(returns, meta.days, meta.benchmark), holdings, trades, nav: navRows, steps: options.steps, gate_mask: options.mask,
      signature: options.signature, cost_bps: meta.cost_bps, start: meta.days[0], end: meta.days.at(-1), market: meta.market,
      regime_analysis: regimes(returns, meta.days, meta.benchmark, meta.regimes), valuation_quality: {max_stale_weight: Math.max(...quality), mean_stale_weight: sum(quality) / quality.length, days_with_stale: quality.filter(x => x > 0).length},
      note: '先按历史快照筛6大门槛，再按因子顺序筛选；季度后首个交易日收盘执行，年化252日、单边20bp、现金收益0。'};
  }
  root.AGateCore = {run, metrics};if (typeof module !== 'undefined') module.exports = root.AGateCore;
})(typeof self === 'undefined' ? globalThis : self);
