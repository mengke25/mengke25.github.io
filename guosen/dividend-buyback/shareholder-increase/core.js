'use strict';
// Pure account engine, usable from a Web Worker or Node verification harness.
const FixedHold=(()=>{
 const INITIAL=1e6;
 const round=x=>Math.round(x*1e10)/1e10;
 function settings(p){
  if(!Number.isFinite(p.m)||p.m<1||p.m>10||p.m*2!==Math.floor(p.m*2))throw Error('增持比例须为 1%—10%，每档 0.5%');
  if(!Number.isInteger(p.band)||p.band<0||p.band>10)throw Error('被套区间无效');
  if(!Number.isInteger(p.months)||p.months<1||p.months>24)throw Error('持有期须为 1—24 个月');
  if(!Number.isInteger(p.mask)||p.mask<0||p.mask>63)throw Error('门槛选择无效');
  if(!['off','gt','ge','lt','le'].includes(p.op)||!Number.isFinite(p.cut)||p.cut<0||p.cut>100)throw Error('剔除条件无效');
  if(!Array.isArray(p.excluded)||p.excluded.some(c=>!Number.isInteger(c)||c<0))throw Error('剔除股票无效');
  return {...p,excluded:[...new Set(p.excluded)].sort((a,b)=>a-b)};
 }
 function qualifies(price,cost,p){
  if(!Number.isFinite(price)||price<=0||!Number.isFinite(cost)||cost<=0)return false;
  const u=round(Math.max(0,(1-price/cost)*100));
  if(p.band===0 ? u!==0 : !(u>(p.band-1)*10 && u<=p.band*10))return false;
  return !((p.op==='gt'&&u>p.cut)||(p.op==='ge'&&u>=p.cut)||(p.op==='lt'&&u<p.cut)||(p.op==='le'&&u<=p.cut));
 }
 function monthDate(s,m){
  const [y,mo,d]=s.split('-').map(Number),target=new Date(Date.UTC(y,mo-1+m,1));
  const max=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth(),Math.min(d,max))).toISOString().slice(0,10);
 }
 function lower(days,date){let l=0,h=days.length;while(l<h){let m=(l+h)>>1;if(days[m]<date)l=m+1;else h=m;}return l;}
 function initialize(data){
  if(data.schema!=='fixed-hold-input-v1')throw Error('固定持有期输入版本不符');
  const size=data.symbols.length;
  if(size!==data.prices.length||data.days.length!==data.benchmark.length)throw Error('输入长度不一致');
  data.prices=data.prices.map(row=>{
   const [start,op,cl,flags]=row;let last=NaN;
   if(op.length!==cl.length||cl.length!==flags.length)throw Error('行情切片长度不一致');
   const close=Float64Array.from(cl,x=>x===null?NaN:x),open=Float64Array.from(op,x=>x===null?NaN:x);
   const mark=Float64Array.from(close,v=>{if(Number.isFinite(v))last=v;return last;});
   return {start,open,close,mark,flags:Uint8Array.from(flags)};
  });
  data.events=data.refs.map((r,i)=>[r[5],i]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  return data;
 }
 const quote=(d,c,day,key)=>{const s=d.prices[c],i=day-s.start;return i<0||i>=s.close.length?(key==='flags'?0:NaN):s[key][i];};
 function gateOK(d,c,day,mask,open=false){return mask===0||(d.gates[(open?d.gateOpen:d.gateClose)[day]][c]&mask)===mask;}
 function run(d,raw){
  const p=settings(raw),N=d.days.length,K=d.symbols.length,excluded=new Set(p.excluded);
  if(p.excluded.some(c=>c>=K))throw Error('剔除股票不在当前数据中');
  const lock=new Int32Array(K).fill(-1),ref=new Int32Array(K).fill(-1),qty=new Float64Array(K);
  const entry=new Int32Array(K).fill(-1),due=new Int32Array(K).fill(-1),dueDate=Array(K).fill('');
  const used=new Set(),trades=[],blocked=[],nav=[],holdDates=Array(N),holdingDates=Array(N);
  for(let i=0;i<N;i++){holdDates[i]=monthDate(d.days[i],p.months);holdingDates[i]=lower(d.days,holdDates[i]);}
  let cash=INITIAL,e=0;
  function updates(slot){
   while(e<d.events.length&&d.events[e][0]<=slot){
    const r=d.events[e++][1],v=d.refs[r];if(round(v[4]*100)>=p.m)ref[v[0]]=r;
   }
  }
  function candidate(c,day,open){
   const r=ref[c];
   return r>=0&&!used.has(r)&&lock[c]<0&&!excluded.has(c)&&gateOK(d,c,day,p.mask,open)&&qualifies(quote(d,c,day-(open?1:0),'close'),d.refs[r][3],p);
  }
  for(let day=0;day<N;day++){
   updates(2*day);
   const sold=[];
   for(let c=0;c<K;c++){
    if(lock[c]<0||day<due[c])continue;
    if(!(quote(d,c,day,'flags')&4)){blocked.push([day,lock[c],'S','到期但无可成交开盘']);continue;}
    const price=quote(d,c,day,'open'),amount=qty[c]*price;
    cash+=amount;
    trades.push([day,lock[c],'S',price,qty[c],amount,0,entry[c],dueDate[c],due[c]]);
    sold.push(c);lock[c]=-1;qty[c]=0;entry[c]=-1;due[c]=-1;dueDate[c]='';
   }
   if(cash>0){
    const eligible=[];
    for(let c=0;c<K;c++)if(candidate(c,day,true)){
     if(quote(d,c,day,'flags')&2)eligible.push(c);
     else blocked.push([day,ref[c],'B','无可成交开盘或开盘涨停限制']);
    }
    if(eligible.length){
     const allocation=cash/eligible.length;cash=0;
     for(const c of eligible){
      const r=ref[c],price=quote(d,c,day,'open');
      qty[c]=allocation/price;lock[c]=r;entry[c]=day;due[c]=holdingDates[day];dueDate[c]=holdDates[day];used.add(r);
      trades.push([day,r,'B',price,qty[c],allocation,0,day,dueDate[c],due[c]]);
     }
    }
   }
   updates(2*day+1);
   let value=0,held=0,count=0,overdue=0;
   for(let c=0;c<K;c++){
    if(lock[c]>=0){held++;value+=qty[c]*quote(d,c,day,'mark');if(day>=due[c])overdue++;}
    else if(candidate(c,day,false))count++;
   }
   const equity=cash+value;
   if(!Number.isFinite(equity)||equity<=0||cash<0)throw Error('账户不平衡：'+d.days[day]);
   nav.push([equity/INITIAL,cash,held,count,overdue]);
  }
  const stats=performance(nav.map(r=>r[0]),d.benchmark);
  return {params:p,nav,trades,blocked,summary:{...stats,initial_capital:INITIAL,final_equity:nav.at(-1)[0]*INITIAL,final_cash:cash,total_fees:0,buy_count:trades.filter(t=>t[2]==='B').length,sell_count:trades.filter(t=>t[2]==='S').length,account_open_count:nav.at(-1)[2]}};
 }
 function inspect(d,result,day){
  if(!Number.isInteger(day)||day<0||day>=d.days.length)throw Error('交易日无效');
  const p=result.params,used=new Set(),held=new Map(),refs=new Int32Array(d.symbols.length).fill(-1),excluded=new Set(p.excluded);
  for(const [slot,r] of d.events){if(slot>2*day+1)break;if(round(d.refs[r][4]*100)>=p.m)refs[d.refs[r][0]]=r;}
  for(const t of result.trades){
   if(t[0]>day)break;
   const c=d.refs[t[1]][0];if(t[2]==='B'){used.add(t[1]);held.set(c,t);}else held.delete(c);
  }
  const pool=[],holdings=[];
  for(let c=0;c<d.symbols.length;c++){
   const t=held.get(c),r=t?t[1]:refs[c];if(r<0)continue;
   const v=d.refs[r],price=quote(d,c,day,'close'),u=Number.isFinite(price)?Math.max(0,1-price/v[3]):null;
   const row={code:d.symbols[c],name:v[1],ref:r,c,ann:v[2],cost:v[3],ratio:v[4],close:Number.isFinite(price)?price:null,under:u};
   if(t){
    let markDay=day;while(markDay>=d.prices[c].start&&!Number.isFinite(quote(d,c,markDay,'close')))markDay--;
    holdings.push({...row,qty:t[4],mark:quote(d,c,day,'mark'),markDate:markDay>=0?d.days[markDay]:null,entry:d.days[t[7]],due:t[8],status:day>=t[9]?'到期未成交':'持有至到期'});
   }else if(!used.has(r)&&!excluded.has(c)&&gateOK(d,c,day,p.mask)&&qualifies(price,v[3],p))pool.push(row);
  }
  pool.sort((a,b)=>b.under-a.under||a.code.localeCompare(b.code));
  if(pool.length!==result.nav[day][3]||holdings.length!==result.nav[day][2])throw Error('股票池与账户不一致');
  return {pool,holdings,trades:result.trades.filter(t=>t[0]===day),blocked:result.blocked.filter(t=>t[0]===day)};
 }
 function performance(v,b){
  let peak=1,dd=0,active=1,previous=1,bprev=1;
  const rs=v.map((x,i)=>{const r=x/previous-1,br=b[i]/bprev-1;previous=x;bprev=b[i];active*=1+r-br;peak=Math.max(peak,x);dd=Math.min(dd,x/peak-1);return r;});
  const mean=rs.reduce((s,x)=>s+x,0)/rs.length,vol=Math.sqrt(244*rs.reduce((s,x)=>s+(x-mean)**2,0)/rs.length),ar=v.at(-1)**(244/v.length)-1;
  return {total_return:v.at(-1)-1,annual_return:ar,excess_return:v.at(-1)-b.at(-1),benchmark_return:b.at(-1)-1,excess_annual_return:active>=0?active**(244/v.length)-1:null,volatility:vol,sharpe:vol?ar/vol:null,max_drawdown:dd};
 }
 return {initialize,run,inspect,settings,qualifies,monthDate,lower,performance};
})();
if(typeof module!=='undefined')module.exports=FixedHold;
