'use strict';
// Read only version-bound, precomputed results; never calculate returns in the UI.
window.addEventListener('research-ready', async () => {
  const host = document.createElement('section');
  host.id = 'parameter-ranking';
  host.className = 'parameter-ranking';
  host.setAttribute('aria-label', '参数对比结论');
  document.querySelector('#overview .lead').after(host);
  host.innerHTML = '<h2>哪些因子搭配表现靠前？</h2><p role="status">正在读取参数对比结果…</p>';
  const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const percent = v => Number.isFinite(v) ? (v * 100).toFixed(2) + '%' : '—';
  try {
    const manifest = await OfflineData.init();
    const report = await OfflineData.load('data/parameter-ranking.json.gz');
    if (report.sourceVersion !== manifest.version || report.marketVersion !== manifest.market_version) throw Error('排名和当前数据版本不一致，未展示结果。');
    const factors = Object.fromEntries(manifest.summary.factors.map(f => [f.id, f]));
    const label = steps => steps.map((s, i) => `${i + 1}. ${escape(factors[s.id].name)}：${s.q ? `保留${factors[s.id].direction === 'low' ? '最低' : '最高'}${s.q}%` : s.value ? '满足条件' : '已知不满足'}`).join('<br>');
    const benchmark = report.market === 'a' ? '万得全A' : '恒生综合指数';
    host.innerHTML = `<h2>哪些因子搭配表现靠前？</h2>
      <p>本次比较了 ${report.tested.toLocaleString()} 组组合与参数。按前段历史中跑赢${benchmark}的幅度排序，列出前三组；再把后段表现放在旁边，看看是否延续。</p>
      <div class="ranking-table-wrap" tabindex="0" role="region" aria-label="前三组参数与收益，可横向滚动"><table class="ranking-table"><thead><tr><th>排名</th><th>因子组合与参数（按顺序筛选）</th><th>前段年化超额</th><th>后段年化超额</th><th>全部历史年化收益</th><th>全部历史年化超额</th><th>全部历史最大回撤</th><th>前段平均入选</th></tr></thead><tbody>${report.top.map(r => `<tr><td>${r.rank}</td><td>${label(r.steps)}</td><td>${percent(r.training.excess_annual_return)}</td><td>${percent(r.validation.excess_annual_return)}</td><td>${percent(r.full.annual_return)}</td><td>${percent(r.full.excess_annual_return)}</td><td>${percent(r.full.max_drawdown)}</td><td>${r.avg_holdings.toFixed(1)}只</td></tr>`).join('')}</tbody></table></div>
      <div class="ranking-actions"><label>查看哪一组<select id="ranking-choice" aria-label="选择排名">${report.top.map(r => `<option value="${r.rank}">第${r.rank}名</option>`).join('')}</select></label><button id="ranking-curve" class="primary">查看净值与年度表现</button><button id="ranking-pool">查看股票池及两期变化</button><button id="ranking-download">下载该组XLSX</button></div>
      <p id="ranking-selection" class="notice"></p><p id="ranking-action-status" role="status"></p>
      <details class="ranking-rules"><summary>查看比较范围与计算口径</summary>
        <p>前段：${report.bounds.front.join(' 至 ')}；后段：${report.bounds.later.join(' 至 ')}。排序只用前段，不根据后段表现挑选。相同股票池只保留一组参数；要求前段每期都能选出票，平均每期20—500只，符合要求且股票池不同的有 ${report.qualified} 组。</p>
        <p>保留比例是每一步剩余有效股票中的比例。例如先保留20%，再保留50%，不是两个独立的全市场排名。分位因子沿用各自的高低优先规则，条件因子按是否满足筛选。</p>
        <p>比较包含单因子5%档位、两因子不同顺序与若干比例、三因子不同顺序的20%和50%档位，并细查前五组附近参数。不是把所有组合和参数全部算完；这里的“第一名”仅指本次比较范围内。</p>
        <p>年化超额＝策略年化收益－同区间基准年化收益。单边综合费用${report.settings.cost_bps}bp，沿用现有调仓和数据口径。${report.market === 'a' ? 'A股为不复权价格收益，不计现金分红，除权除息会影响结果。' : '港股含已核验分红与送股，恒生综合为价格指数；缺失行情等处理沿用现有引擎，结果不等于严格可交易的完整总回报。'} 两个市场不要直接横向比高低。</p>
        <p>股票池是所标季度的筛选名单，不是今天的买入建议或实际成交持仓。最新名单可能尚无完整持有期收益。历史排名不保证未来表现；各窗口独立从现金开始，不能机械拼接净值。</p>
      </details>`;
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
