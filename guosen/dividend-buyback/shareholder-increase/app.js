'use strict';
(() => {
const $=id=>document.getElementById(id), esc=x=>String(x??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=x=>Number.isFinite(x)?(x*100).toFixed(2)+'%':'—', num=x=>Number.isFinite(x)?x.toFixed(3):'—';
const bins=[['none','未被套（0%）'],['0_10','大于0%、小于10%'],...Array.from({length:9},(_,i)=>[(i+1)*10+'_'+(i+2)*10,`${(i+1)*10}%—${(i+2)*10}%${i===8?'（含上界）':'（不含上界）'}`]),['ge30','至少30%（汇总档）']];
const binName=k=>bins.find(x=>x[0]===k)?.[1]??k;
let meta,common,items=[],current,result,page='method',requestNo=0,rankRows=[],tradeRows=[],rankPage=0,tradePage=0,busy=false;
const cache=new Map(), pageSize=30;
const percentMetrics=new Set(['annual_return','excess_annual_return','max_drawdown','total_return','volatility','win_rate','return','benchmark_return','excess_return','avg_annual_drawdown']);
function format(v,k){return percentMetrics.has(k)?pct(v):k==='sharpe'?num(v):v??'—';}
function table(target,headers,rows){$(target).innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<div class="empty">没有符合条件的数据。可降低样本数限制或调整筛选条件。</div>';}
function metricStrip(target,pairs){$(target).innerHTML=pairs.map(([label,value])=>`<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');}
function failure(e){$('error').hidden=false;$('error').textContent='未能加载或核验结果：'+e.message+'。请检查网络后重新选择组合；不会用旧结果代替当前请求。';$('load-status').textContent='加载失败';}
async function unpack(info){
 if(!window.DecompressionStream||!crypto.subtle)throw Error('浏览器不支持安全校验或gzip解压，请使用新版Chrome/Edge');
 const response=await fetch(info.file);if(!response.ok)throw Error(`文件读取失败 (${response.status})`);
 const raw=await response.arrayBuffer();if(raw.byteLength!==info.bytes)throw Error('文件长度与版本清单不符');
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
 if(digest!==info.sha256)throw Error('文件校验不一致，请刷新更新版本');
 return JSON.parse(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
}
function hydrate(payload){if(payload.nav.length!==common.rows.length)throw Error('组合日期长度与公共序列不一致');return {...payload,nav_columns:['date','strategy','benchmark','excess','drawdown','holdings','regime'],nav:payload.nav.map((r,i)=>({date:common.rows[i][0],strategy:r[0],benchmark:common.rows[i][1],excess:r[0]/common.rows[i][1],drawdown:r[1],holdings:r[2],regime:common.rows[i][2]})),trades:payload.trades.map(r=>Object.fromEntries(payload.trade_columns.map((k,i)=>[k,r[i]])))};}
function choiceLabel(x){const p=x.params;return `增持≥${(p.min_ratio*100).toFixed(1)}% · ${binName(p.drawdown_bin)} · 持有${p.hold_months}个月`;}
function requested(){return items.find(x=>Math.abs(x.params.min_ratio-Number($('ratio').value))<1e-9&&x.params.drawdown_bin===$('bin').value&&x.params.hold_months===Number($('months').value));}
function putControls(x){$('ratio').value=String(x.params.min_ratio);$('bin').value=x.params.drawdown_bin;$('months').value=String(x.params.hold_months);}
function setBusy(value){busy=value;$('apply').disabled=value;$('reset').disabled=value;['ratio','bin','months','chart-mode','trade-download','nav-download','result-download','heat-refresh','rank-refresh'].forEach(id=>$(id).disabled=value);}
async function choose(x,go){
 if(!x||busy)return;const token=++requestNo;setBusy(true);$('error').hidden=true;result=null;
 ['metrics','execution','year-table','regime-table','trade-table'].forEach(id=>$(id).replaceChildren());
 ['nav-chart','year-chart'].forEach(id=>{if(window.Plotly)Plotly.purge($(id));$(id).replaceChildren()});
 current=x;putControls(x);$('selected').textContent='正在加载：'+choiceLabel(x);$('sample-warning').textContent='正在核验所选组合…';$('load-status').textContent='正在校验组合分块…';
 try{
  let payload=cache.get(x.sha256);if(!payload){payload=await unpack(x);cache.set(x.sha256,payload);if(cache.size>8)cache.delete(cache.keys().next().value);}
  if(token!==requestNo)return;result=hydrate(payload);
  for(const [key,value] of Object.entries(x.summary))if(result.summary[key]!==value)throw Error('组合绩效与索引不一致');
  $('selected').textContent=choiceLabel(x)+' ｜2017-01-01 至 2026-10-13';
  const s=result.summary;$('sample-warning').textContent=s.entry_count===0?'本组合没有实际入场，净值为现金路径；零收益不代表策略有效。':s.trade_count<30?`已入场${s.entry_count}笔，已平仓仅${s.trade_count}笔，未平仓${s.open_count}笔。样本量较少，不宜据此判断策略有效。`:`已入场${s.entry_count}笔，已平仓${s.trade_count}笔，未平仓${s.open_count}笔。满足30笔只是研究筛选门槛，不等于统计有效或样本外通过。`;
  $('load-status').textContent='5,472组预计算结果 · 所选分块SHA-256校验通过';tradePage=0;
  setBusy(false);if(go)show(go);else renderPage();
 }catch(e){result=null;setBusy(false);['trade-download','nav-download','result-download'].forEach(id=>$(id).disabled=true);$('selected').textContent='所选组合加载失败：'+choiceLabel(x);$('sample-warning').textContent='没有可展示的当前结果，请重试。';failure(e);}
}
function show(next){page=next;document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.page===page?'page':'false'));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===page));$('workspace').hidden=page==='method';window.scrollTo(0,0);renderPage();}
const chartConfig={responsive:true,displaylogo:false,modeBarButtonsToRemove:['lasso2d','select2d'],toImageButtonOptions:{format:'png',scale:2}};
function plot(id,traces,layout={}){if(!window.Plotly){failure(Error('图表组件未加载'));return;}return Plotly.react(id,traces,{font:{family:'Microsoft YaHei, sans-serif',size:12,color:'#53636e'},paper_bgcolor:'#ffffff',plot_bgcolor:'#ffffff',margin:{t:30,r:30,b:55,l:65},legend:{orientation:'h',y:1.14},hovermode:'x unified',xaxis:{gridcolor:'#f0f3f5'},yaxis:{gridcolor:'#e9eef1'},...layout},chartConfig);}
function line(name,x,y,color){return {name,x,y,type:'scatter',mode:'lines',line:{color,width:1.8},connectgaps:false};}
function backtest(){
 const s=result.summary;metricStrip('metrics',[['年化收益',pct(s.annual_return)],['超额年化（日差复利）',pct(s.excess_annual_return)],['Sharpe',num(s.sharpe)],['最大回撤',pct(s.max_drawdown)],['累计收益',pct(s.total_return)],['年化波动',pct(s.volatility)],['已平仓胜率',pct(s.win_rate)],['累计交易费用（元）',Number(s.total_fees).toLocaleString('zh-CN',{maximumFractionDigits:2})]]);
 const mode=$('chart-mode').value,n=result.nav,x=n.map(r=>r.date);let traces,yaxis={gridcolor:'#e9eef1'};
 if(mode==='nav')traces=[line('策略净值',x,n.map(r=>r.strategy),'#0b7f73'),line('万得全A',x,n.map(r=>r.benchmark),'#ad8542')];
 else if(mode==='excess')traces=[line('相对净值（策略÷基准）',x,n.map(r=>r.excess),'#0b7f73')];
 else if(mode==='drawdown'){traces=[{...line('策略回撤',x,n.map(r=>r.drawdown),'#0b7f73'),fill:'tozeroy'}];yaxis.tickformat='.0%';}
 else{traces=[line('持仓数量',x,n.map(r=>r.holdings),'#0b7f73')];yaxis.dtick=2;}
 plot('nav-chart',traces,{yaxis});
 const a=result.audit;table('execution',['检查项','数量 / 说明'],[['符合参数事件',a.eligible_count],['实际入场',s.entry_count],['已平仓',s.trade_count],['期末未平仓',s.open_count],['未纳入或未入场（含不符参数）',a.skipped_count],...Object.entries(a.skipped_reasons??{}).map(([k,v])=>[reasonLabel(k),v])]);
}
function reasonLabel(k){return ({already_holding:'同股票已有持仓',no_cash:'现金不足',slots_full:'持仓槽位已满',limit_up:'估算涨停',not_tradable:'无可执行行情',st:'可识别ST',no_volume:'无成交量',outside_drawdown_bin:'不符合被套档位',below_min_ratio:'低于增持比例阈值',suspended_signal_price:'信号日无可用交易价（状态未完整核验）'})[k]??k;}
function nonnegative(id){const v=Number($(id).value);if(!Number.isFinite(v)||v<0||!Number.isInteger(v))throw Error('样本笔数必须是非负整数');return v;}
function compare(){
 let min;try{min=nonnegative('heat-min')}catch(e){failure(e);return;}
 const ratio=Number($('ratio').value),metric=$('heat-metric').value,subset=items.filter(x=>Math.abs(x.params.min_ratio-ratio)<1e-9),lookup=new Map(subset.map(x=>[x.params.drawdown_bin+'_'+x.params.hold_months,x]));
 const z=bins.map(([b])=>Array.from({length:24},(_,i)=>{const s=lookup.get(b+'_'+(i+1)).summary;return s.trade_count>=min&&Number.isFinite(s[metric])?s[metric]:null}));
 plot('heat-chart',[{type:'heatmap',x:Array.from({length:24},(_,i)=>i+1),y:bins.map(x=>x[1]),z,colorscale:[[0,'#e8f1ef'],[1,'#0b7f73']],hoverongaps:false,colorbar:{title:{text:$('heat-metric').selectedOptions[0].text},tickformat:percentMetrics.has(metric)?'.1%':'.2f'},hovertemplate:'持有%{x}个月<br>%{y}<br>指标：%{z'+(percentMetrics.has(metric)?':.2%':':.3f')+'}<extra></extra>'}],{margin:{l:190,r:30,b:55,t:25},xaxis:{title:{text:'持有自然月数'},dtick:1},yaxis:{autorange:'reversed'}});
 const el=$('heat-chart');el.removeAllListeners('plotly_click');el.on('plotly_click',event=>{if(busy)return;const p=event.points[0],b=bins[p.pointIndex[0]][0];choose(lookup.get(b+'_'+p.x),'backtest')});
 $('heat-note').textContent=`共288组，其中${z.flat().filter(Number.isFinite).length}组满足样本限制且指标可定义；其余灰白留空，不当作零收益。`;
 const one=subset.filter(x=>x.params.drawdown_bin===$('bin').value).sort((a,b)=>a.params.hold_months-b.params.hold_months);
 plot('sensitivity-chart',[line('年化收益',one.map(x=>x.params.hold_months),one.map(x=>x.summary.entry_count?x.summary.annual_return:null),'#0b7f73'),line('超额年化',one.map(x=>x.params.hold_months),one.map(x=>x.summary.entry_count?x.summary.excess_annual_return:null),'#ad8542')],{xaxis:{title:{text:'持有自然月数'},dtick:1},yaxis:{tickformat:'.0%'},hovermode:'x unified'});
}
function periods(){const y=result.yearly;plot('year-chart',[{type:'bar',name:'策略年度收益',x:y.map(r=>r.year),y:y.map(r=>r.return),marker:{color:'#0b7f73'}},{type:'bar',name:'万得全A',x:y.map(r=>r.year),y:y.map(r=>r.benchmark_return),marker:{color:'#ad8542'}}],{barmode:'group',yaxis:{tickformat:'.0%'}});table('year-table',['年份','策略收益','万得全A','年度超额（相减）'],y.map(r=>[r.year,pct(r.return),pct(r.benchmark_return),pct(r.excess_return)]));table('regime-table',['市场状态','交易日数','年化收益','超额年化','波动率','Sharpe','同状态拼接最大回撤','平均年内连续片段回撤'],result.regime_stats.map(r=>[r.name,r.days,pct(r.annual_return),pct(r.excess_annual_return),pct(r.volatility),num(r.sharpe),pct(r.max_drawdown),pct(r.avg_annual_drawdown)]));}
function screen(rebuild=true){
 if(rebuild){let min;try{min=nonnegative('rank-min')}catch(e){failure(e);return;}const metric=$('rank-metric').value,lower=$('rank-return').value===''?-Infinity:Number($('rank-return').value)/100,dd=$('rank-dd').value===''?1:Number($('rank-dd').value)/100;if(Number.isNaN(lower)||!Number.isFinite(dd)||dd<0||dd>1){failure(Error('请填写有效的收益门槛及0—100%的回撤上限'));return;}rankRows=items.filter(x=>{const s=x.summary;return s.trade_count>=min&&Number.isFinite(s[metric])&&s.annual_return>=lower&&s.max_drawdown>=-dd}).sort((a,b)=>b.summary[metric]-a.summary[metric]||a.id.localeCompare(b.id));rankPage=0;}
 $('rank-count').textContent=`符合条件 ${rankRows.length} / 5,472组；按全样本${$('rank-metric').selectedOptions[0].text}降序。零交易组合单独标注。`;
 const rows=rankRows.slice(rankPage*pageSize,(rankPage+1)*pageSize);table('rank-table',['序号','增持至少','被套档位','月数','年化','超额年化','Sharpe','最大回撤','已平仓','未平仓','状态','查看'],rows.map((x,i)=>{const s=x.summary;return [rankPage*pageSize+i+1,pct(x.params.min_ratio),binName(x.params.drawdown_bin),x.params.hold_months,pct(s.annual_return),pct(s.excess_annual_return),num(s.sharpe),pct(s.max_drawdown),s.trade_count,s.open_count,s.entry_count?'有交易':'现金路径','']}));
 document.querySelectorAll('#rank-table tbody tr').forEach((row,i)=>{const button=document.createElement('button');button.textContent='查看组合';button.disabled=busy;button.onclick=()=>choose(rows[i],'backtest');row.lastElementChild.append(button)});pager('rank',rankPage,rankRows.length);
}
function pager(prefix,p,count){$(prefix+'-page').textContent=count?`${p+1} / ${Math.ceil(count/pageSize)}页`:'0 / 0页';$(prefix+'-prev').disabled=p===0;$(prefix+'-next').disabled=(p+1)*pageSize>=count;}
function trades(rebuild=true){if(rebuild){const query=$('trade-search').value.trim().toLowerCase(),status=$('trade-status').value;tradeRows=result.trades.filter(r=>(status==='all'||r.status===status)&&(r.code.toLowerCase().includes(query)||r.name.toLowerCase().includes(query)));tradePage=0;}table('trade-table',['证券代码','名称','公告日期','入场日','退出日','入场原价','退出原价','增持比例','被套幅度','持有月数','状态','策略收益','基准收益','逐笔超额','延期退出天数'],tradeRows.slice(tradePage*pageSize,(tradePage+1)*pageSize).map(r=>[r.code,r.name,r.announcement_date,r.entry_date,r.exit_date,r.entry_price,r.exit_price,pct(r.ratio),pct(r.underwater),r.holding_months,r.status==='closed'?'已平仓':'未平仓',pct(r.return),pct(r.benchmark_return),pct(r.excess_return),r.exit_delay_days]));$('trade-count').textContent=`显示 ${tradeRows.length} / ${result.trades.length}笔；下载包含全部筛选行，不限当前页。逐笔超额“—”表示基准时点数据缺失，不是0。`;pager('trade',tradePage,tradeRows.length);}
function renderPage(){if(page==='method')return;if(page==='compare'){compare();return;}if(page==='screen'){screen();return;}if(!result)return;if(page==='backtest')backtest();if(page==='periods')periods();if(page==='trades')trades();}
function download(name,data,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function cell(value){let s=value==null?'':String(value);if(typeof value==='string'&&/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function csv(name,columns,rows){download(name,'\ufeff'+[columns,...rows].map(row=>row.map(cell).join(',')).join('\r\n'),'text/csv;charset=utf-8');}
function exportRanks(rows,name){const keys=['annual_return','excess_annual_return','sharpe','max_drawdown','trade_count','open_count','entry_count'];csv(name,['组合ID','增持比例（小数）','被套档位','持有月数','年化收益（小数）','超额年化（小数）','Sharpe','最大回撤（小数）','已平仓','未平仓','入场笔数'],rows.map(x=>[x.id,x.params.min_ratio,binName(x.params.drawdown_bin),x.params.hold_months,...keys.map(k=>x.summary[k])]));}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{if(items.length)show(b.dataset.page)});document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{if(items.length)show(b.dataset.go)});
$('apply').onclick=()=>choose(requested());$('reset').onclick=()=>choose(items.find(x=>x.id===meta.baseline));
['ratio','bin','months'].forEach(id=>$(id).onchange=()=>{if(page==='compare')compare();$('selected').textContent='参数已变更，请点击“查看组合结果”；当前已加载：'+choiceLabel(current);});
$('chart-mode').onchange=()=>{if(result)backtest()};$('heat-refresh').onclick=compare;$('heat-metric').onchange=compare;$('rank-refresh').onclick=()=>screen();
$('rank-prev').onclick=()=>{rankPage--;screen(false)};$('rank-next').onclick=()=>{rankPage++;screen(false)};
$('trade-prev').onclick=()=>{tradePage--;trades(false)};$('trade-next').onclick=()=>{tradePage++;trades(false)};['trade-search','trade-status'].forEach(id=>$(id).oninput=()=>{if(result)trades()});
$('rank-download').onclick=()=>exportRanks(rankRows,'全样本筛选结果.csv');$('all-download').onclick=()=>exportRanks(items,'全部5472组绩效.csv');
$('trade-download').onclick=()=>{if(!result)return;trades();const keys=result.trade_columns;csv('所选组合_筛选交易明细.csv',keys,tradeRows.map(r=>keys.map(k=>r[k])))};
$('nav-download').onclick=()=>{if(result)csv('所选组合_净值.csv',result.nav_columns,result.nav.map(r=>result.nav_columns.map(k=>r[k])))};
$('result-download').onclick=()=>{if(result)download('所选组合_'+current.id+'.json',JSON.stringify({params:current.params,research_end:meta.research_end,label:meta.label,identity_sha256:meta.identity_sha256,result},null,2),'application/json')};
async function init(){try{const response=await fetch('manifest.json',{cache:'no-cache'});if(!response.ok)throw Error('版本清单读取失败');meta=await response.json();if(meta.schema!==2||!meta.verification.passed)throw Error('版本不受支持或未核验');[items,common]=await Promise.all([unpack(meta.catalog),unpack(meta.common)]);if(items.length!==meta.count)throw Error('参数目录数量不符');
 $('ratio').innerHTML=Array.from({length:19},(_,i)=>{const v=(10+i*5)/1000;return `<option value="${v}">${(v*100).toFixed(1)}%</option>`}).join('');$('bin').innerHTML=bins.map(([k,v])=>`<option value="${k}">${v}</option>`).join('');$('months').innerHTML=Array.from({length:24},(_,i)=>`<option value="${i+1}">${i+1}个月</option>`).join('');
 metricStrip('study-stats',[['有效披露日事件',meta.input_audit.accepted_events.toLocaleString()],['覆盖股票',meta.input_audit.accepted_codes],['有入场组合',meta.active_count.toLocaleString()],['已平仓≥30笔组合',meta.sample30_count]]);
 const base=items.find(x=>x.id===meta.baseline);if(!base)throw Error('缺少默认基准组合');$('baseline-note').textContent=`基准组合：增持≥1%、被套≥30%、持有6个月。${base.summary.trade_count}笔已平仓；年化收益${pct(base.summary.annual_return)}，累计收益${pct(base.summary.total_return)}，最大回撤${pct(base.summary.max_drawdown)}。样本少，不能据此证明或否定全部增持策略。`;
 const labels={below_grid_minimum_1pct:'低于网格最低增持阈值1%',invalid_event_dates:'事件日期不可用',missing_cost:'缺实际增持成本',missing_initial_signal_quote:'缺首次信号行情',missing_total_shares:'缺股本',overlapping_same_person_periods:'同参与人交易区间重叠',share_basis_conflict:'股本口径冲突',st_name_proxy:'名称快照识别ST',stale_total_shares:'股本时效不满足'};
 table('audit-table',['清洗项目','同披露日分组数量'],[['原始分组',meta.input_audit.source_groups],['纳入研究',meta.input_audit.accepted_events],...Object.entries(meta.input_audit.excluded_groups).map(([k,v])=>[labels[k]??k,v])]);$('version').textContent=`计算版本 ${meta.identity_sha256}；导出时间 ${meta.generated}。自动核验通过仅代表账务和文件一致，不代表简化假设已被验证。`;
 await choose(base);
 }catch(e){failure(e);}}
window.IncreaseResearch={get state(){return {page,current:current?.id,loaded:!!result,busy,count:items.length,rankCount:rankRows.length,tradeCount:tradeRows.length}},show};
init();
})();
