'use strict';
// Match charts, metrics, periods and exports to the same first-entry reporting window.
(()=>{
 const share=!!document.getElementById('ratio'),get=id=>document.getElementById(id);
 function emptyCharts(ids){for(const id of ids){const host=get(id);if(window.Plotly)Plotly.purge(host);host.textContent='所选区间没有实际买入，未形成策略净值。可调整起始日或筛选参数。';}}
 function note(r){const a=r.active,start=r.params.start;return a.firstEntryDate?`选择起始日 ${start}；首次建仓 ${a.firstEntryDate}，此前 ${a.waitingDays} 个空仓交易日不参与绩效。基期 ${a.baseDate}＝1，计入首次买入当天收益；万得全A同日对齐。之后的空仓日仍计入，不继承所选起点前的持仓。`:`选择起始日 ${start}；所选区间无交易，不计算收益、Sharpe或回撤。`;}
 const field=get(share?'start-date':'from');
 const shortcuts=document.createElement('span');shortcuts.className='start-shortcuts';shortcuts.innerHTML='<button type="button" data-start="2020-01-01">2020年以来</button><button type="button" data-start="all">全部可用</button>';
 field.closest('label').append(shortcuts);shortcuts.onclick=e=>{const b=e.target.closest('[data-start]');if(!b)return;field.value=b.dataset.start==='all'?field.min:(b.dataset.start<field.min?field.min:b.dataset.start);field.dispatchEvent(new Event('input',{bubbles:true}));};
 if(share){
  const original=renderAccount;renderAccount=function(){original();get('base-note').textContent=note(current);get('export-nav').disabled=!current.active.firstEntryDate;};
  drawAccount=function(){const a=current.active;if(!a?.firstEntryDate)return emptyCharts(['nav-chart','capital-chart']);const x=[a.baseDate,...a.dates],offset=a.startIndex,nav=current.nav.slice(offset),prior=offset?allSix[offset-1]:1;
   chart('nav-chart',[{x,y:[1,...a.nav],name:'当前策略',mode:'lines',line:{color:'#087e73',width:2}},{x,y:[1,...allSix.slice(offset).map(v=>v/prior)],name:'六项全选对照（同日归一）',mode:'lines',line:{color:'#85959a',dash:'dot'}},{x,y:[1,...a.benchmark],name:'万得全A',mode:'lines',line:{color:'#b08741'}}]);
   chart('capital-chart',[{x:a.dates,y:nav.map(n=>n[1]/1e4),name:'现金',stackgroup:'one'},{x:a.dates,y:nav.map(n=>(n[0]*1e6-n[1])/1e4),name:'股票市值',stackgroup:'one'}],'万元');};
  grouped=function(kind){return (kind==='year'?current.yearly:current.regimes).map(m=>[m.label,m.days,pct(m.total_return),pct(m.benchmark_return),pct(m.excess_return),pct(m.annual_return),pct(m.volatility),num(m.sharpe,3),pct(m.annual_mdd_mean)]);};
  get('export-nav').onclick=()=>{const a=current.active;if(!a?.firstEntryDate)return;const prior=a.startIndex?allSix[a.startIndex-1]:1;csv('首次建仓后每日账户',['交易日','策略净值','万得全A净值','六项全选同日归一','现金','股票市值','持仓数','可买数','到期未成交数'],a.dates.map((date,j)=>{const i=j+a.startIndex,n=current.nav[i];return [date,a.nav[j],a.benchmark[j],allSix[i]/prior,n[1],n[0]*1e6-n[1],...n.slice(2)];}));};
 }else{
  dates=function(){return result.active.dates;};anchor=function(){return result.active.baseDate;};
  charts=function(){const a=result.active;if(!a?.firstEntryDate)return emptyCharts(['nav-chart','relative-chart','cash-chart']);const x=[a.baseDate,...a.dates],rows=result.nav.slice(a.offset);
   graph('nav-chart',[line('策略净值',x,[1,...a.nav],'#087f74'),line('万得全A',x,[1,...a.benchmark],'#aa8040')]);graph('relative-chart',[line('策略 / 万得全A',x,[1,...a.nav.map((v,i)=>v/a.benchmark[i])],'#087f74')]);graph('cash-chart',[line('现金',a.dates,rows.map(n=>n[1]),'#aa8040'),line('股票市值',a.dates,rows.map(n=>n[2]),'#087f74')],'元');};
  const original=display;display=function(){original();get('applied').textContent=note(result)+` 持有 ${result.params.months} 个月；${result.params.tool}；单笔 ${result.params.weight}%。`;get('export-nav').disabled=!result.active.firstEntryDate;};
  compareChart=function(){const colors=['#087f74','#aa8040','#486d9b','#80576e','#467d89','#7c7250'];const rows=comparison.filter(r=>r.active.firstEntryDate);if(!rows.length){emptyCharts(['compare-chart']);return;}graph('compare-chart',rows.map((r,i)=>line(r.months+' 个月',[r.active.baseDate,...r.active.dates],[1,...r.active.nav],colors[i%colors.length])));};
  get('export-nav').onclick=()=>{const a=result.active;if(!a.firstEntryDate)return;csv('首次建仓后每日净值',['日期','策略净值','万得全A净值','相对净值','现金','股票市值','持仓数','陈旧估值数'],a.dates.map((date,i)=>[date,a.nav[i],a.benchmark[i],a.nav[i]/a.benchmark[i],...result.nav[a.offset+i].slice(1)]));};
 }
 const risk=get('risk-definition');if(risk)risk.textContent='统计从所选区间的首次实际买入日起至回测截止日，计入买入当日收益，保留此后所有空仓日。基准同日对齐；平均年度最大回撤按该区间各自然年分别计算后平均。Sharpe无风险利率为0、每年244个交易日。';
})();
