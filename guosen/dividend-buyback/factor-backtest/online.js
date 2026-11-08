'use strict';
window.addEventListener('research-ready',async()=>{
 const release=await OfflineData.init();
 document.body.classList.add('online');
 document.getElementById('release-info').textContent=' 发布：'+release.generated.slice(0,10)+' · 因子截至 '+release.summary.quarters.at(-1);
 for(const [id,value] of [['start-quarter',release.settings.start],['end-quarter',release.settings.end],['cost-bps',release.settings.cost_bps]]){document.getElementById(id).value=value;document.getElementById(id).disabled=true;}
 const lab=document.getElementById('lab');
 const notice=document.createElement('div');notice.className='notice';notice.textContent='在线股票池支持任意顺序筛选和5%档位；回测只展示预计算结果。研究区间及费用随本次发布锁定。未预计算的组合不会生成收益。';lab.querySelector('h1').after(notice);
 const catalog=document.createElement('div');catalog.className='card controls';catalog.innerHTML='<label>已发布策略<select id="published-strategy"></select></label><button id="use-published">载入该策略</button><span id="published-count" class="muted"></span>';notice.after(catalog);
 const f=Object.fromEntries(release.summary.factors.map(x=>[x.id,x]));
 for(const r of release.strategies){const o=document.createElement('option');o.value=r.id;o.textContent=r.steps.map(s=>f[s.id].name+' '+(s.q?s.q+'%':s.value?'满足':'不满足')).join(' → ')+(r.status!=='ok'?' · 数据不足':r.file?'':' · 仅指标');document.getElementById('published-strategy').append(o);}
 document.getElementById('use-published').onclick=()=>{const r=release.strategies.find(x=>x.id===document.getElementById('published-strategy').value);sendLab(r.steps);backtest('lab-result',r.steps);};
 document.getElementById('published-count').textContent=release.strategies.filter(x=>x.file).length+' 项有完整净值；其余有效候选仅发布全区间统计指标';
 document.getElementById('search-run').textContent='筛选已发布候选';document.getElementById('search-stop').hidden=true;
 for(const id of ['search-budget','search-seconds'])document.getElementById(id).closest('label').hidden=true;
 document.getElementById('search-status').textContent='对已发布候选按完整回测区间 Sharpe 降序筛选，不运行新的回测或全空间搜索。';
 document.querySelector('#reverse>p.muted').textContent='按完整回测区间的 Sharpe 从高到低排列；收益和平均年度最大回撤约束也用同一区间。这里只搜索本次已计算且满足基础样本要求的候选，不是全空间穷尽，也不是样本外检验。';
 document.getElementById('single-result').innerHTML='<p class="empty">选择因子与档位，查看本地预先计算的收益。未通过数据核验的配置会明确提示。</p>';
 document.querySelector('#audit>p').textContent='此处展示生成线上结果的同一套筛选、季度交易和市场归因代码；股价和财务原始数据库保留本地，线上仅发布派生因子与研究结果。';
 document.getElementById('export-xlsx').textContent='下载JSON';refreshContexts();
});
