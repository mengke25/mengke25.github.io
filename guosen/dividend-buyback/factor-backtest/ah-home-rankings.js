'use strict';
window.AGateHome = (() => {
  const get = id => document.getElementById(id), escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const percent = v => Number.isFinite(v) ? (v * 100).toFixed(2) + '%' : '—';
  let host, manifest;
  function setup() {
    host = document.createElement('section');host.id = 'parameter-ranking';host.className = 'parameter-ranking';host.setAttribute('aria-label', '参数对比结论');
    const old = Object.fromEntries(['stats','market-note','regime-method','regime-intervals','factor-definitions','coverage-table'].map(id => [id, get(id)]));
    const factors = document.createElement('section');factors.id = 'overview-factors';factors.className = 'overview-section';
    factors.innerHTML = '<h2>二、有哪些因子，怎么构建</h2><p>上方六项是前置门槛，先决定哪些股票能参加筛选。下面七个是红利因子，再按你设定的顺序和比例选股。</p>';factors.append(old['factor-definitions']);
    const method = document.createElement('section');method.id = 'overview-method';method.className = 'overview-section';
    method.innerHTML = '<h2>三、怎么选、怎么买卖</h2><dl class="method-lines"><div><dt>先过门槛</dt><dd>六项独立勾选，默认“历史非ST＋净利润非负”。所选条件须同时满足；全部不选，就不加这六项限制。先过门槛，再筛红利因子。</dd></div><div><dt>什么时候选</dt><dd>每个季度末，用当时已有的门槛快照和因子选股，下一交易日收盘调仓。不是每天换股。</dd></div><div><dt>怎么选</dt><dd>可以选一个或多个红利因子，调整顺序和保留比例。比如先保留20%，再在剩余股票中保留50%。需要的指标缺失，不参加该步筛选。</dd></div><div><dt>怎么买卖</dt><dd>按名单等权配置，持有到下次调仓再调整。受涨跌停、停牌和可用行情限制，买不到的资金留现金。沿用单边20bp费用，不复权价格收益，不计现金分红。</dd></div><div><dt>最后看什么</dt><dd>按Sharpe比较参数，再看净值、相对万得全A的超额、波动率、平均年度最大回撤，以及每期股票的新增、保留和移出。最新股票池不是已实现收益。</dd></div></dl>';
    const details = document.createElement('section');details.id = 'overview-details';details.className = 'overview-section overview-details';details.innerHTML = '<h2>四、数据与计算细节</h2><p class="muted">需要核对时再展开。</p>';
    const fold = (title, nodes, id) => {const d = document.createElement('details');if (id) d.id = id;const s = document.createElement('summary');s.textContent = title;d.append(s, ...nodes);details.append(d);};
    fold('6大门槛具体条件及历史快照', [], 'gate-method-detail');fold('本次参数比较范围', [], 'gate-ranking-detail');
    fold('数据范围、收益口径与限制', [old.stats, old['market-note']]);fold('牛市、熊市和震荡市怎么划分', [old['regime-method'],old['regime-intervals']]);fold('原始因子库季度覆盖（未过门槛）', [old['coverage-table']]);
    get('overview').replaceChildren(host, factors, method, details);
  }
  async function refresh(report) {
    manifest = await OfflineData.init();if (!host) setup();host.dataset.ready = 'false';
    report = report || await OfflineData.gateReport();
    if (report.gate_mask !== OfflineData.getGateMask()) throw Error('门槛与结论不一致');
    const fs = Object.fromEntries(manifest.summary.factors.map(f => [f.id, f])), label = steps => steps.map((s,i) => `${i+1}. ${escape(fs[s.id].name)}：${s.q ? `保留${fs[s.id].direction === 'low' ? '最低' : '最高'}${s.q}%` : s.value ? '满足条件' : '已知不满足'}`).join('<br>');
    const best = report.top[0], active = escape(OfflineData.gateNames());
    const info = `<p class="notice">本次前置门槛：${active}。先过门槛，再按下列因子顺序筛选。</p>`;
    host.innerHTML = '<h1>一、先看结论</h1>' + info + (best ? `
      <p class="ranking-takeaway">本次筛选中，排在前面的搭配是：<strong>${best.steps.map(s => escape(s.id === 'f5' ? '低负债' : fs[s.id].name)).join('＋')}</strong>。</p>
      <p>第一组 Sharpe <strong>${best.full.sharpe.toFixed(3)}</strong>，年化收益 <strong>${percent(best.full.annual_return)}</strong>，年化波动率 <strong>${percent(best.full.volatility)}</strong>，平均年度最大回撤 <strong>${percent(best.full.annual_mdd_mean)}</strong>。</p>
      <p class="muted">本次比较 ${report.tested.toLocaleString()} 组，按完整回测区间Sharpe从高到低排列。这是历史参数比较，不代表未来排名，也不是样本外检验。</p>
      <div class="ranking-table-wrap" tabindex="0" role="region" aria-label="前三组参数与收益，可横向滚动"><table class="ranking-table"><thead><tr><th>排名</th><th>因子组合与参数（按顺序筛选）</th><th>Sharpe ↓</th><th>年化收益</th><th>年化超额</th><th>年化波动率</th><th>平均年度最大回撤</th></tr></thead><tbody>${report.top.map(r => `<tr><td>${r.rank}</td><td>${label(r.steps)}</td><td>${r.full.sharpe.toFixed(3)}</td><td>${percent(r.full.annual_return)}</td><td>${percent(r.full.excess_annual_return)}</td><td>${percent(r.full.volatility)}</td><td>${percent(r.full.annual_mdd_mean)}</td></tr>`).join('')}</tbody></table></div>
      <div class="ranking-actions"><label>查看哪一组<select id="ranking-choice" aria-label="选择排名">${report.top.map(r => `<option value="${r.rank}">第${r.rank}名</option>`).join('')}</select></label><button id="ranking-curve" class="primary">查看净值与年度表现</button><button id="ranking-pool">查看股票池及两期变化</button><button id="ranking-download">下载该组XLSX</button></div><p id="ranking-selection" class="notice"></p><p id="ranking-action-status" role="status"></p>` : '<p class="empty">这组门槛下，本次比较没有达到基础样本要求的组合，暂不列排名。你仍可在因子实验室自选参数、查看股票池和回测；这里不会为了凑排名放宽门槛。</p>');
    get('gate-ranking-detail').innerHTML = `<summary>本次参数比较范围</summary><p>本组门槛比较 ${report.tested} 组，符合要求且股票池不同的有 ${report.qualified} 组。要求每期非空、平均每期20—500只。相同股票池只保留一组参数。</p><p>比较包含单因子5%档位、两因子不同顺序与若干比例、三因子不同顺序的20%和50%档位，并细查前五组附近参数。不是穷尽所有参数；“第一名”仅指本次范围内。</p><p>平均年度最大回撤：各自然年的最大回撤等权平均，首尾不足一年按已有交易日计入。波动率为日收益样本标准差×√252；Sharpe为日均收益×252÷年化波动率，无风险利率取0。年化超额＝策略年化收益－同区间万得全A年化收益。不复权价格收益不含现金分红，除权除息会影响结果。</p>`;
    get('gate-method-detail').innerHTML = '<summary>6大门槛具体条件及历史快照</summary><ul>'+manifest.gates.items.map(x => '<li><strong>'+escape(x.name)+'</strong>：'+escape(x.rule)+'</li>').join('')+'</ul><p>沿用增持面板的历史门槛库，每年5、9、11月更新快照。季度末只用不晚于该日的最近快照，下一交易日收盘交易；新增股票无有效快照时不通过已启用门槛。历史非ST指快照日状态，不是按今天名称回溯。</p>'+manifest.gates.limitations.map(x => '<p class="muted">'+escape(x)+'</p>').join('');
    get('factor-definitions').innerHTML = `<div class="factor-table-wrap" tabindex="0" role="region" aria-label="七个因子及构建方法"><table class="factor-summary-table"><thead><tr><th>因子</th><th>怎么构建</th><th>怎么筛</th></tr></thead><tbody>${manifest.summary.factors.map(f => `<tr><td>${escape(f.name)}</td><td>${escape(f.formula)}</td><td>${f.kind === 'condition' ? '按是否满足筛选' : f.direction === 'low' ? '数值低的优先' : '数值高的优先'}</td></tr>`).join('')}</tbody></table></div><p class="muted">TTM指最近12个月。前两项是研究指标，不是公司承诺的股息率或分红比例。</p>`;
    if (best) {
      const chosen = () => report.top.find(r => r.rank === Number(get('ranking-choice').value));
      const update = () => {const r = chosen();get('ranking-selection').textContent = `第${r.rank}名 · 净值区间 ${r.start} 至 ${r.end}；最新候选池 ${r.latestQuarter}，${r.latestPool.length}只。相对${r.previousQuarter}：新增${r.changes.added}只、保留${r.changes.retained}只、移出${r.changes.removed}只。下载包含本次门槛、参数、收益、净值和历期名单。`;};
      get('ranking-choice').onchange = update;update();
      const bind = (id, fn) => get(id).onclick = async () => {const btn = get(id);btn.disabled = true;get('ranking-action-status').textContent = '';try {await fn(chosen());}catch(e){get('ranking-action-status').textContent = e.message;}finally{btn.disabled = false;}};
      bind('ranking-curve', async r => {sendLab(r.steps);await backtest('lab-result', r.steps);});
      bind('ranking-pool', async r => {sendLab(r.steps);get('pool-quarter').value = r.latestQuarter;get('compare-quarter').value = r.previousQuarter;page('pools');await pool(true);});
      bind('ranking-download', async r => {
        const info = manifest.files[r.xlsx];if (!info) throw Error('未发布下载文件');const res = await fetch('./'+r.xlsx+'?v='+info.sha256.slice(0,12));if (!res.ok) throw Error('下载失败，请重试');const bytes = await res.arrayBuffer();
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(bytes.byteLength!==info.bytes||hash!==info.sha256)throw Error('下载版本不一致，请刷新');
        const u = URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})),a=document.createElement('a');a.href=u;a.download=`A股_门槛${report.gate_mask}_排名${r.rank}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);
      });
    }
    host.dataset.ready = 'true';host.dataset.mask = String(report.gate_mask);window.refreshGateCatalog?.(report);return report;
  }
  return {refresh};
})();
