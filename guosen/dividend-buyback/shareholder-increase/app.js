'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const M = [.5,1,1.5,2,2.5,3], N = Array.from({length:20},(_,i)=>i*5), H = [1,2,3,6,12,24,36];
  const pages = ['method','backtest','compare','periods','screen','trades'], size=25;
  const state = {page:'method',m:1,n:30,h:1,catalog:null,calendar:null,info:null,ready:false,busy:false,epoch:0,tradePage:0,rankPage:0,tradeRows:[],rankRows:[]};
  const cache=new Map(), lookup=new Map();
  const key=(m,n,h)=>[m,n,h].join('/');
  const row=(h=state.h)=>lookup.get(key(state.m,state.n,h));
  const metaFields=[
    ['m','增持比例门槛（%）'],['n','被套门槛（%）'],['h','持有期（月）'],
    ['avg_return','每批平均收益'],['paired_return','配对批次平均收益'],['benchmark_return','同期开盘万得全A'],
    ['excess_return','同样本平均超额'],['beat_count','跑赢批次'],['beat_rate','跑赢占比'],['batch_count','全部批次'],
    ['completed_count','完整批次'],['paired_count','配对批次'],['pending_count','未完成批次'],['stock_count','入选股票只次'],
    ['account_total_return','账户累计收益'],['account_annual_return','账户年化收益'],['account_max_drawdown','账户最大回撤']
  ];
  const batchFields=[['entry_date','买入日'],['maturity_date','自然月到期日'],['exit_date','最后退出日'],['event_count','批内股票只次'],['closed_event_count','已退出只次'],['paired_event_count','配对只次'],['status','状态'],['return','批次收益'],['benchmark_return','同期万得全A'],['excess_return','同样本超额'],['account_budget','账户投入（元）']];
  const tradeFields=[['code','股票代码'],['name','股票名称'],['announcement_date','公告日'],['ratio','增持比例'],['underwater','被套幅度'],['cost_price','增持成本（元）'],['entry_date','买入日'],['entry_price','买入价（元）'],['maturity_date','自然月到期日'],['planned_exit_date','计划退出日'],['exit_date','实际退出日'],['exit_price','卖出价（元）'],['status','状态'],['return','股票收益'],['benchmark_return','同期万得全A'],['excess_return','同样本超额'],['account_budget','账户投入（元）']];
  const yearFields=[['year','年份'],['return','账户收益'],['benchmark_return','万得全A'],['excess_return','年度超额'],['max_drawdown','账户最大回撤']];
  const regimeFields=[['name','市场环境'],['days','交易日'],['annual_return','账户年化收益'],['excess_annual_return','超额年化'],['volatility','年化波动率'],['sharpe','夏普比率'],['max_drawdown','拼接最大回撤'],['avg_annual_drawdown','平均年内回撤']];
  const label=Object.fromEntries(metaFields), pctKeys=new Set(['avg_return','paired_return','return','benchmark_return','excess_return','beat_rate','underwater','ratio','account_total_return','account_annual_return','account_max_drawdown','max_drawdown','avg_annual_drawdown','volatility','annual_return','excess_annual_return']);
  const metrics=['excess_return','avg_return','paired_return','benchmark_return','beat_rate','paired_count','account_total_return','account_annual_return','account_max_drawdown'];
  const finite=Number.isFinite, esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const statusMap={closed:'已完成',completed:'已完成',complete:'已完成',open:'未完成',pending:'未完成',incomplete:'未完成',unclosed:'未完成',已平仓:'已完成',未平仓:'未完成'};
  function format(k,v){
    if(v==null||v==='')return '—';
    if(pctKeys.has(k))return finite(v)?(v*100).toFixed(2)+'%':'—';
    if(k==='status')return statusMap[v]||String(v);
    if(['entry_price','exit_price','cost_price','account_budget','sharpe'].includes(k))return finite(v)?v.toLocaleString('zh-CN',{maximumFractionDigits:k==='account_budget'?2:4}):'—';
    return String(v);
  }
  function flatten(r){
    const s=r.summary;
    return {...s,m:r.m,n:r.n,h:r.h,beat_count:s.beat_count??(s.paired_count>0&&finite(s.beat_rate)?Math.round(s.beat_rate*s.paired_count):null)};
  }
  const columns=keys=>keys.map(k=>[k,label[k]]);
  const option=(v,t)=>'<option value="'+esc(v)+'">'+esc(t)+'</option>';
  const table=(cols,body,cls='')=>'<div class="table-wrap"><table class="'+cls+'"><thead><tr>'+cols.map(t=>'<th scope="col">'+esc(t)+'</th>').join('')+'</tr></thead><tbody>'+body.join('')+'</tbody></table></div>';
  function records(id,cols,rows,after){
    if(!rows.length){$(id).innerHTML='<p class="empty">没有符合条件的记录。可调整参数或放宽筛选条件。</p>';return;}
    $(id).innerHTML=table(cols.map(c=>c[1]).concat(after?['查看']:[]),rows.map(r=>'<tr>'+cols.map(([k])=>'<td>'+esc(format(k,r[k]))+'</td>').join('')+(after?'<td>'+after(r)+'</td>':'')+'</tr>'));
  }
  function link(r){return '<button data-pick="'+[r.m,r.n,r.h].join('/')+'">查看组合</button>';}
  async function unpack(info){
    if(!window.crypto?.subtle||!window.DecompressionStream)throw Error('此浏览器不能校验和解压数据，请使用新版浏览器并通过 HTTPS 或本机地址打开');
    if(!info||typeof info.file!=='string'||!Number.isSafeInteger(info.bytes)||!/^[\da-f]{64}$/i.test(info.sha256))throw Error('文件清单不完整');
    const url=new URL(info.file,document.baseURI);if(url.origin!==location.origin)throw Error('文件位置与当前站点不符');
    const res=await fetch(url);if(!res.ok)throw Error('文件读取失败（HTTP '+res.status+'）');
    const raw=await res.arrayBuffer();if(raw.byteLength!==info.bytes)throw Error('数据文件长度与清单不符');
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),x=>x.toString(16).padStart(2,'0')).join('');
    if(digest!==info.sha256.toLowerCase())throw Error('数据文件 SHA-256 校验不符');
    return JSON.parse(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
  }
  function detail(r){
    const k=r.sha256;
    if(cache.has(k)){const p=cache.get(k);cache.delete(k);cache.set(k,p);return p;}
    const p=unpack(r).then(d=>{
      if(!Array.isArray(d.nav)||d.nav.length!==state.calendar.dates.length||!Array.isArray(d.holding)||d.holding.length!==d.nav.length||['yearly','regimes','trades','batches'].some(x=>!Array.isArray(d[x])))throw Error('组合数据字段或交易日长度不一致');
      return d;
    }).catch(e=>{cache.delete(k);throw e;});cache.set(k,p);
    if(cache.size>18)cache.delete(cache.keys().next().value);return p;
  }
  function complain(e){$('error').hidden=false;$('error').querySelector('span').textContent='未能读取或核验本次结果：'+e.message+'。';$('load-status').textContent='';}
  async function init(){
    state.ready=false;$('error').hidden=true;$('load-status').textContent='正在核验研究数据…';
    try{
      const res=await fetch('./manifest.json',{cache:'no-store'});if(!res.ok)throw Error('研究清单读取失败（HTTP '+res.status+'）');
      const info=await res.json();if(info.schema!==3)throw Error('版本不兼容：需要第三版批次研究数据');
      const [calendar,catalog]=await Promise.all([unpack(info.calendar),unpack(info.catalog)]);
      if(!Array.isArray(calendar.dates)||calendar.dates.length<1||!['benchmark','regimes'].every(x=>Array.isArray(calendar[x])&&calendar[x].length===calendar.dates.length))throw Error('研究日历与基准长度不一致');
      if(!Array.isArray(catalog)||info.count!==M.length*N.length*H.length||catalog.length!==info.count)throw Error('参数组合数量与完整网格不一致');
      lookup.clear();for(const r of catalog){if(!M.includes(r.m)||!N.includes(r.n)||!H.includes(r.h)||!r.summary||lookup.has(key(r.m,r.n,r.h)))throw Error('参数缺失或重复');lookup.set(key(r.m,r.n,r.h),r);}
      Object.assign(state,{info,calendar,catalog,ready:true});$('interval').textContent=info.start+' — '+info.end+' · 冻结样本';
      $('load-status').textContent='';render();
    }catch(e){complain(e);}
  }
  const dash=ys=>{let peak=1;return ys.map(v=>{if(!finite(v))return null;peak=Math.max(peak,v);return peak>0?v/peak-1:null;});};
  const relative=(ys,base)=>ys.map((v,i)=>finite(v)&&finite(base[i])&&base[i]>0?v/base[i]:null);
  const colors=['#087360','#3b6fb0','#a66e20','#704e91','#bf5644','#367881','#765845'];
  function chart(id,data,yTitle,isPercent=false){
    if(!window.Plotly)throw Error('图表组件未载入，请刷新后重试');
    return Plotly.react($(id),data,{autosize:true,margin:{l:62,r:18,t:15,b:60},paper_bgcolor:'#fff',plot_bgcolor:'#fff',colorway:colors,font:{family:'system-ui, Microsoft YaHei, sans-serif',color:'#314a52',size:12},xaxis:{gridcolor:'#eef2f1',automargin:true},yaxis:{title:{text:yTitle},tickformat:isPercent?'.0%':undefined,gridcolor:'#e1e9e7',automargin:true},legend:{orientation:'h',y:-.17,x:0},hovermode:'x unified',barmode:'group'},{displayModeBar:false,responsive:true,scrollZoom:false});
  }
  function line(name,y,color,style){return {name,x:state.calendar.dates,y,type:'scatter',mode:'lines',connectgaps:false,line:{color,width:style?2.3:1.7,dash:style||'solid'}};}
  function clearPlot(id){if(window.Plotly&&$(id).data)Plotly.purge($(id));$(id).replaceChildren();}
  function commonTables(){
    const all=H.map(h=>flatten(row(h)));
    $('sample-warning').textContent=all.every(r=>r.batch_count===0)?'这组门槛没有可入场的批次；账户全程持有现金。可放宽增持或被套门槛。':all.every(r=>r.paired_count===0)?'这组门槛没有完整配对批次，无法判断是否跑赢基准。':'';
    records('seven-table',columns(['h','avg_return','paired_return','benchmark_return','excess_return','beat_count','beat_rate','batch_count','completed_count','paired_count','pending_count','stock_count']),all);
    records('account-table',columns(['h','account_total_return','account_annual_return','account_max_drawdown']),all);
  }
  async function navChart(epoch){
    const hs=$('chart-window').value==='all'?H:[+$('chart-window').value], mode=$('chart-mode').value;
    const ds=await Promise.all(hs.map(h=>detail(row(h))));if(epoch!==state.epoch)return;
    const base=state.calendar.benchmark;
    const lines=ds.map((d,i)=>line(hs[i]+'个月',mode==='relative'?relative(d.nav,base):mode==='drawdown'?dash(d.nav):mode==='holding'?d.holding:d.nav,colors[H.indexOf(hs[i])]));
    if(mode==='nav'||mode==='drawdown')lines.push(line('万得全A（收盘）',mode==='nav'?base:dash(base),'#303638','dash'));
    if(mode==='relative')lines.push(line('与基准持平',base.map(v=>finite(v)&&v>0?1:null),'#68716f','dot'));
    await chart('nav-chart',lines,{nav:'净值',relative:'相对净值',drawdown:'回撤',holding:'持仓数量'}[mode],mode==='drawdown');
  }
  function heat(){
    const metric=$('heat-metric').value,min=Math.max(0,+$('heat-min').value||0),rows=N.map(n=>H.map(h=>lookup.get(key(state.m,n,h))));
    const get=r=>r.summary.paired_count>=min&&finite(r.summary[metric])?r.summary[metric]:null;
    const vals=rows.flat().map(get).filter(finite),max=Math.max(1e-12,...vals.map(Math.abs));
    const body=rows.map((rs,i)=>'<tr><th scope="row">'+(N[i]===0?'0%（不限）':N[i]+'%')+'</th>'+rs.map(r=>{
      const v=get(r);if(v===null)return '<td class="none">—</td>';
      const bg='rgba('+(v<0?'184,103,49':'36,140,115')+','+Math.min(.42,Math.abs(v)/max*.42).toFixed(3)+')';
      return '<td style="background:'+bg+'"><button data-pick="'+[r.m,r.n,r.h].join('/')+'" aria-label="被套至少'+r.n+'%，持有'+r.h+'个月，'+esc(label[metric])+esc(format(metric,v))+'">'+esc(format(metric,v))+'</button></td>';
    }).join('')+'</tr>');$('heat-table').innerHTML=table(['被套至少'].concat(H.map(h=>h+'个月')),body,'heat');
  }
  async function periods(epoch){
    const d=await detail(row());if(epoch!==state.epoch)return;
    $('period-note').textContent=state.h+'个月独立账户。年度按收盘净值计算，超额为同年账户收益减去万得全A收益。首尾年度以实际样本日期为准。';
    records('year-table',yearFields,d.yearly);records('regime-table',regimeFields,d.regimes);
    await chart('year-chart',[['return','账户'],['benchmark_return','万得全A']].map(([k,name])=>({type:'bar',name,x:d.yearly.map(r=>String(r.year)),y:d.yearly.map(r=>r[k])})),'年度收益',true);
  }
  function pageRows(kind,rows,cols,after){
    const pages=Math.max(1,Math.ceil(rows.length/size)),pk=kind+'Page';
    state[pk]=Math.max(0,Math.min(state[pk],pages-1));const p=state[pk];state[kind+'Rows']=rows;
    $(kind+'-count').textContent='共 '+rows.length.toLocaleString('zh-CN')+' 条'+(kind==='rank'?' · 仅按有值的排序指标排列':'');
    $(kind+'-page').textContent=(p+1)+' / '+pages;$(kind+'-prev').disabled=p===0;$(kind+'-next').disabled=p+1>=pages;
    records(kind+'-table',cols,rows.slice(p*size,p*size+size),after);
  }
  function rank(){
    const metric=$('rank-metric').value,min=Math.max(0,+$('rank-min').value||0),ret=$('rank-return').value,dd=$('rank-dd').value;
    const rs=state.catalog.map(flatten).filter(r=>finite(r[metric])&&r.paired_count>=min&&(ret===''||(finite(r.account_annual_return)&&r.account_annual_return>=Number(ret)/100))&&(dd===''||(finite(r.account_max_drawdown)&&Math.abs(r.account_max_drawdown)<=Math.max(0,Number(dd))/100)));
    rs.sort((a,b)=>b[metric]-a[metric]||b.paired_count-a.paired_count||a.m-b.m||a.n-b.n||a.h-b.h);
    const keys=[...new Set(['m','n','h',metric,'avg_return','excess_return','paired_count','pending_count','account_annual_return','account_max_drawdown'])];
    pageRows('rank',rs,columns(keys),link);
  }
  function trades(d){
    const kind=$('detail-kind').value,status=$('trade-status').value,q=$('trade-search').value.trim().toLowerCase();
    $('search-label').hidden=kind!=='trades';
    const rs=d[kind].filter(r=>{
      const mapped=format('status',r.status);
      return (status==='all'||(status==='closed'?mapped==='已完成':mapped==='未完成'))&&(kind!=='trades'||(String(r.code)+' '+String(r.name)).toLowerCase().includes(q));
    });pageRows('trade',rs,kind==='trades'?tradeFields:batchFields);
  }
  let activeDetail=null;
  function detailButtons(on){for(const k of ['trade-download','nav-download','result-download'])$(k).disabled=!on;}
  async function render(){
    const ep=++state.epoch,page=state.page;
    for(const k of pages)$(k).hidden=k!==page;$('workspace').hidden=page==='method';
    document.querySelectorAll('nav [data-page]').forEach(b=>{if(b.dataset.page===page)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    $('h-label').hidden=!['trades','periods'].includes(page);$('parameters').hidden=page==='screen';$('bin').parentElement.hidden=page==='compare';
    $('ratio').value=state.m;$('bin').value=state.n;$('months').value=state.h;
    activeDetail=null;detailButtons(false);
    if(!state.ready)return;
    state.busy=false;$('error').hidden=true;$('load-status').textContent='';
    try{
      if(page==='method')return;
      if(page==='compare'){heat();return;}if(page==='screen'){rank();return;}
      state.busy=true;$('load-status').textContent='正在读取所选结果…';
      if(page==='backtest'){commonTables();clearPlot('nav-chart');await navChart(ep);}
      if(page==='periods'){for(const id of ['year-table','regime-table','period-note'])$(id).replaceChildren();clearPlot('year-chart');await periods(ep);}
      if(page==='trades'){
        $('trade-table').replaceChildren();$('trade-count').textContent='';$('trade-page').textContent='';
        const d=await detail(row());if(ep!==state.epoch)return;activeDetail=d;trades(d);detailButtons(true);
      }
      if(ep===state.epoch)$('load-status').textContent='';
    }catch(e){if(ep===state.epoch){if(page==='backtest')$('nav-chart').textContent='所选账户曲线未能加载。';if(page==='periods')$('year-chart').textContent='所选年度图表未能加载。';complain(e);}}
    finally{if(ep===state.epoch)state.busy=false;}
  }
  function csv(cols,rows){
    const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    const safe=(k,v)=>{if(v==null)return '';if(k==='status')return format(k,v);if(pctKeys.has(k))return finite(v)?(v*100).toFixed(8)+'%':'';return typeof v==='string'&&/^[\t\r\n =+@-]/.test(v)?"'"+v:v;};
    return '\uFEFF'+[cols.map(c=>cell(c[1])).join(','),...rows.map(r=>cols.map(([k])=>cell(safe(k,r[k]))).join(','))].join('\r\n');
  }
  function save(name,body,mime){
    const url=URL.createObjectURL(new Blob([body],{type:mime})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function download(id){
    if(!state.ready)return;
    const tag='增持'+state.m+'%_被套'+state.n+'%_'+state.h+'个月',out=(n,c,rs)=>save(n+'.csv',csv(c,rs),'text/csv;charset=utf-8');
    if(id==='all-download')return out('全部参数绩效',metaFields,state.catalog.map(flatten));
    if(id==='rank-download')return out('筛选参数绩效',metaFields,state.rankRows);
    if(!activeDetail)return;
    if(id==='result-download')return save('组合完整结果_'+tag+'.json',JSON.stringify({m:state.m,n:state.n,h:state.h,summary:row().summary,calendar:state.calendar,...activeDetail}),'application/json');
    if(id==='trade-download'){const isStock=$('detail-kind').value==='trades';return out((isStock?'股票明细_':'批次明细_')+tag,isStock?tradeFields:batchFields,state.tradeRows);}
    if(id==='nav-download'){const cal=state.calendar,d=activeDetail,dd=dash(d.nav),rel=relative(d.nav,cal.benchmark);return out('账户净值_'+tag,[['date','日期'],['nav','账户净值'],['bench','万得全A收盘净值'],['relative','相对净值'],['max_drawdown','当日回撤'],['holding','持仓数量'],['regime','市场环境']],cal.dates.map((date,i)=>({date,nav:d.nav[i],bench:cal.benchmark[i],relative:rel[i],max_drawdown:dd[i],holding:d.holding[i],regime:cal.regimes[i]})));}
  }
  function go(page){if(!pages.includes(page))return;state.page=page;render();}
  $('ratio').innerHTML=M.map(v=>option(v,v+'%')).join('');
  $('bin').innerHTML=N.map(v=>option(v,v===0?'0%（不限）':v+'%')).join('');
  $('months').innerHTML=H.map(v=>option(v,v+'个月')).join('');$('chart-window').innerHTML+=$('months').innerHTML;
  for(const k of ['rank-metric','heat-metric'])$(k).innerHTML=metrics.map(m=>option(m,label[m])).join('');
  document.addEventListener('click',ev=>{
    const b=ev.target.closest('button');if(!b)return;
    if(b.dataset.pick){[state.m,state.n,state.h]=b.dataset.pick.split('/').map(Number);$('chart-window').value=state.h;state.tradePage=0;go('backtest');}
    else if(b.dataset.page||b.dataset.go)go(b.dataset.page||b.dataset.go);
    else if(b.id==='reset'){Object.assign(state,{m:1,n:30,h:1,tradePage:0,rankPage:0});$('chart-window').value='all';render();}
    else if(b.id==='retry'){state.ready?render():init();}
    else if(b.id.endsWith('-download'))download(b.id);
    else if(/^(rank|trade)-(prev|next)$/.test(b.id)){const [k,d]=b.id.split('-');state[k+'Page']+=d==='prev'?-1:1;if(k==='rank'&&state.ready)rank();if(k==='trade'&&activeDetail)trades(activeDetail);}
  });
  for(const [id,sk] of [['ratio','m'],['bin','n'],['months','h']])$(id).addEventListener('change',()=>{state[sk]=+$(id).value;if(sk==='h'&&$('chart-window').value!=='all')$('chart-window').value=state.h;state.tradePage=0;render();});
  $('chart-mode').addEventListener('change',render);
  $('chart-window').addEventListener('change',()=>{if($('chart-window').value!=='all')state.h=+$('chart-window').value;state.tradePage=0;render();});
  for(const id of ['heat-metric','heat-min'])$(id).addEventListener(id==='heat-min'?'input':'change',()=>state.ready&&heat());
  for(const id of ['rank-metric','rank-min','rank-return','rank-dd'])$(id).addEventListener(id==='rank-metric'?'change':'input',()=>{state.rankPage=0;if(state.ready)rank();});
  for(const id of ['detail-kind','trade-search','trade-status'])$(id).addEventListener(id==='trade-search'?'input':'change',()=>{state.tradePage=0;if(activeDetail)trades(activeDetail);});
  render();init();
})();
