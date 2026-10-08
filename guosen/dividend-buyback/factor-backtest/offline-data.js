'use strict';
window.OfflineData=(()=>{
 let manifest,lastSearch;const cache=new Map();
 const id=ss=>ss.map(s=>s.id+'-'+(s.q??s.value)).join('__')||'all';
 const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 async function init(){if(!manifest){const r=await fetch('./manifest.json',{cache:'no-cache'});if(!r.ok)throw Error('无法读取发布目录');manifest=await r.json();}return manifest;}
 async function load(path){await init();if(cache.has(path))return cache.get(path);const info=manifest.files[path];if(!info)throw Error('未发布这个数据分块');const p=(async()=>{const r=await fetch('./'+path+'?v='+info.sha256.slice(0,12));if(!r.ok)throw Error('数据加载失败，请刷新重试');const bytes=await r.arrayBuffer();if(bytes.byteLength!==info.bytes||await sha(bytes)!==info.sha256)throw Error('文件版本校验不一致，请稍后刷新；未使用可疑结果');if(typeof DecompressionStream==='undefined')throw Error('请使用支持gzip解压的新版Chrome、Edge或Safari');return JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text());})();cache.set(path,p);try{return await p;}catch(e){cache.delete(path);throw e;}}
 function select(rows,steps){
  let selected=[...rows];const funnel=[],seen=new Set();
  if(!Array.isArray(steps)||steps.length>7)throw Error('筛选参数错误');
  for(const s of steps){const f=manifest.summary.factors.find(f=>f.id===s.id);if(!f||seen.has(s.id))throw Error('因子重复或不存在');seen.add(s.id);const before=selected.length,valid=selected.filter(r=>typeof r[f.field]==='number'&&Number.isFinite(r[f.field]));
   if(f.kind==='rank'){if(!manifest.summary.grid.includes(s.q))throw Error('分位比例须为5%步进');const direction=f.direction==='high'?-1:1;valid.sort((a,b)=>direction*(a[f.field]-b[f.field])||(a.wind_code<b.wind_code?-1:a.wind_code>b.wind_code?1:0));selected=valid.slice(0,Math.ceil(valid.length*s.q/100));}
   else{if(!(s.id==='f3'?[0,1]:[1]).includes(s.value))throw Error('条件参数错误');selected=valid.filter(r=>r[f.field]===s.value).sort((a,b)=>a.wind_code<b.wind_code?-1:a.wind_code>b.wind_code?1:0);}
   funnel.push({id:s.id,name:f.name,before,valid:valid.length,missing:before-valid.length,selected:selected.length});
  }return {rows:selected,funnel};
 }
 async function quarter(q){const pack=await load('data/quarters/'+q+'.json.gz');return pack.rows.map(values=>Object.fromEntries(pack.columns.map((k,i)=>[k,values[i]])));}
 async function pool(q,steps){const rr=await quarter(q),chosen=select(rr,steps);return {...chosen,quarter:q,signal_date:rr[0]?.quarter_end,count:chosen.rows.length,total:rr.length,steps,version:manifest.version,signature:manifest.version+':'+q+':'+id(steps)};}
 async function compare(a,b,steps){if(a>b)throw Error('比较起点不能晚于观察季度');const early=await pool(a,steps),late=await pool(b,steps),aa=new Set(early.rows.map(r=>r.wind_code)),bb=new Set(late.rows.map(r=>r.wind_code));return {early,late,added:late.rows.filter(r=>!aa.has(r.wind_code)),removed:early.rows.filter(r=>!bb.has(r.wind_code)),retained:late.rows.filter(r=>aa.has(r.wind_code)),signature:early.signature+late.signature};}
 function score(m,k){return k==='low_volatility'?-m.volatility:k==='low_drawdown'?m.max_drawdown:k==='robust_composite'?m.annual_return-m.volatility+m.max_drawdown:m[k];}
 async function search(b){const c=b.config,all=await load('data/candidates.json.gz');
  const matches=all.filter(r=>r.steps.length<=c.max_depth&&r.steps.every(s=>c.factors.includes(s.id))&&r.avg_holdings>=c.min_holdings&&r.avg_holdings<=c.max_holdings&&r.avg_pool_ratio>=c.min_pool_ratio&&r.avg_pool_ratio<=c.max_pool_ratio&&r.nonempty_ratio>=c.min_nonempty_ratio&&(c.min_annual_return==null||r.training.annual_return>=c.min_annual_return)&&(c.max_drawdown==null||-r.training.max_drawdown<=c.max_drawdown));
  const results=matches.map(r=>({...r,score:score(r.training,c.objective)})).filter(r=>Number.isFinite(r.score)).sort((a,b)=>b.score-a.score||id(a.steps).localeCompare(id(b.steps))).slice(0,c.top_n);
  return {id:'published',status:'completed',evaluated:all.length,budget:all.length,elapsed:0,errors:manifest.strategies.filter(x=>x.training_error).length,error_examples:manifest.strategies.filter(x=>x.training_error).slice(0,3).map(x=>x.id+': '+x.training_error),split:manifest.split,results,coverage:'仅对已发布候选库筛选排序，不是实时搜索，不代表全局最优。排名与约束只用训练期。'};
 }
 async function api(url,b={}){
  await init();const u=new URL(url,'https://local.invalid');
  if(u.pathname==='/api/summary')return manifest.summary;
  if(u.pathname==='/api/pool')return b.compare?compare(b.early,b.late,b.steps):pool(b.quarter,b.steps);
  if(u.pathname==='/api/backtest'){
   if(Object.keys(manifest.settings).some(k=>b[k]!==manifest.settings[k]))throw Error('该区间或费用尚未发布，请在本地终端计算后更新。');
   const r=manifest.strategies.find(r=>r.id===id(b.steps));if(!r)throw Error('此组合尚未预计算。可以查看股票池，或从“已发布策略”列表选择；新收益需本地计算后发布。');if(r.status!=='ok')throw Error('此配置未通过本地数据校验：'+r.error);return load(r.file);
  }
  if(u.pathname==='/api/coverage'){const out=[];for(const q of manifest.summary.quarters){const r=await pool(q,b.steps);out.push({quarter:q,count:r.count,total:r.total});}return out;}
  if(u.pathname==='/api/matrix'){if(b.x===b.y)throw Error('请选择两个不同因子');const factors=Object.fromEntries(manifest.summary.factors.map(f=>[f.id,f]));const x=factors[b.x].kind==='rank'?manifest.summary.grid:[1],y=factors[b.y].kind==='rank'?manifest.summary.grid:[1],rows=await quarter(b.quarter);const step=(f,n)=>({id:f,...(factors[f].kind==='rank'?{q:n}:{value:n})});return {x,y,cells:x.map(a=>y.map(v=>select(rows,[step(b.x,a),step(b.y,v)]).rows.length))};}
  if(u.pathname==='/api/trace'){const r=(await quarter(u.searchParams.get('quarter'))).find(x=>x.wind_code===u.searchParams.get('code'));if(!r)throw Error('未找到该股季度记录');return {note:'仅发布派生因子值。完整原始财务输入、来源文件及修订追溯请在本地终端核验。',...r};}
  if(u.pathname==='/api/code')return load('data/code.json.gz');
  if(u.pathname==='/api/search')return lastSearch=await search(b);
  if(u.pathname==='/api/job')return lastSearch;
  throw Error('该功能仅在本地完整版提供');
 }
 function save(name,body,type){const href=URL.createObjectURL(new Blob([body],{type})),a=document.createElement('a');a.href=href;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(href),2000);}
 function exportPool(result,format){if(format==='xlsx'){save('股票池及对比.json',JSON.stringify(result,null,2),'application/json');return;}
  const tables=result.early?[['较早',result.early.rows],['较晚',result.late.rows],['新进',result.added],['退出',result.removed],['留存',result.retained]]:[['精选股票池',result.rows]];
  const keys=['wind_code','stock_name','quarter','industry_current',...manifest.summary.factors.map(f=>f.field),'financial_report_period','financial_available_date'];
  const quote=v=>'"'+String(typeof v==='string'&&/^[=+\-@]/.test(v)?"'"+v:v??'').replaceAll('"','""')+'"';
  const lines=[['名单类别',...keys].map(quote).join(',')];for(const [name,rows] of tables)for(const r of rows)lines.push([name,...keys.map(k=>r[k])].map(quote).join(','));save('季度股票池及进出对比.csv','\ufeff'+lines.join('\r\n'),'text/csv;charset=utf-8');
 }
 return {api,init,select,quarter,load,exportPool};
})();
