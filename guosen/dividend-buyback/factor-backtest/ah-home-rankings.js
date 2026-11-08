'use strict';
// Read only version-bound, precomputed results; never calculate returns in the UI.
window.addEventListener('research-ready', async () => {
  const host = document.createElement('section');
  host.id = 'parameter-ranking';
  host.className = 'parameter-ranking';
  host.setAttribute('aria-label', '参数对比结论');
  const overview = document.getElementById('overview');
  const existing = Object.fromEntries(['stats', 'market-note', 'regime-method', 'regime-intervals', 'factor-definitions', 'coverage-table'].map(id => [id, document.getElementById(id)]));
  const factorSection = document.createElement('section');factorSection.id = 'overview-factors';factorSection.className = 'overview-section';
  factorSection.innerHTML = '<h2>二、有哪些因子，怎么构建</h2><p>七个因子分别看分红潜力、现金流和负债。可以单独使用，也可以按指定顺序组合筛选。</p>';
  factorSection.append(existing['factor-definitions']);
  const methodSection = document.createElement('section');methodSection.id = 'overview-method';methodSection.className = 'overview-section';
  methodSection.innerHTML = '<h2>三、怎么选、怎么买卖</h2><p>正在读取当前回测口径…</p>';
  const detailsSection = document.createElement('section');detailsSection.id = 'overview-details';detailsSection.className = 'overview-section overview-details';
  detailsSection.innerHTML = '<h2>四、数据与计算细节</h2><p class="muted">需要核对时再展开，不影响上面的结论和操作。</p>';
  const fold = (title, nodes) => {const d = document.createElement('details');const s = document.createElement('summary');s.textContent = title;d.append(s, ...nodes);detailsSection.append(d);return d;};
  fold('数据范围、收益口径与限制', [existing.stats, existing['market-note']]);
  fold('牛市、熊市和震荡市怎么划分', [existing['regime-method'], existing['regime-intervals']]);
  const coverageNote = document.createElement('p');coverageNote.textContent = '缺失不等于0。只排除所用因子的必要缺失，不要求七项指标同时齐全。';
  fold('每季度有多少股票、各因子覆盖多少', [coverageNote, existing['coverage-table']]);
  overview.replaceChildren(host, factorSection, methodSection, detailsSection);
  host.innerHTML = '<h1>一、先看结论</h1><p role="status">正在读取参数对比结果…</p>';
  const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const percent = v => Number.isFinite(v) ? (v * 100).toFixed(2) + '%' : '—';
  try {
    const manifest = await OfflineData.init();
    const report = await OfflineData.load('data/parameter-ranking.json.gz');
    if (report.sourceVersion !== manifest.version || report.marketVersion !== manifest.market_version) throw Error('排名和当前数据版本不一致，未展示结果。');
    const factors = Object.fromEntries(manifest.summary.factors.map(f => [f.id, f]));
    const label = steps => steps.map((s, i) => `${i + 1}. ${escape(factors[s.id].name)}：${s.q ? `保留${factors[s.id].direction === 'low' ? '最低' : '最高'}${s.q}%` : s.value ? '满足条件' : '已知不满足'}`).join('<br>');
    const benchmark = report.market === 'a' ? '万得全A' : '恒生综合指数';
    const best = report.top[0];
    const combination = best.steps.map(s => s.id === 'f5' ? '低负债' : factors[s.id].name).map(escape).join('＋');
    host.innerHTML = `<h1>一、先看结论</h1>
      <p class="ranking-takeaway">本次筛选中，排在前面的搭配是：<strong>${combination}</strong>。</p>
      <p>第一组的 Sharpe 为 <strong>${best.full.sharpe.toFixed(3)}</strong>，年化收益 <strong>${percent(best.full.annual_return)}</strong>，年化波动率 <strong>${percent(best.full.volatility)}</strong>，平均年度最大回撤 <strong>${percent(best.full.annual_mdd_mean)}</strong>。</p>
      <p class="muted">本次比较 ${report.tested.toLocaleString()} 组，按完整回测区间的 Sharpe 从高到低排列。衡量的是每承担一份波动获得多少收益，不是只看谁涨得最多。这是回看历史选出的参数，不代表未来排名，也不是样本外检验。</p>
      <div class="ranking-table-wrap" tabindex="0" role="region" aria-label="前三组参数与收益，可横向滚动"><table class="ranking-table"><thead><tr><th>排名</th><th>因子组合与参数（按顺序筛选）</th><th>Sharpe ↓</th><th>年化收益</th><th>年化超额</th><th>年化波动率</th><th>平均年度最大回撤</th></tr></thead><tbody>${report.top.map(r => `<tr><td>${r.rank}</td><td>${label(r.steps)}</td><td>${r.full.sharpe.toFixed(3)}</td><td>${percent(r.full.annual_return)}</td><td>${percent(r.full.excess_annual_return)}</td><td>${percent(r.full.volatility)}</td><td>${percent(r.full.annual_mdd_mean)}</td></tr>`).join('')}</tbody></table></div>
      <div class="ranking-actions"><label>查看哪一组<select id="ranking-choice" aria-label="选择排名">${report.top.map(r => `<option value="${r.rank}">第${r.rank}名</option>`).join('')}</select></label><button id="ranking-curve" class="primary">查看净值与年度表现</button><button id="ranking-pool">查看股票池及两期变化</button><button id="ranking-download">下载该组XLSX</button></div>
      <p id="ranking-selection" class="notice"></p><p id="ranking-action-status" role="status"></p>
      <details class="ranking-rules"><summary>查看比较范围与计算口径</summary>
        <p>排名区间：${best.start} 至 ${best.end}。相同股票池只保留一组参数；要求每期都能选出票，平均每期20—500只，符合要求且股票池不同的有 ${report.qualified} 组。</p>
        <p>平均年度最大回撤：分别计算每个自然年内从高点到低点的最大跌幅，再对各年等权取平均；首尾不足一年的部分按已有交易日计算。不是把全历史最大回撤除以年数，也不表示最坏一年只会跌这么多。波动率按日收益的样本标准差年化；Sharpe 按日均收益除以日收益标准差年化，无风险利率取0。</p>
        <p>保留比例是每一步剩余有效股票中的比例。例如先保留20%，再保留50%，不是两个独立的全市场排名。分位因子沿用各自的高低优先规则，条件因子按是否满足筛选。</p>
        <p>比较包含单因子5%档位、两因子不同顺序与若干比例、三因子不同顺序的20%和50%档位，并细查前五组附近参数。不是把所有组合和参数全部算完；这里的“第一名”仅指本次比较范围内。</p>
        <p>年化超额＝策略年化收益－同区间基准年化收益。单边综合费用${report.settings.cost_bps}bp，沿用现有调仓和数据口径。${report.market === 'a' ? 'A股为不复权价格收益，不计现金分红，除权除息会影响结果。' : '港股含已核验分红与送股，恒生综合为价格指数；缺失行情等处理沿用现有引擎，结果不等于严格可交易的完整总回报。'} 两个市场不要直接横向比高低。</p>
        <p>股票池是所标季度的筛选名单，不是今天的买入建议或实际成交持仓。最新名单可能尚无完整持有期收益。历史排名不保证未来表现；各窗口独立从现金开始，不能机械拼接净值。</p>
      </details>`;
    detailsSection.querySelector('details').before(host.querySelector('.ranking-rules'));
    existing['factor-definitions'].innerHTML = `<div class="factor-table-wrap" tabindex="0" role="region" aria-label="七个因子及构建方法"><table class="factor-summary-table"><thead><tr><th>因子</th><th>怎么构建</th><th>怎么筛</th></tr></thead><tbody>${manifest.summary.factors.map(f => `<tr><td>${escape(f.name)}</td><td>${escape(f.formula)}</td><td>${f.kind === 'condition' ? '按是否满足条件筛选' : f.direction === 'low' ? '数值低的优先' : '数值高的优先'}</td></tr>`).join('')}</tbody></table></div><p class="muted">TTM指最近12个月。前两项是研究指标，不是公司承诺的股息率或分红比例。</p>`;
    methodSection.innerHTML = `<h2>三、怎么选、怎么买卖</h2><dl class="method-lines">
      <div><dt>什么时候选</dt><dd>${report.market === 'a' ? '每个季度末按当时可得的因子选股，下一交易日收盘调仓。' : '按固定财报季选股，在财报集中披露结束后的约定首个交易日调仓。不是每天换股。'}</dd></div>
      <div><dt>怎么选</dt><dd>可以选一个或多个因子，并调整顺序和保留比例。比如先保留20%，再在剩余股票中保留50%；不是把两个全市场排名直接叠加。需要的指标缺失，就不参加这一步筛选。</dd></div>
      <div><dt>怎么买卖</dt><dd>按名单等权配置，持有到下一次调仓，再按新名单调整。${report.market === 'a' ? '实际成交受涨跌停、停牌和可用行情约束，买不到的资金留作现金。' : '持有期间权重会随价格变化；交易与缺失行情处理沿用现有研究口径，不等同于实际成交。'} 本次单边费用为${report.settings.cost_bps}bp（${(report.settings.cost_bps / 100).toFixed(2)}%）。</dd></div>
      <div><dt>最后看什么</dt><dd>看净值、年化收益、相对${benchmark}的超额、年化波动率、Sharpe、平均年度最大回撤，以及每期股票的新增、保留、移出。${report.market === 'a' ? 'A股按不复权价格计算，不含现金分红。' : '港股收益含已核验现金分红与送股，基准是价格指数，两者并非完全相同口径。'}</dd></div>
      </dl>`;
    const chosen = () => report.top.find(r => r.rank === Number(document.getElementById('ranking-choice').value));
    const update = () => {
      const r = chosen();
      document.getElementById('ranking-selection').textContent = `第${r.rank}名 · 净值区间 ${r.start} 至 ${r.end}；最新候选池 ${r.latestQuarter}，${r.latestPool.length}只。相对 ${r.previousQuarter}：新增${r.changes.added}只、保留${r.changes.retained}只、移出${r.changes.removed}只。下载包含参数、收益、净值和历期名单。`;
    };
    document.getElementById('ranking-choice').addEventListener('change', update);
    update();
    const bind = (id, fn) => document.getElementById(id).addEventListener('click', async () => {
      const button = document.getElementById(id);button.disabled = true;
      const status = document.getElementById('ranking-action-status');status.textContent = '';
      try { await fn(chosen()); } catch (e) { status.textContent = e.message; } finally { button.disabled = false; }
    });
    const apply = r => {
      for (const [id, value] of [['start-quarter', report.settings.start], ['end-quarter', report.settings.end], ['cost-bps', report.settings.cost_bps]]) document.getElementById(id).value = value;
      sendLab(r.steps);
      const catalog = document.getElementById('published-strategy');if (catalog) catalog.value = r.id;
    };
    bind('ranking-curve', async r => {apply(r);await backtest('lab-result', r.steps);});
    bind('ranking-pool', async r => {apply(r);document.getElementById('pool-quarter').value = r.latestQuarter;document.getElementById('compare-quarter').value = r.previousQuarter;page('pools');await pool(true);});
    bind('ranking-download', async r => {
      const info = manifest.files[r.xlsx];if (!info) throw Error('未发布该组下载文件');
      const response = await fetch('./' + r.xlsx + '?v=' + info.sha256.slice(0, 12));if (!response.ok) throw Error('下载失败，请重试');
      const bytes = await response.arrayBuffer();const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
      if (bytes.byteLength !== info.bytes || hash !== info.sha256) throw Error('下载文件版本不一致，请刷新后重试');
      const url = URL.createObjectURL(new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
      const a = document.createElement('a');a.href = url;a.download = `${report.market === 'a' ? 'A股' : '港股'}_参数排名${r.rank}_股票池与净值.xlsx`;a.click();setTimeout(() => URL.revokeObjectURL(url), 2000);
    });
    host.dataset.ready = 'true';
  } catch (e) {
    host.innerHTML = '<h2>参数对比结论</h2><p role="alert">' + escape(e.message) + '</p>';
  }
});
