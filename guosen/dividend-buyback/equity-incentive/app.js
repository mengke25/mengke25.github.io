'use strict';
const $=s=>document.querySelector(s),worker=new Worker('worker.js');
let manifest=null,meta=null,result=null,detail=null,current='method',comparison=null,busy=false,selectedDay=0;
const pct=x=>x===null||!Number.isFinite(x)?'—':(x*100).toFixed(2)+'%',num=(x,d=2)=>x===null||!Number.isFinite(x)?'—':x.toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=x=>String(x??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function table(id,headers,rows){$(id).innerHTML=rows.length?'<div class="table-wrap"><table><thead><tr>'+headers.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<p class="empty">本区间没有符合条件的记录，可更换日期或参数查看。</p>';}
function error(msg){$('#error').textContent=msg;$('#error').hidden=!msg;}
function lock(value){busy=value;$('#generate').disabled=value;$('#compare-run').disabled=value;$('#prev').disabled=value;$('#next').disabled=value;$('#next-event').disabled=value;$('#day').disabled=value;}
function params(){return {months:+$('#months').value,weight:+$('#weight').value,tool:$('#tool').value,nonST:$('#nonST').checked,start:$('#from').value,end:$('#to').value};}
function show(tab){current=tab;$('#method').hidden=tab!=='method';$('#workspace').hidden=tab==='method';document.querySelectorAll('nav button').forEach(b=>{if(b.dataset.tab===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!==tab);if(result){if(tab==='nav')charts();if(tab==='compare'&&comparison)compareChart();} }
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>show(b.dataset.tab));$('#start-view').onclick=()=>show('pool');
$('#params').oninput=()=>$('#draft').hidden=false;
$('#params').onsubmit=e=>{e.preventDefault();if(busy)return;error('');lock(true);worker.postMessage({type:'run',params:params()});};
function stem(){const p=result.params;return `股权激励_${p.months}月_${p.weight}仓位_${p.tool}_${p.nonST?'非ST':'不限ST'}_${p.start}_${p.end}`;}
function csv(name,headers,rows){const safe=v=>{let s=String(v??'');if(/^[=+\-@]/.test(s)&&!Number.isFinite(Number(s)))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};const blob=new Blob(['\ufeff'+[headers,...rows].map(r=>r.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=stem()+'_'+name+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function info(r){const e=meta.events[r];return [meta.symbols[e.c],meta.names[e.c],e.ann,e.tools.join('、')];}
function daily(day){if(busy||!result)return;const p=result.params;if(!Number.isInteger(day)||day<p.a||day>p.z){error('请选择本次回测区间内的交易日。');return;}error('');selectedDay=day;$('#day').value=meta.days[day];worker.postMessage({type:'inspect',day});}
$('#day').onchange=()=>daily(meta.days.indexOf($('#day').value));$('#prev').onclick=()=>daily(selectedDay-1);$('#next').onclick=()=>daily(selectedDay+1);
$('#next-event').onclick=()=>{const p=result.params,e=meta.events.find(e=>e.day>selectedDay&&e.day<=p.z&&(p.tool==='全部'||e.tools.includes(p.tool)));if(e)daily(e.day);else error('之后没有符合工具条件的实施公告事件。');};
function poolRows(){return detail.pool.map(x=>[...info(x.r),num(x.price),x.status]);}
function tradeRows(rows){return rows.map(t=>[meta.days[t.day],...info(t.r),t.side,num(t.price),num(t.qty,4),num(t.amount),meta.days[t.entry],t.due,t.pnl===null?'—':num(t.pnl),pct(t.return)]);}
const tradeHeaders=['交易日','代码','名称','首次实施公告日','激励工具','方向','成交价','股数','金额','买入日','到期日','已实现盈亏','已实现收益'];
function showDetail(d){detail=d;table('#pool-table',['代码','名称','首次实施公告日','激励工具','当日开盘','处理结果'],poolRows());table('#hold-table',['代码','名称','首次实施公告日','激励工具','买入日','到期日','股数','参考价','估值日期','市值','状态'],d.holdings.map(h=>[...info(h.r),h.entry,h.due,num(h.qty,4),num(h.mark),h.markDate,num(h.value),h.overdue?'到期未退出':'持有中']));table('#trade-table',tradeHeaders,tradeRows(d.trades));table('#skip-table',['代码','名称','首次实施公告日','激励工具','方向','原因'],d.decisions.map(x=>[...info(x.r),x.side,x.reason]));}
function graph(id,traces,ytitle='净值'){if(typeof Plotly==='undefined'){error('图表组件未加载，请刷新。');return;}Plotly.react(id,traces,{margin:{l:65,r:20,t:25,b:45},font:{family:'Microsoft YaHei,system-ui',color:'#36534f'},paper_bgcolor:'white',plot_bgcolor:'white',legend:{orientation:'h',y:1.13},xaxis:{gridcolor:'#edf2f0'},yaxis:{title:ytitle,gridcolor:'#edf2f0',rangemode:'normal'},hovermode:'x unified'},{responsive:true,displaylogo:false,modeBarButtonsToRemove:['lasso2d','select2d']});}
function line(name,x,y,color){return {name,x,y,type:'scatter',mode:'lines',line:{width:1.6,color}};}
function dates(){return meta.days.slice(result.params.a,result.params.z+1);}
function anchor(){return result.params.a?meta.days[result.params.a-1]:manifest.baseDate;}
function charts(){const x=[anchor(),...dates()];graph('nav-chart',[line('策略净值',x,[1,...result.nav.map(x=>x[0])],'#087f74'),line('万得全A',x,[1,...result.bench],'#aa8040')]);graph('relative-chart',[line('策略 / 万得全A',x,[1,...result.nav.map((r,i)=>r[0]/result.bench[i])],'#087f74')]);graph('cash-chart',[line('现金',dates(),result.nav.map(r=>r[1]),'#aa8040'),line('股票市值',dates(),result.nav.map(r=>r[2]),'#087f74')],'元');}
const perfHeaders=['区间','交易日','累计收益','万得全A收益','累计超额','年化收益','年化超额','年化波动','Sharpe','最大回撤'];
function perfRow(r,label){return [label,r.days,pct(r.total_return),pct(r.benchmark_return),pct(r.excess_return),pct(r.annual_return),pct(r.excess_annual),pct(r.volatility),num(r.sharpe,3),pct(r.max_drawdown)];}
function display(){const s=result.summary,p=result.params;$('#draft').hidden=true;$('#results').hidden=false;$('#applied').textContent=`当前结果：${p.start} 至 ${p.end}；持有 ${p.months} 个月；${p.tool}；单笔 ${p.weight}%；${p.nonST?'历史非 ST':'不限制 ST'}。基期 ${anchor()}，净值 1；零手续费。`;
 const stats=[['累计收益',pct(s.total_return)],['万得全A收益',pct(s.benchmark_return)],['累计超额',pct(s.excess_return)],['年化收益',pct(s.annual_return)],['最大回撤',pct(s.max_drawdown)],['买入 / 卖出',s.buys+' / '+s.sells],['期末持仓',s.open+' 只'],['已平仓胜率',pct(s.win_rate)]];
 $('#metrics').innerHTML=stats.map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+v+'</dd></div>').join('');table('#year-table',perfHeaders,result.yearly.map(r=>perfRow(r,r.label)));table('#regime-table',perfHeaders,result.regimes.map(r=>perfRow(r,r.label)));
 $('#day').min=p.start;$('#day').max=p.end;comparison=null;$('#compare-table').innerHTML='';$('#compare-chart').innerHTML='';$('#export-compare').disabled=true;daily(p.z);show(current);
}
$('#compare-run').onclick=()=>{if(busy)return;lock(true);error('');worker.postMessage({type:'compare'});};
function compareChart(){const colors=['#1c6c61','#486d9b','#ad793e','#80576e','#5d7d3a','#467d89','#7c7250','#445b74','#a85e50','#4b9383','#887cb2','#b08c3d'],x=[anchor(),...dates()];graph('compare-chart',comparison.map((r,i)=>line(r.months+' 个月',x,[1,...r.nav],colors[i])));}
worker.onmessage=({data:m})=>{
 if(m.type==='progress')$('#status').textContent=m.message;
 else if(m.type==='error'){lock(false);error(m.message);$('#status').textContent='本次计算未完成，未替换旧结果。';if(!result)show('pool');}
 else if(m.type==='result'){manifest=m.manifest;meta=m.meta;result=m.result;lock(false);$('#status').textContent='回测完成，股票池、买卖与净值已同步更新。';display();}
 else if(m.type==='inspect'){if(m.day===selectedDay)showDetail(m.detail);}
 else if(m.type==='compare'){comparison=m.rows;lock(false);$('#status').textContent='12 个持有期对比完成。';table('#compare-table',[...perfHeaders,'买入数','卖出数','期末持仓'],comparison.map(r=>[...perfRow(r,r.months+' 个月'),r.buys,r.sells,r.open]));$('#export-compare').disabled=false;if(current==='compare')compareChart();}
};
worker.onerror=e=>{lock(false);error('计算组件发生错误：'+e.message);};
$('#export-pool').onclick=()=>detail&&csv('股票池_'+meta.days[selectedDay],['代码','名称','首次实施公告日','激励工具','开盘','处理结果'],poolRows());
$('#export-trades').onclick=()=>csv('全部买卖',tradeHeaders,tradeRows(result.trades));
$('#export-nav').onclick=()=>csv('每日净值',['日期','策略净值','万得全A净值','相对净值','现金','股票市值','持仓数','陈旧估值数'],result.nav.map((r,i)=>[dates()[i],r[0],result.bench[i],r[0]/result.bench[i],...r.slice(1)]));
$('#export-compare').onclick=()=>csv('持有期对比',[...perfHeaders,'买入数','卖出数','期末持仓'],comparison.map(r=>[...perfRow(r,r.months+' 个月'),r.buys,r.sells,r.open]));
(async()=>{try{const response=await fetch('manifest.json',{cache:'no-cache'});if(!response.ok)throw Error('无法读取数据清单');manifest=await response.json();$('#cutoff').textContent=`研究 ${manifest.first} — ${manifest.last}`;$('#months').innerHTML=Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i===2?'selected':''}>${i+1} 个月</option>`).join('');$('#tool').innerHTML=['全部',...manifest.tools].map(t=>'<option>'+esc(t)+'</option>').join('');for(const k of ['#from','#to']){$(k).min=manifest.first;$(k).max=manifest.last;}$('#from').value=manifest.first;$('#to').value=manifest.last;const a=manifest.audit;$('#audit-summary').innerHTML=`<p>${manifest.events.toLocaleString()} 个实施公告日事件，覆盖 ${manifest.stocks.toLocaleString()} 只股票。剔除 ${a.exact_duplicates} 条完全重复记录，隔离 ${a.conflicting_plans} 个实施日期冲突方案。未提供首次实施日的记录不构造买入信号。</p><p>回测截止 ${manifest.last}；指数本地至 ${a.benchmark_last}。${a.regime_unknown_days} 个交易日没有既有牛熊标签，单列统计。原始字段没有授予登记完成日期，本页不声称是“激励全部完成后买入”。</p>`;lock(true);worker.postMessage({type:'run'});}catch(e){error(e.message);$('#cutoff').textContent='数据加载失败';show('pool');}})();
