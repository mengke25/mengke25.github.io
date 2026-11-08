'use strict';
// Fresh-account rerun for one displayed parameter set, not a new parameter search.
window.RankingRun=(()=>{
 const jobs=new Map();
 function cancel(key){const job=jobs.get(key);if(job){job.worker.terminate();job.reject(Error('已取消旧计算'));jobs.delete(key);}}
 async function run(key,report,top,url,start,onProgress){
  cancel(key);if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||start<report.start||start>report.end)throw Error('起始日须在 '+report.start+' 至 '+report.end+' 之间。');
  const share=report.kind==='shareholder',p={...top.params,start,...(!share?{end:report.end}:{})},worker=new Worker(new URL('worker.js?v=active-20261108-1',url));let seq=0,meta;
  function ask(type,extra={}){return new Promise((resolve,reject)=>{
   const id=++seq;jobs.set(key,{worker,reject});worker.onerror=()=>reject(Error('计算未完成，请重试。'));
   worker.onmessage=({data:m})=>{if(m.progress||m.type==='progress'){onProgress(m.progress||m.message);return;}if(m.error||m.type==='error')return reject(Error(m.error||m.message));if(share?m.id===id:m.type===(type==='run'?'result':type)){resolve(share?m.payload:m);}};
   worker.postMessage({type,id,...extra});
  });}
  try{
   if(share)meta=(await ask('init')).meta;
   const ready=await ask('run',share?{p}:{params:p}),r=ready.result;meta=meta||ready.meta;const a=r.active;
   if(!a)throw Error('报告口径版本不一致，请刷新。');
   const day=share?meta.days.length-1:r.params.z,snap=await ask('inspect',share?{p,day}:{day}),detail=share?snap:snap.detail;
   const info=x=>{const e=meta.events[x.r];return {code:meta.symbols[e.c],name:meta.names[e.c],ann:e.ann,...x};};
   const pool=detail.pool.map(x=>({...(share?x:info(x)),status:share?'收盘候选；仍须确认成交条件和现金':x.status,exitRule:`实际买入后 ${p.months} 个自然月，到期可成交时卖出`})),holdings=share?detail.holdings:detail.holdings.map(info),s=r.summary;
   const buys=r.trades.filter(x=>share?x[2]==='B':x.side==='买入'),stocks=new Set(buys.map(x=>share?meta.refs[x[1]][0]:meta.events[x.r].c)).size;
   const full={total:s.total_return,annual:s.annual_return,benchmark:s.benchmark_return,benchmarkAnnual:s.benchmark_annual,drawdown:s.max_drawdown,annualMddMean:s.annual_mdd_mean,volatility:s.volatility,sharpe:s.sharpe,days:s.days,excessAnnual:s.excess_annual,buys:buys.length,sells:share?s.sell_count:s.sells,stocks};
   const accountDigest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(r.trades)))),x=>x.toString(16).padStart(2,'0')).join('');
   const next={...top,params:p,full,pool,holdings,cash:share?s.final_cash:s.cash,accountDigest,firstEntryDate:a.firstEntryDate,baseDate:a.baseDate,waitingDays:a.waitingDays,custom:true};
   if(a.firstEntryDate){const days=[a.baseDate,...a.dates];next.inlineNav={schema:'ranking-nav-v1',kind:report.kind,rank:top.rank,label:top.label,fingerprint:report.fingerprint,params:p,accountDigest,baseDate:a.baseDate,start,firstEntryDate:a.firstEntryDate,waitingDays:a.waitingDays,end:report.end,days,strategy:[1,...a.nav],benchmark:[1,...a.benchmark]};next.nav={points:days.length,baseDate:a.baseDate};}
   else{next.nav=null;next.inlineNav=null;}
   return {report:{...report,start},top:next};
  }finally{worker.terminate();if(jobs.get(key)?.worker===worker)jobs.delete(key);}
 }
 return {run,cancel};
})();
