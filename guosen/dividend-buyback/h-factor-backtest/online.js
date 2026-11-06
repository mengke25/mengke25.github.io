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
 document.getElementById('published-count').textContent=release.strategies.filter(x=>x.file).length+' 项有完整净值；其余有效候选仅发布训练、验证与全样本指标';
 document.getElementById('search-run').textContent='筛选已发布候选';document.getElementById('search-stop').hidden=true;
 for(const id of ['search-budget','search-seconds'])document.getElementById(id).closest('label').hidden=true;
 document.getElementById('search-status').textContent='仅对本地预计算候选库进行筛选与训练期排序，不运行新的回测或全空间搜索。';
 document.querySelector('#reverse>p.muted').textContent='候选库覆盖单因子全部5%档位、两因子全部顺序的预算档位，以及三因子20%档的全部顺序。只按训练期指标排序与约束，验证期和全样本只用于展示；这不是全空间穷尽搜索，也不代表未来稳定或全局最优。';
 document.getElementById('single-result').innerHTML='<p class="empty">选择因子与档位，查看本地预先计算的收益。未通过数据核验的配置会明确提示。</p>';
 document.querySelector('#audit>p').textContent='此处展示生成线上结果的同一套筛选、季度交易和市场归因代码；股价和财务原始数据库保留本地，线上仅发布派生因子与研究结果。';
 document.getElementById('export-xlsx').textContent='下载固定择优XLSX';document.getElementById('export-xlsx').disabled=false;document.getElementById('export-xlsx').onclick=()=>{location.href='./downloads/h-share-best-pool.xlsx';};const poolHint=document.createElement('p');poolHint.className='notice';poolHint.textContent='CSV对应当前动态筛选；XLSX为预算约束发布候选库按训练期稳健综合选出的固定结果，内含真实训练、验证、全样本指标与历次调仓股票池。';document.getElementById('pool-note').after(poolHint);refreshContexts();
});
