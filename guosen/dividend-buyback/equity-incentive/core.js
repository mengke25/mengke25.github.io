'use strict';
// Finite cash, one entry attempt after each public first-implementation event.
const Incentive = (() => {
 const INITIAL=1000000;
 function lower(a,x){let l=0,h=a.length;while(l<h){const m=(l+h)>>1;if(a[m]<x)l=m+1;else h=m;}return l;}
 function monthDate(s,m){const [y,mo,day]=s.split('-').map(Number),d=new Date(Date.UTC(y,mo-1+m,1));const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),Math.min(day,last))).toISOString().slice(0,10);}
 function initialize(d){
  if(d.schema!=='incentive-v1'||d.symbols.length!==d.prices.length||d.days.length!==d.benchmark.length)throw Error('输入版本或长度不一致');
  if(d.days.some((x,i)=>i&&x<=d.days[i-1]))throw Error('日期重复或倒序');
  d.prices=d.prices.map(([start,op,cl,f])=>{
   if(op.length!==cl.length||f.length!==cl.length||start+cl.length!==d.days.length)throw Error('行情长度不一致');
   let last=NaN,lastDay=-1;const mark=[],real=[];
   cl.forEach((x,i)=>{if(x!==null){if(!(x>0))throw Error('价格不合法');last=x;lastDay=start+i;}mark.push(last);real.push(lastDay);});
   return {start,open:Float64Array.from(op,x=>x===null?NaN:x),close:Float64Array.from(cl,x=>x===null?NaN:x),mark:Float64Array.from(mark),real:Int32Array.from(real),flags:Uint8Array.from(f)};
  });
  d.byDay=Array.from({length:d.days.length},()=>[]);const seen=new Set();
  for(let r=0;r<d.events.length;r++){
   const e=d.events[r],key=e.c+'|'+e.ann;
   if(seen.has(key)||!d.symbols[e.c]||!d.days[e.day]||e.ann>=d.days[e.day]||(e.day>0&&e.ann<d.days[e.day-1]))throw Error('事件日期或唯一性不符');
   seen.add(key);d.byDay[e.day].push(r);
  }
  return d;
 }
 function quote(d,c,day,key){const p=d.prices[c],j=day-p.start;return j<0||j>=p.open.length?(key==='flags'?0:NaN):p[key][j];}
 function settings(d,p){
  if(!Number.isInteger(p.months)||p.months<1||p.months>12)throw Error('持有期须为 1—12 个月');
  if(![2,5,10,20].includes(p.weight))throw Error('单笔目标仓位无效');
  if(p.tool!=='全部'&&!d.events.some(e=>e.tools.includes(p.tool)))throw Error('激励工具无效');
  if(typeof p.nonST!=='boolean')throw Error('ST 选项无效');
  const a=lower(d.days,p.start),z=lower(d.days,p.end);
  if(d.days[a]!==p.start||d.days[z]!==p.end||a>z)throw Error('起止日期须为有效交易日，且开始不晚于结束');
  return {...p,a,z};
 }
 function metrics(rets,br){
  let v=1,b=1,peak=1,dd=0;for(let i=0;i<rets.length;i++){v*=1+rets[i];b*=1+br[i];peak=Math.max(peak,v);dd=Math.min(dd,v/peak-1);}
  const n=rets.length,mean=rets.reduce((a,b)=>a+b,0)/n;
  const vol=Math.sqrt(rets.reduce((s,r)=>s+(r-mean)**2,0)/n*244),annual=v**(244/n)-1,ba=b**(244/n)-1;
  return {days:n,total_return:v-1,benchmark_return:b-1,excess_return:v-b,annual_return:annual,benchmark_annual:ba,excess_annual:annual-ba,volatility:vol,sharpe:vol?annual/vol:null,max_drawdown:dd,relative_return:v/b-1};
 }
 function run(d,raw){
  const p=settings(d,raw),held=new Map(),trades=[],decisions=[],nav=[];
  let cash=INITIAL,prevEquity=INITIAL;
  for(let day=p.a;day<=p.z;day++){
   for(const [c,h] of held){
    if(d.days[day]<h.due)continue;
    if(!(quote(d,c,day,'flags')&4)){decisions.push({day,r:h.r,side:'卖出',reason:'到期但无可卖开盘，顺延'});continue;}
    const price=quote(d,c,day,'open'),amount=h.qty*price;cash+=amount;
    trades.push({day,r:h.r,side:'卖出',price,qty:h.qty,amount,entry:h.entry,due:h.due,pnl:amount-h.cost,return:amount/h.cost-1});held.delete(c);
   }
   const candidates=[],signals=new Map();
   for(const r of d.byDay[day]){
    const e=d.events[r];if(p.tool!=='全部'&&!e.tools.includes(p.tool))continue;
    if(signals.has(e.c))decisions.push({day,r:signals.get(e.c),side:'买入',reason:'同交易日同股多事件，采用最近公告'});
    signals.set(e.c,r);
   }
   for(const r of signals.values()){
    const e=d.events[r],c=e.c,f=quote(d,c,day,'flags');
    if(p.tool!=='全部'&&!e.tools.includes(p.tool))continue;
    let reason=held.has(c)?'已持有，不叠加或重置期限':!(f&1)?'缺价或无成交量':p.nonST&&!(f&16)?'历史 ST 快照缺失':p.nonST&&!(f&8)?'历史 ST 快照未通过':!(f&2)?'无可买开盘或开盘涨停限制':null;
    if(reason)decisions.push({day,r,side:'买入',reason});else candidates.push(r);
   }
   const budget=candidates.length?Math.min(prevEquity*p.weight/100,cash/candidates.length):0;
   for(const r of candidates){
    if(budget<.000001){decisions.push({day,r,side:'买入',reason:'可用现金不足，跳过本次事件'});continue;}
    const e=d.events[r],price=quote(d,e.c,day,'open'),qty=budget/price,due=monthDate(d.days[day],p.months);
    cash-=budget;held.set(e.c,{r,qty,entry:day,due,cost:budget});
    trades.push({day,r,side:'买入',price,qty,amount:budget,entry:day,due,pnl:null,return:null});
   }
   if(Math.abs(cash)<1e-7)cash=0;
   let value=0,stale=0;for(const [c,h] of held){value+=h.qty*quote(d,c,day,'mark');if(quote(d,c,day,'real')<day)stale++;}
   const equity=cash+value;if(!Number.isFinite(equity)||equity<=0||cash<-.000001)throw Error('资金账本不平衡：'+d.days[day]);
   nav.push([equity/INITIAL,cash,value,held.size,stale]);prevEquity=equity;
  }
  const base=p.a?d.benchmark[p.a-1]:1,bench=d.benchmark.slice(p.a,p.z+1).map(v=>v/base);
  const rets=nav.map((r,i)=>r[0]/(i?nav[i-1][0]:1)-1),br=bench.map((v,i)=>v/(i?bench[i-1]:1)-1);
  const sells=trades.filter(t=>t.side==='卖出'),summary={...metrics(rets,br),buys:trades.length-sells.length,sells:sells.length,open:held.size,cash,fees:0,win_rate:sells.length?sells.filter(t=>t.pnl>0).length/sells.length:null};
  function grouped(fn){const g=new Map();rets.forEach((_,i)=>{const k=fn(i);if(!g.has(k))g.set(k,[]);g.get(k).push(i);});return [...g].map(([label,ids])=>({label,...metrics(ids.map(i=>rets[i]),ids.map(i=>br[i]))}));}
  return {params:p,nav,bench,trades,decisions,summary,yearly:grouped(i=>d.days[p.a+i].slice(0,4)),regimes:grouped(i=>d.regime[p.a+i])};
 }
 function inspect(d,res,day){
  const p=res.params;if(!Number.isInteger(day)||day<p.a||day>p.z)throw Error('查看日期超出回测区间');
  const held=new Map();for(const t of res.trades){if(t.day>day)break;const c=d.events[t.r].c;if(t.side==='买入')held.set(c,t);else held.delete(c);}
  const trades=res.trades.filter(t=>t.day===day),decisions=res.decisions.filter(t=>t.day===day);
  const pool=d.byDay[day].filter(r=>p.tool==='全部'||d.events[r].tools.includes(p.tool)).map(r=>{
   const t=trades.find(t=>t.r===r&&t.side==='买入'),skip=decisions.find(t=>t.r===r&&t.side==='买入');
   return {r,status:t?'已买入':skip?skip.reason:'未成交',price:quote(d,d.events[r].c,day,'open')};
  });
  const holdings=[...held].map(([c,t])=>({r:t.r,entry:d.days[t.entry],due:t.due,qty:t.qty,cost:t.amount,mark:quote(d,c,day,'mark'),markDate:d.days[quote(d,c,day,'real')],value:t.qty*quote(d,c,day,'mark'),overdue:d.days[day]>=t.due}));
  const v=holdings.reduce((s,h)=>s+h.value,0);if(Math.abs(v-res.nav[day-p.a][2])>1e-5)throw Error('持仓与净值不一致');
  return {pool,holdings,trades,decisions};
 }
 return {INITIAL,initialize,settings,run,inspect,quote,monthDate,lower,metrics};
})();
if(typeof module!=='undefined')module.exports=Incentive;
