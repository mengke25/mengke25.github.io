'use strict';
window.addEventListener('research-ready',async()=>{
 const release=await OfflineData.init();document.body.classList.add('online');
 document.getElementById('release-info').textContent=' 发布：'+release.generated.slice(0,10)+' · 因子截至 '+release.summary.quarters.at(-1);
 for(const [id,value] of [['start-quarter',release.settings.start],['end-quarter',release.settings.end],['cost-bps',release.settings.cost_bps]]){document.getElementById(id).value=value;document.getElementById(id).disabled=true;}
 const lab=document.getElementById('lab'),notice=document.createElement('div');notice.className='notice';notice.textContent='先应用上方6大门槛，再按这里的因子顺序筛选。任意因子组合均可生成股票池和净值；首次计算可能需要下载行情分块。研究区间及费用沿用本次发布。';lab.querySelector('h1').after(notice);
 const catalog=document.createElement('div');catalog.className='card controls';catalog.innerHTML='<label>本组门槛的前三名<select id="published-strategy"></select></label><button id="use-published">载入该策略</button><span id="published-count" class="muted"></span>';notice.after(catalog);
 let report;const fs=Object.fromEntries(release.summary.factors.map(f=>[f.id,f]));
 window.refreshGateCatalog=r=>{report=r;document.getElementById('published-strategy').replaceChildren(...r.top.map(x=>{const o=document.createElement('option');o.value=x.id;o.textContent='第'+x.rank+'名 · '+x.steps.map(s=>fs[s.id].name+' '+(s.q?s.q+'%':s.value?'满足':'不满足')).join(' → ');return o;}));document.getElementById('use-published').disabled=!r.top.length;document.getElementById('published-count').textContent=OfflineData.gateNames()+' · '+r.qualified+'组满足基础样本要求';};
 document.getElementById('use-published').onclick=()=>{const r=report?.top.find(x=>x.id===document.getElementById('published-strategy').value);if(r){sendLab(r.steps);backtest('lab-result',r.steps);}};
 document.getElementById('search-run').textContent='筛选本组门槛候选';document.getElementById('search-stop').hidden=true;
 for(const id of ['search-budget','search-seconds'])document.getElementById(id).closest('label').hidden=true;
 document.getElementById('search-status').textContent='按当前已应用门槛的候选库，比较完整回测区间Sharpe，不是全空间穷尽。';
 document.querySelector('#reverse>p.muted').textContent='只比较通过当前前置门槛的结果，按完整回测区间Sharpe降序排列；收益和平均年度最大回撤约束使用同一区间。';
 document.getElementById('single-result').innerHTML='<p class="empty">选择因子和比例，生成当前门槛下的净值。没有选中股票时保持现金，不虚构收益。</p>';
 document.querySelector('#audit>p').textContent='可查看门槛映射、筛选与交易计算代码；线上发布经过核验的派生输入，原始财务库仍保留在本地。';
 document.getElementById('export-xlsx').textContent='下载XLSX';refreshContexts();
});
