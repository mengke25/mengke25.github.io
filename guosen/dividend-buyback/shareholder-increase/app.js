'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(x,n=2)=>x==null||!Number.isFinite(x)?'—':x.toLocaleString('zh-CN',{minimumFractionDigits:n,maximumFractionDigits:n}),pct=x=>x==null?'—':num(x*100)+'%';
const labels={16:'历史非 ST',8:'净利润非负',1:'流动性',2:'股权质押',4:'商誉',32:'ROE'};
const bandText=b=>b===0?'0%（未被套）':`${(b-1)*10}—${b*10}%`;
let meta,manifest,current,allSix,detail,compareRows=[],page='method',day=0,busy=false,requestId=0,inspectVersion=0;
let excluded=new Set();const pending=new Map();
const worker=new Worker('./worker.js?v=sharpe-20261108');
worker.onmessage=({data:m})=>{const p=pending.get(m.id);if(!p)return;if(m.progress){p.progress?.(m.progress);return;}pending.delete(m.id);m.error?p.reject(Error(m.error)):p.resolve(m.payload);};
worker.onerror=()=>{for(const p of pending.values())p.reject(Error('计算线程未能运行，请使用新版 Chrome / Edge 刷新此页'));pending.clear();};
function ask(type,extra={},progress){return new Promise((resolve,reject)=>{const id=++requestId;pending.set(id,{resolve,reject,progress});worker.postMessage({id,type,...extra});});}
function error(e){$('error').textContent=e.message||String(e);$('error').hidden=false;}
function config(){return {m:Number($('ratio').value),band:Number($('band').value),months:Number($('months').value),mask:[...document.querySelectorAll('#gates input[type=checkbox]:checked')].reduce((s,x)=>s+Number(x.value),0),op:$('exclude-op').value,cut:Number($('exclude-cut').value),excluded:[...excluded].sort((a,b)=>a-b),start:$('start-date').value};}
function configText(p){const gates=Object.entries(labels).filter(([k])=>p.mask&k).map(([,v])=>v).join('、')||'不叠加门槛';const op={off:'不额外剔除',gt:'剔除 >',ge:'剔除 ≥',lt:'剔除 <',le:'剔除 ≤'};return `起始日 ${p.start||meta.days[0]} · 增持 ≥${p.m}% · 被套 ${bandText(p.band)} · 持有 ${p.months} 个月 · ${gates} · ${op[p.op]}${p.op==='off'?'':p.cut+'%'} · 指定剔除 ${p.excluded.length} 只`;}
function setBusy(value){busy=value;$('generate').disabled=value||!meta;$('compare-run').disabled=value||!current;poolComparison.block(value);}
function dirty(){const changed=current&&JSON.stringify(config())!==JSON.stringify(current.params);$('draft-note').textContent=changed?'选项尚未应用。点击“生成回测”后更新结果。':current?'下方为当前选项的结果。':'默认：历史非 ST + 净利润非负';$('exclude-cut').disabled=$('exclude-op').value==='off';}
function table(id,headers,rows){$(id).innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="empty">本条件下没有记录。</p>';}
function stats(id,items){$(id).innerHTML=items.map(([k,v])=>`<dl><dt>${esc(k)}</dt><dd>${esc(v)}</dd></dl>`).join('');}
function stock(code,name){return `<span class="stock-name">${esc(name)}</span><span class="code">${esc(code)}</span>`;}
function refStock(r){return stock(meta.symbols[meta.refs[r][0]],meta.refs[r][1]);}
function navTo(next){page=next;document.querySelectorAll('nav [data-page]').forEach(b=>b.toggleAttribute('aria-current',b.dataset.page===page));$('method').hidden=page!=='method';$('workspace').hidden=page==='method';['daily','account','compare','periods'].forEach(id=>$(id).hidden=id!==page);if(current){if(page==='account')drawAccount();if(page==='compare'&&compareRows.length)drawCompare();} }
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.page)));
for(let n=1;n<=10;n+=.5)$('ratio').add(new Option(`${n}%`,n));
for(let n=0;n<=10;n++)$('band').add(new Option(bandText(n),n));
for(let n=1;n<=24;n++)$('months').add(new Option(`${n} 个月`,n));
$('band').value=4;$('months').value=3;
document.querySelectorAll('#parameters select,#parameters input,#gates input[type=checkbox],#exclude-op,#exclude-cut').forEach(el=>el.addEventListener('input',dirty));
function chips(){ $('excluded-list').innerHTML=[...excluded].map(c=>`<button class="chip" data-remove="${c}" aria-label="取消剔除 ${esc(meta.symbols[c])}">${esc(meta.symbols[c])} ${esc(nameOf(c))} ×</button>`).join('');dirty();}
function nameOf(c){for(let i=meta.refs.length-1;i>=0;i--)if(meta.refs[i][0]===c)return meta.refs[i][1];return '';}
$('add-stock').onclick=()=>{const text=$('exclude-stock').value.trim(),matches=meta.symbols.map((code,c)=>({code,c,name:nameOf(c)})).filter(s=>text===s.code||text===s.code.split('.')[0]||text===s.name||text===s.code+' '+s.name);$('stock-error').textContent='';if(matches.length!==1){$('stock-error').textContent='请从提示中选择一个完整代码和名称，避免同名或代码不明确。';return;}excluded.add(matches[0].c);$('exclude-stock').value='';chips();};
$('clear-stocks').onclick=()=>{excluded.clear();chips();};
$('excluded-list').onclick=e=>{const b=e.target.closest('[data-remove]');if(b){excluded.delete(Number(b.dataset.remove));chips();}};
function setForm(p){$('ratio').value=p.m;$('band').value=p.band;$('months').value=p.months;$('start-date').value=p.start||meta.days[0];$('exclude-op').value=p.op;$('exclude-cut').value=p.cut;document.querySelectorAll('#gates input[type=checkbox]').forEach(c=>c.checked=!!(p.mask&Number(c.value)));excluded=new Set(p.excluded);chips();}
async function generate(p=config()){
 if(busy)return;
 if(!$('start-date').checkValidity()){error(Error('策略起始日须在 '+meta.days[0]+' 至 '+meta.days.at(-1)+' 之间。'));return;}
 if($('exclude-cut').value===''||!Number.isFinite(p.cut)||p.cut<0||p.cut>100){error(Error('剔除程度请填写 0—100 的数值。'));return;}
 setBusy(true);$('error').hidden=true;$('status').textContent='正在按当前条件重新计算每日账户…';$('content').hidden=true;
 try{
  const result=await ask('run',{p});current=result.result;allSix=result.allSix;detail=null;compareRows=[];$('compare-table').innerHTML='';$('compare-chart').hidden=true;$('export-compare').disabled=true;$('compare-status').textContent='';
  $('applied').textContent='当前结果：'+configText(current.params);$('content').hidden=false;
  $('date').min=current.effectiveStart;renderAccount();renderPeriods();await inspectDay(day);updatePoolComparison();dirty();$('status').textContent=`已计算 ${(meta.days.length-current.startIndex).toLocaleString()} 个交易日，从 ${current.effectiveStart} 开始。初始本金 100 万元，买卖费用为 0。`;
  if(page==='account')drawAccount();
 }catch(e){error(e);$('status').textContent='计算未完成，未显示旧结果作为本次结果。';}
 finally{setBusy(false);}
}
$('generate').onclick=()=>generate();
async function inspectDay(n){
 if(!current)return;day=Math.max(current.startIndex,Math.min(meta.days.length-1,n));$('date').value=meta.days[day];const version=++inspectVersion;
 try{const row=await ask('inspect',{p:current.params,day});if(version!==inspectVersion)return;detail=row;renderDay();}catch(e){error(e);}
}
$('date').onchange=()=>{let n=meta.days.findIndex(d=>d>=$('date').value);inspectDay(n<0?meta.days.length-1:n);};
$('prev').onclick=()=>inspectDay(day-1);$('next').onclick=()=>inspectDay(day+1);$('latest').onclick=()=>inspectDay(meta.days.length-1);$('first-buy').onclick=()=>inspectDay(current.trades.find(t=>t[2]==='B')?.[0]??current.startIndex);
function renderDay(){
 const n=current.nav[day];stats('day-stats',[['交易日',meta.days[day]],['可买候选',n[3]+' 只'],['实际持仓',n[2]+' 只'],['账户净值',num(n[0],4)],['现金（元）',num(n[1])],['到期未成交',n[4]+' 只']]);
 table('pool-table',['股票','合计增持','股东成本','收盘价','被套程度','披露日'],detail.pool.map(r=>[stock(r.code,r.name),pct(r.ratio),num(r.cost,4),num(r.close,4),pct(r.under),esc(r.ann)]));
 table('trade-table',['股票','买卖','成交价','数量（股）','金额（元）','买入日','计划到期'],detail.trades.map(t=>[refStock(t[1]),t[2]==='B'?'买入':'到期卖出',num(t[3],4),num(t[4],4),num(t[5]),meta.days[t[7]],t[8]]));
 table('blocked-table',['股票','尝试','未成交原因'],detail.blocked.map(t=>[refStock(t[1]),t[2]==='B'?'买入':'卖出',esc(t[3])]));
 table('holding-table',['股票','合计增持','股东成本','当日收盘','被套程度','数量（股）','估值价格 / 日期','买入日','计划到期','状态'],detail.holdings.map(r=>[stock(r.code,r.name),pct(r.ratio),num(r.cost,4),num(r.close,4),pct(r.under),num(r.qty,4),num(r.mark,4)+' / '+esc(r.markDate),esc(r.entry),esc(r.due),esc(r.status)]));
 $('prev').disabled=day===current.startIndex;$('next').disabled=day===meta.days.length-1;
}
function renderAccount(){const s=current.summary;
 stats('account-stats',[['累计收益',pct(s.total_return)],['万得全A收益',pct(s.benchmark_return)],['累计超额',pct(s.excess_return)],['年化收益',pct(s.annual_return)],['平均年度最大回撤',pct(s.annual_mdd_mean)],['年化波动',pct(s.volatility)],['Sharpe（无风险利率=0）',num(s.sharpe,3)],['实际买入 / 卖出',s.buy_count+' / '+s.sell_count]]);
 $('base-note').textContent=`选择起始日 ${current.params.start||meta.days[0]}；实际交易起点 ${current.effectiveStart}。比较基期 ${current.baseDate||meta.baseDate} 净值为 1，累计收益为 0；策略、六项对照和万得全A使用同一基期。回测至 ${meta.days.at(-1)}，不继承此前持仓；未用资金不计息。`;
}
function chart(id,traces,ytitle='净值'){
 const layout={margin:{l:60,r:22,t:25,b:45},paper_bgcolor:'#fff',plot_bgcolor:'#fff',font:{family:'Microsoft YaHei, sans-serif',color:'#36534f',size:12},legend:{orientation:'h',y:1.14},xaxis:{type:'date',gridcolor:'#edf1ef'},yaxis:{title:ytitle,gridcolor:'#edf1ef'},hovermode:'x unified',showlegend:true};
 if(!window.Plotly){$(id).textContent='图表未加载，请刷新；仍可下载每日净值。';return;}
 Plotly.react(id,traces,layout,{responsive:true,displaylogo:false,scrollZoom:false});
}
function drawAccount(){const a=current.startIndex,days=meta.days.slice(a),nav=current.nav.slice(a),x=[current.baseDate||meta.baseDate,...days];chart('nav-chart',[{x,y:[1,...nav.map(n=>n[0])],name:'当前策略',mode:'lines',line:{color:'#087e73',width:2}},{x,y:[1,...allSix.slice(a)],name:'六项全选对照',mode:'lines',line:{color:'#85959a',width:1.5,dash:'dot'}},{x,y:[1,...current.bench.slice(a)],name:'万得全A',mode:'lines',line:{color:'#b08741',width:1.5}}]);chart('capital-chart',[{x:days,y:nav.map(n=>n[1]/1e4),name:'现金',type:'scatter',stackgroup:'one',line:{color:'#a4c3be'}},{x:days,y:nav.map(n=>(n[0]*1e6-n[1])/1e4),name:'股票市值',type:'scatter',stackgroup:'one',line:{color:'#087e73'}}],'万元');}
function grouped(kind){
 const groups=new Map();for(let i=current.startIndex;i<meta.days.length;i++){
  const key=kind==='year'?meta.days[i].slice(0,4):meta.regime[i]||'未划分';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);
 }
 return [...groups].map(([key,ii])=>{let v=1,b=1;const vv=[],bb=[],dates=[];for(const i of ii){v*=current.nav[i][0]/(i>current.startIndex?current.nav[i-1][0]:1);b*=current.bench[i]/(i>current.startIndex?current.bench[i-1]:1);vv.push(v);bb.push(b);dates.push(meta.days[i]);}const m=FixedHold.performance(vv,bb,dates);return [key,ii.length,pct(m.total_return),pct(m.benchmark_return),pct(m.excess_return),pct(m.annual_return),pct(m.volatility),num(m.sharpe,3),pct(m.annual_mdd_mean)];});
}
function renderPeriods(){const h=['期间','交易日数','策略收益','万得全A','累计超额','年化收益','年化波动率','Sharpe','平均年度最大回撤'];table('years-table',h,grouped('year'));table('regime-table',h,grouped('regime'));}
$('compare-run').onclick=async()=>{if(busy||!current)return;setBusy(true);$('error').hidden=true;const p=current.params;
 try{compareRows=await ask('compare',{p},s=>$('compare-status').textContent=s);compareRows.sort((a,b)=>(b.sharpe??-Infinity)-(a.sharpe??-Infinity)||a.months-b.months);$('compare-status').textContent='完成，按 Sharpe 降序。其余条件：'+configText(p);$('compare-chart').hidden=false;drawCompare();table('compare-table',['持有月数','累计收益','万得全A','累计超额','年化收益','年化波动率','Sharpe','平均年度最大回撤','买入笔数','期末持仓','查看'],compareRows.map(r=>[r.months,pct(r.total_return),pct(r.benchmark_return),pct(r.excess_return),pct(r.annual_return),pct(r.volatility),num(r.sharpe,3),pct(r.annual_mdd_mean),r.buy_count,r.account_open_count,`<button data-month="${r.months}">应用 ${r.months} 月</button>`]));$('export-compare').disabled=false;}catch(e){error(e);}finally{setBusy(false);}
};
function drawCompare(){if(!window.Plotly)return;Plotly.react('compare-chart',[{x:compareRows.map(r=>r.months),y:compareRows.map(r=>r.total_return*100),type:'bar',name:'策略累计收益',marker:{color:'#087e73'}},{x:compareRows.map(r=>r.months),y:compareRows.map(r=>r.excess_return*100),type:'bar',name:'相对万得全A超额',marker:{color:'#b08741'}}],{barmode:'group',margin:{l:60,r:20,t:45,b:40},font:{family:'Microsoft YaHei'},legend:{orientation:'h'},xaxis:{title:'持有月数',dtick:1},yaxis:{title:'%'},paper_bgcolor:'#fff',plot_bgcolor:'#fff'},{responsive:true,displaylogo:false});}
$('compare-table').onclick=e=>{const b=e.target.closest('[data-month]');if(!b||busy)return;const p={...current.params,months:Number(b.dataset.month)};setForm(p);navTo('account');generate(p);};
function csv(name,headers,rows){if(!current)return;const p=current.params,extra=[configText(p),p.excluded.map(c=>meta.symbols[c]).join('|')];const cell=x=>{let s=String(x??'');if(/^[=+@\t\r]/.test(s)||(/^-[^\d.]/.test(s)))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const text='\ufeff'+[['当前配置','指定剔除代码',...headers],...rows.map(r=>[...extra,...r])].map(r=>r.map(cell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`${name}_增持${p.m}_区间${p.band}_持有${p.months}月_门槛${p.mask}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('export-pool').onclick=()=>detail&&csv('股票池_'+meta.days[day],['交易日','代码','名称','合计增持比例','成本','收盘','被套比例','披露日'],detail.pool.map(r=>[meta.days[day],r.code,r.name,r.ratio,r.cost,r.close,r.under,r.ann]));
$('export-holdings').onclick=()=>detail&&csv('持仓_'+meta.days[day],['交易日','代码','名称','成本','当日收盘','被套比例','数量','估值价格','估值日','买入日','计划到期','状态'],detail.holdings.map(r=>[meta.days[day],r.code,r.name,r.cost,r.close,r.under,r.qty,r.mark,r.markDate,r.entry,r.due,r.status]));
$('export-trades').onclick=()=>csv('全部成交',['成交日','代码','名称','买卖','成交价','数量','金额','费用','买入日','计划到期'],current.trades.map(t=>[meta.days[t[0]],meta.symbols[meta.refs[t[1]][0]],meta.refs[t[1]][1],t[2]==='B'?'买入':'卖出',...t.slice(3,7),meta.days[t[7]],t[8]]));
$('export-nav').onclick=()=>csv('每日账户',['交易日','策略净值','万得全A净值','六项全选对照','现金','股票市值','持仓数','可买数','到期未成交数'],current.nav.slice(current.startIndex).map((n,j)=>{const i=j+current.startIndex;return [meta.days[i],n[0],current.bench[i],allSix[i],n[1],n[0]*1e6-n[1],...n.slice(2)];}));
$('export-compare').onclick=()=>csv('持有期对比',['持有月数','累计收益','万得全A','累计超额','年化收益','年化波动率','Sharpe','平均年度最大回撤','买入笔数','期末持仓'],compareRows.map(r=>[r.months,r.total_return,r.benchmark_return,r.excess_return,r.annual_return,r.volatility,r.sharpe,r.annual_mdd_mean,r.buy_count,r.account_open_count]));
const poolColumns=[{key:'ratio',label:'合计增持',kind:'percent'},{key:'cost',label:'股东成本',kind:'number'},{key:'close',label:'当日收盘价',kind:'number'},{key:'under',label:'被套程度',kind:'percent'},{key:'ann',label:'披露日',kind:'date'}];
const poolComparison=PoolCompare.mount($('pool-comparison'),{
 load:(before,after,s)=>ask('poolCompare',{before,after,p:s.appliedParams}),rows:(d,kind)=>d[kind],
 columns:kind=>kind==='pool'?poolColumns:[...poolColumns,{key:'qty',label:'持股数',kind:'number'},{key:'entry',label:'买入日',kind:'date'},{key:'due',label:'到期日',kind:'date'},{key:'mark',label:'估值价格',kind:'number'},{key:'markDate',label:'估值日期',kind:'date'},{key:'status',label:'持仓状态'}]
});
function updatePoolComparison(){poolComparison.update({title:'股东增持被套',days:meta.days,min:current.startIndex,max:meta.days.length-1,cutoff:manifest.last,params:configText(current.params)+'；实际起点 '+current.effectiveStart,appliedParams:current.params,excluded:current.params.excluded.map(c=>meta.symbols[c]).join('、'),notes:{pool:'按两日收盘的可买条件比较，已持有或已使用的披露不再列入。移除可能因为已经买入、条件变化等，不代表实际卖出。',holdings:'比较两日实际收盘持仓。保留只表示两期均有持仓；期间交易请看实际买卖表。'}});}
(async()=>{try{
 const loaded=await ask('init',{},s=>$('status').textContent=s);meta=loaded.meta;manifest=loaded.manifest;day=meta.days.length-1;
 $('interval').textContent=`股东增持被套 · ${manifest.first}—${manifest.last}`;$('date').min=manifest.first;$('date').max=manifest.last;$('date').value=manifest.last;
 $('start-date').min=manifest.first;$('start-date').max=manifest.last;
 $('stock-options').innerHTML=meta.symbols.map((code,c)=>`<option value="${esc(code+' '+nameOf(c))}"></option>`).join('');$('add-stock').disabled=false;$('clear-stocks').disabled=false;setForm(manifest.default);setBusy(false);await generate();
 }catch(e){error(e);$('status').textContent='研究输入加载失败，请刷新重试。';}
})();
