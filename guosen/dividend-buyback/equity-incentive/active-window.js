'use strict';
// Reporting window only. The execution engine's trades and complete cash ledger stay intact.
const ActiveWindow=(()=>{
 const empty=()=>({days:0,total_return:null,benchmark_return:null,benchmark_annual:null,excess_return:null,annual_return:null,excess_annual:null,excess_annual_return:null,volatility:null,sharpe:null,max_drawdown:null,annual_mdd_mean:null,relative_return:null});
 function metrics(v,b,dates){
  if(!v.length)return empty();
  if(v.length!==b.length||v.length!==dates.length||![...v,...b].every(x=>Number.isFinite(x)&&x>0))throw Error('绩效净值或基准不完整');
  let prev=1,peak=1,dd=0;const years=new Map(),returns=v.map((x,i)=>{const r=x/prev-1;prev=x;peak=Math.max(peak,x);dd=Math.min(dd,x/peak-1);const y=dates[i].slice(0,4);if(!years.has(y))years.set(y,{v:1,peak:1,dd:0});const g=years.get(y);g.v*=1+r;g.peak=Math.max(g.peak,g.v);g.dd=Math.min(g.dd,g.v/g.peak-1);return r;});
  const n=v.length,mean=returns.reduce((a,x)=>a+x,0)/n,vol=n>1?Math.sqrt(returns.reduce((a,x)=>a+(x-mean)**2,0)/(n-1)*244):null,annual=v.at(-1)**(244/n)-1,ba=b.at(-1)**(244/n)-1;
  return {days:n,total_return:v.at(-1)-1,benchmark_return:b.at(-1)-1,benchmark_annual:ba,excess_return:v.at(-1)-b.at(-1),annual_return:annual,excess_annual:annual-ba,excess_annual_return:annual-ba,volatility:vol,sharpe:vol?mean*244/vol:null,max_drawdown:dd,annual_mdd_mean:[...years.values()].reduce((s,x)=>s+x.dd,0)/years.size,relative_return:v.at(-1)/b.at(-1)-1};
 }
 function apply(d,result,kind){
  if(result.active)return result;
  const share=kind==='shareholder',a=share?result.startIndex:result.params.a,z=share?d.days.length-1:result.params.z;
  const first=result.trades.find(t=>share?t[2]==='B'&&t[5]>0:t.side==='买入'&&t.amount>0),index=first?(share?first[0]:first.day):null;
  result.selectedWindowSummary={...result.summary};
  if(index===null){
   result.active={startIndex:null,offset:null,firstEntryDate:null,baseDate:null,waitingDays:z-a+1,dates:[],nav:[],benchmark:[],yearly:[],regimes:[],summary:empty()};
  }else{
   if(index<a||index>z)throw Error('首次建仓超出所选区间');
   const offset=share?index:index-a,rows=result.nav.slice(offset,share?z+1:undefined),prior=offset?result.nav[offset-1][0]:1;
   if(Math.abs(prior-1)>1e-9)throw Error('首次买入前账户不应有盈亏');
   const priorBench=offset?result.bench[offset-1]:1,nav=rows.map(x=>x[0]/prior),benchmark=result.bench.slice(offset,share?z+1:undefined).map(x=>x/priorBench),dates=d.days.slice(index,z+1);
   const grouped=fn=>{
    const groups=new Map();dates.forEach((date,i)=>{const k=fn(date,i);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i);});
    return [...groups].map(([label,ids])=>{let v=1,b=1;const vv=[],bb=[];for(const i of ids){v*=nav[i]/(i?nav[i-1]:1);b*=benchmark[i]/(i?benchmark[i-1]:1);vv.push(v);bb.push(b);}return {label,...metrics(vv,bb,ids.map(i=>dates[i]))};});
   };
   result.active={startIndex:index,offset,firstEntryDate:dates[0],baseDate:index?d.days[index-1]:d.baseDate,waitingDays:index-a,dates,nav,benchmark,yearly:grouped(date=>date.slice(0,4)),regimes:grouped((date,i)=>d.regime?.[index+i]??d.regimes?.[index+i]??'未分类'),summary:metrics(nav,benchmark,dates)};
  }
  const w=result.active;result.summary={...result.summary,...w.summary,first_entry_date:w.firstEntryDate,statistics_base_date:w.baseDate,waiting_days:w.waitingDays};result.yearly=w.yearly;result.regimes=w.regimes;
  return result;
 }
 return {apply,metrics};
})();
if(typeof module!=='undefined')module.exports=ActiveWindow;
if(typeof globalThis!=='undefined')globalThis.ActiveWindow=ActiveWindow;
