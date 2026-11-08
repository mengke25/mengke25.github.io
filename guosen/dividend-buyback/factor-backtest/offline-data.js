'use strict';
window.OfflineData=(()=>{
 let manifest,lastSearch,gateMask=24,gateEpoch=0,worker,jobId=0;const cache=new Map(),pending=new Map(),results=new Map();
 const gateNames=(mask=gateMask)=>manifest.gates.items.filter(x=>mask&x.bit).map(x=>x.name).join('＋')||'不启用门槛';
 async function gateReport(mask=gateMask){const r=await load(`data/gates/${mask}/ranking.json.gz`);if(r.gate_mask!==mask||r.fingerprint!==manifest.gates.fingerprint||r.sourceVersion!==manifest.version||r.marketVersion!==manifest.market_version)throw Error('门槛排名版本不一致');return r;}
 function setGateMask(mask){if(!Number.isInteger(mask)||mask<0||mask>63)throw Error('门槛选项无效');gateMask=mask;gateEpoch++;lastSearch=null;if(worker){worker.terminate();worker=null;}for(const p of pending.values())p.reject(Error('门槛已改变，未采用旧结果'));pending.clear();}
 async function runBacktest(b){
  const mask=gateMask,epoch=gateEpoch,signature=manifest.gates.fingerprint+':'+mask+':'+id(b.steps);
  if(results.has(signature))return results.get(signature);
  const report=await gateReport(mask),ready=report.top.find(r=>r.id===id(b.steps));
  if(ready){const result=await load(ready.file);if(result.gate_mask!==mask||id(result.steps)!==id(b.steps))throw Error('净值与门槛参数不一致');results.set(signature,result);return result;}
  const meta=await load('inputs/gates/meta.json.gz'),pools=[];
  for(const p of meta.periods){pools.push((await pool(p.quarter,b.steps)).rows.map(r=>r.wind_code));if(epoch!==gateEpoch)throw Error('门槛已改变，请重新生成回测');}
  if(!worker){worker=new Worker('./a-gates-worker.js?v=20261108-1');worker.onmessage=({data:x})=>{const p=pending.get(x.id);if(!p)return;if(x.progress!==undefined){window.dispatchEvent(new CustomEvent('gate-compute-progress',{detail:x}));return;}pending.delete(x.id);x.error?p.reject(Error(x.error)):p.resolve(x.result);};worker.onerror=()=>{for(const p of pending.values())p.reject(Error('计算中断，请重新生成回测'));pending.clear();worker.terminate();worker=null;};}
  const result=await new Promise((resolve,reject)=>{const jid=++jobId;pending.set(jid,{resolve,reject});worker.postMessage({id:jid,mask,steps:b.steps,pools,signature,fingerprint:manifest.gates.fingerprint,files:manifest.files});});
  if(epoch!==gateEpoch)throw Error('门槛已改变，未采用旧回测');results.set(signature,result);return result;
 }
 const id=ss=>ss.map(s=>s.id+'-'+(s.q??s.value)).join('__')||'all';
 const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 async function init(){if(!manifest){const r=await fetch('./manifest.json',{cache:'no-cache'});if(!r.ok)throw Error('无法读取发布目录');manifest=await r.json();}return manifest;}
 async function load(path){await init();if(cache.has(path))return cache.get(path);const info=manifest.files[path];if(!info)throw Error('未发布这个数据分块');const p=(async()=>{const r=await fetch('./'+path+'?v='+info.sha256.slice(0,12));if(!r.ok)throw Error('数据加载失败，请刷新重试');const bytes=await r.arrayBuffer();if(bytes.byteLength!==info.bytes||await sha(bytes)!==info.sha256)throw Error('文件版本校验不一致，请稍后刷新；未使用可疑结果');if(typeof DecompressionStream==='undefined')throw Error('请使用支持gzip解压的新版Chrome、Edge或Safari');return JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text());})();cache.set(path,p);try{return await p;}catch(e){cache.delete(path);throw e;}}
 function select(rows,steps){
  let selected=rows.filter(r=>(r.gate_mask&gateMask)===gateMask);const funnel=gateMask?[{id:'gates',name:'6大门槛：'+gateNames(),before:rows.length,valid:selected.length,missing:rows.length-selected.length,selected:selected.length}]:[],seen=new Set();
  if(!Array.isArray(steps)||steps.length>7)throw Error('筛选参数错误');
  for(const s of steps){const f=manifest.summary.factors.find(f=>f.id===s.id);if(!f||seen.has(s.id))throw Error('因子重复或不存在');seen.add(s.id);const before=selected.length,valid=selected.filter(r=>typeof r[f.field]==='number'&&Number.isFinite(r[f.field]));
   if(f.kind==='rank'){if(!manifest.summary.grid.includes(s.q))throw Error('分位比例须为5%步进');const direction=f.direction==='high'?-1:1;valid.sort((a,b)=>direction*(a[f.field]-b[f.field])||(a.wind_code<b.wind_code?-1:a.wind_code>b.wind_code?1:0));selected=valid.slice(0,Math.ceil(valid.length*s.q/100));}
   else{if(!(s.id==='f3'?[0,1]:[1]).includes(s.value))throw Error('条件参数错误');selected=valid.filter(r=>r[f.field]===s.value).sort((a,b)=>a.wind_code<b.wind_code?-1:a.wind_code>b.wind_code?1:0);}
   funnel.push({id:s.id,name:f.name,before,valid:valid.length,missing:before-valid.length,selected:selected.length});
  }return {rows:selected,funnel};
 }
 async function quarter(q){const pack=await load('data/quarters/'+q+'.json.gz');return pack.rows.map(values=>Object.fromEntries(pack.columns.map((k,i)=>[k,values[i]])));}
 async function pool(q,steps){const rr=await quarter(q),chosen=select(rr,steps);return {...chosen,quarter:q,signal_date:rr[0]?.quarter_end,count:chosen.rows.length,total:rr.length,steps,gate_mask:gateMask,gate_names:gateNames(),gate_date:rr[0]?.gate_date,version:manifest.gates.fingerprint,signature:manifest.gates.fingerprint+':'+gateMask+':'+q+':'+id(steps)};}
 async function compare(a,b,steps){if(a>b)throw Error('比较起点不能晚于观察季度');const early=await pool(a,steps),late=await pool(b,steps),aa=new Set(early.rows.map(r=>r.wind_code)),bb=new Set(late.rows.map(r=>r.wind_code));return {early,late,added:late.rows.filter(r=>!aa.has(r.wind_code)),removed:early.rows.filter(r=>!bb.has(r.wind_code)),retained:late.rows.filter(r=>aa.has(r.wind_code)),signature:early.signature+late.signature};}
 function score(m,k){if(k==='excess_return')k='excess_annual_return';return k==='low_volatility'?-m.volatility:k==='low_drawdown'?m.max_drawdown:k==='robust_composite'?m.annual_return-m.volatility+m.max_drawdown:m[k];}
 async function search(b){const c=b.config,all=await load(`data/gates/${gateMask}/candidates.json.gz`);
  const matches=all.filter(r=>r.full&&r.steps.length<=c.max_depth&&r.steps.every(s=>c.factors.includes(s.id))&&r.avg_holdings>=c.min_holdings&&r.avg_holdings<=c.max_holdings&&r.avg_pool_ratio>=c.min_pool_ratio&&r.avg_pool_ratio<=c.max_pool_ratio&&r.nonempty_ratio>=c.min_nonempty_ratio&&(c.min_annual_return==null||r.full.annual_return>=c.min_annual_return)&&(c.max_drawdown==null||-r.full.annual_mdd_mean<=c.max_drawdown));
  const results=matches.map(r=>({...r,score:r.full.sharpe})).filter(r=>Number.isFinite(r.score)).sort((a,b)=>b.score-a.score||id(a.steps).localeCompare(id(b.steps))).slice(0,c.top_n);
  return {id:'published',status:'completed',evaluated:all.length,budget:all.length,elapsed:0,errors:0,error_examples:[],gate_mask:gateMask,split:manifest.split,results,coverage:'当前门槛：'+gateNames()+'。仅对该门槛下已通过数据检查的候选筛选排序，不是全空间穷尽。排名和约束使用完整回测区间；Sharpe降序，回撤约束使用平均年度最大回撤。历史筛选不是样本外检验。'};
 }
 async function api(url,b={}){
  await init();const u=new URL(url,'https://local.invalid');
  if(u.pathname==='/api/summary')return manifest.summary;
  if(u.pathname==='/api/pool')return b.compare?compare(b.early,b.late,b.steps):pool(b.quarter,b.steps);
  if(u.pathname==='/api/backtest'){
   if(Object.keys(manifest.settings).some(k=>b[k]!==manifest.settings[k]))throw Error('该区间或费用尚未发布，请在本地终端计算后更新。');
   return runBacktest(b);
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
 function exportPool(result,format){
  const tables=result.early?[['较早',result.early.rows],['较晚',result.late.rows],['新进',result.added],['退出',result.removed],['留存',result.retained]]:[['精选股票池',result.rows]];
  const keys=['wind_code','stock_name','quarter','gate_date','gate_mask','industry_current',...manifest.summary.factors.map(f=>f.field),'financial_report_period','financial_available_date'];
  const bound=result.late||result;
  if(format==='xlsx'){
   const fields={wind_code:'证券代码',stock_name:'证券名称',quarter:'信号季度',gate_date:'门槛快照日',gate_mask:'该股票通过标志',industry_current:'当前行业',financial_report_period:'财务报告期',financial_available_date:'财务可得日',...Object.fromEntries(manifest.summary.factors.map(f=>[f.field,f.name]))};
   const config={name:'参数',columns:[{label:'项目',width:24},{label:'内容',width:75}],rows:[['已启用门槛',bound.gate_names],['门槛选项值',bound.gate_mask],['因子顺序',bound.steps.map(s=>manifest.summary.factors.find(f=>f.id===s.id).name+' '+(s.q?s.q+'%':s.value?'满足':'不满足')).join(' → ')],['结果指纹',result.signature],['口径','按当时可得历史快照先筛门槛，再按因子顺序筛选；最新名单不代表已实现收益']]};
   save('A股_门槛'+bound.gate_mask+'_季度股票池.xlsx',PoolCompare.xlsx([config,...tables.map(([name,rows])=>({name,columns:keys.map(k=>({label:fields[k],width:22})),rows:rows.map(r=>keys.map(k=>r[k]))}))]),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');return;
  }
  const quote=v=>'"'+String(typeof v==='string'&&/^[=+\-@]/.test(v)?"'"+v:v??'').replaceAll('"','""')+'"';
  const lines=[['名单类别','已启用门槛','门槛选项值',...keys].map(quote).join(',')];for(const [name,rows] of tables)for(const r of rows)lines.push([name,bound.gate_names,bound.gate_mask,...keys.map(k=>r[k])].map(quote).join(','));save('季度股票池及进出对比.csv','\ufeff'+lines.join('\r\n'),'text/csv;charset=utf-8');
 }
 return {api,init,select,quarter,load,exportPool,gateReport,setGateMask,gateNames,getGateMask:()=>gateMask,getGateEpoch:()=>gateEpoch};
})();
