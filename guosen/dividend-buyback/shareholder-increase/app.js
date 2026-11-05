'use strict';
// Replay the account only up to the selected close. Do not use future fills to
// infer whether a name was buyable, held or waiting to be sold on this date.
const real = v => Number.isFinite(v) && v > 0;
const gateNames=['流动性','股权质押','商誉','净利润','历史非 ST','ROE'];
const gateName=k=>k===63?'6大门槛因子（全选）':k===0?'不叠加门槛':gateNames.filter((_,j)=>k&(1<<j)).join('、');
function selectedLedger(pack,mask,summary){
  const v=pack.variants[mask],cols=v.map(i=>pack.series[i]);
  return {summary,nav:cols[0].map((_,i)=>cols.slice(0,5).map(a=>a[i])),trades:cols[5],pending:cols[6],blocked:cols[7],baseline:pack.series[pack.variants[63][0]]};
}
function periodStats(nav,man){
  const ys=new Map(),rs=new Map();
  function append(map,key,x){if(!map.has(key))map.set(key,[]);map.get(key).push(x);}
  nav.forEach((v,i)=>{const x=[v[0]/(i?nav[i-1][0]:1)-1,man.benchmark[i]/(i?man.benchmark[i-1]:1)-1];append(ys,man.days[i].slice(0,4),x);append(rs,man.regime[i],x);});
  function stats(group){
    let s=1,b=1,a=1,peak=1,dd=0;
    const mean=group.reduce((z,x)=>z+x[0],0)/group.length;
    const vol=Math.sqrt(244*group.reduce((z,x)=>z+(x[0]-mean)**2,0)/group.length);
    for(const [r,br] of group){s*=1+r;b*=1+br;a*=1+r-br;peak=Math.max(peak,s);dd=Math.min(dd,s/peak-1);}
    const ar=s**(244/group.length)-1;
    return {return:s-1,benchmark_return:b-1,excess_return:s-b,annual_return:ar,excess_annual_return:a>=0?a**(244/group.length)-1:null,volatility:vol,sharpe:vol?ar/vol:null,max_drawdown:dd};
  }
  return {yearly:[...ys].map(([year,g])=>({year,...stats(g)})),regimes:[...rs].map(([name,g])=>({name,days:g.length,...stats(g)}))};
}
function positionAt(trades,day) {
  const held=new Map();
  for(const [di,ref,side,price,qty] of trades){
    if(di>day) break;
    if(side==='S') held.delete(ref);
    else held.set(ref,(held.get(ref)||0)+qty);
  }
  return held;
}
function effectiveCloseGate(gate,date) {
  if(!Array.isArray(gate?.periods)||!gate.periods.length)throw Error('缺少已核验的 F01 历期名单，不能显示可买股票');
  const selected=gate.periods.filter(p=>(p.close_effective_date||p.effective_date)<=date).at(-1);
  return {period:selected??null, codes:new Set(selected?.codes||[])};
}
function daySnapshot({day,n,refs,spans,detail,price,allowed=null}) {
  const held=positionAt(detail.trades,day), names=new Set(), signals=[], holdings=[];
  const pending=new Set(detail.pending.filter(([s,,e])=>s<=day&&(e===-1||day<e)).map(r=>r[1]));
  function build(ref,qty=0) {
    const [code,name,ann,cost,ratio]=refs[ref],close=price(code),under=real(close)&&real(cost)?1-close/cost:null;
    const inGate=allowed===null||allowed.has(code);
    const eligible=inGate && under!==null && close<cost && Math.round(under*1e12)/1e10>=n;
    const action=qty?(pending.has(ref)?'解套待卖':eligible?'可加仓':'只持有'):eligible?'可买':null;
    return {ref,code,name,ann,cost,ratio,close,under,qty,action,inGate};
  }
  for(const [ref,qty] of held){
    const row=build(ref,qty); names.add(row.code); holdings.push(row); signals.push(row);
  }
  for(const [ref,start,end,retire] of spans){
    if(day<start || day>end || names.has(refs[ref][0])) continue;
    const stop=retire[n/5]; if(stop>=0 && day>=stop)continue;
    const row=build(ref); if(row.action){signals.push(row);names.add(row.code);}
  }
  const order={'可买':0,'可加仓':1,'只持有':2,'解套待卖':3};
  signals.sort((a,b)=>order[a.action]-order[b.action]||(b.under??-1)-(a.under??-1)||a.code.localeCompare(b.code));
  return {signals,holdings};
}
function dateNeighbours(days,value) {
  let lo=0,hi=days.length;
  while(lo<hi){const m=(lo+hi)>>1;if(days[m]<value)lo=m+1;else hi=m;}
  const valid=days[lo]===value;
  return {index:valid?lo:-1,prev:lo>0?days[lo-1]:null,next:(valid?days[lo+1]:days[lo])||null};
}
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,k=2)=>Number.isFinite(v)?v.toLocaleString('zh-CN',{minimumFractionDigits:k,maximumFractionDigits:k}):'—';
const pct=v=>Number.isFinite(v)?num(v*100)+'%':'—';
const quantity=(v,k=2)=>Number.isFinite(v)&&v>0&&v<0.01?'&lt;0.01':num(v,k);
const csvCell=x=>{
  let s=x==null?'':String(x);
  if(typeof x==='string' && /^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;
  return '"'+s.replaceAll('"','""')+'"';
};
if(typeof module!=='undefined')module.exports={daySnapshot,positionAt,dateNeighbours,csvCell,effectiveCloseGate};
if(typeof document!=='undefined')start();
function start(){
  const $=id=>document.getElementById(id);
  const state={page:'method',m:1,n:30,mask:63,date:'',manifest:null,epoch:0,view:null};
  const draftMask=()=>Array.from(document.querySelectorAll('#gates input:checked')).reduce((s,e)=>s+Number(e.value),0);
  function label(){const dirty=draftMask()!==state.mask||Number($('ratio').value)!==state.m||Number($('bin').value)!==state.n;
    $('applied').textContent=(dirty?'选择已更改，点「生成回测」后生效。当前结果：':'当前结果：')+gateName(state.mask)+' · 增持 ≥ '+state.m+'% · 被套 ≥ '+state.n+'%';}
  const cache=new Map(),pendingFiles=new Map();
  async function getFile(path){
    if(cache.has(path)){const cached=cache.get(path);cache.delete(path);cache.set(path,cached);return cached;}
    if(pendingFiles.has(path))return pendingFiles.get(path);
    const task=(async()=>{
      const spec=state.manifest.assets?.[path];
      if(!spec?.sha256)throw Error('缺少数据校验信息：'+path);
      const url=new URL(path,document.baseURI);url.searchParams.set('v',spec.sha256.slice(0,16));
      const response=await fetch(url);
      if(!response.ok)throw Error('读取失败（'+response.status+'）：'+path);
      const bytes=await response.arrayBuffer();
      if(bytes.byteLength!==spec.bytes)throw Error('数据长度与清单不符：'+path);
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
      if(hash!==spec.sha256)throw Error('文件与当前清单不一致：'+path);
      const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const data=await new Response(stream).json();cache.set(path,data);
      if(cache.size>8)cache.delete(cache.keys().next().value);
      return data;
    })();
    pendingFiles.set(path,task);try{return await task;}finally{pendingFiles.delete(path);}
  }
  async function init(){
    try{
      const response=await fetch('./manifest.json',{cache:'no-store'});if(!response.ok)throw Error('无法读取本次发布的数据清单');
      const man=await response.json();
      if(man.publication!=='selectable-six-gates-v1'||man.gate_choices!==64||!man.days?.length||man.combos?.length!==120)throw Error('数据版本不匹配，请刷新页面');
      state.manifest=man;state.date=man.days.at(-1);
      if(man.entry_gate){
        const how=document.querySelector('#method dl dd');
        how.textContent='先过 F01 六门槛资产池，再看增持比例和被套幅度。只有当期 F01 池内、实际增持占总股本达到 m、股价低于股东成本且被套幅度达到 n 的股票，才能新买或加仓。持仓掉出 F01 后只禁加仓，仍按原成本解套退出。';
      }
      $('published-rules').replaceChildren(...(man.rules||[]).map(line=>{const p=document.createElement('p');p.textContent=line;return p;}));
      if(!man.m_values.includes(state.m))state.m=man.m_values[0];
      if(!man.n_values.includes(state.n))state.n=man.n_values[0];
      for(const [id,vals,val] of [['ratio',man.m_values,state.m],['bin',man.n_values,state.n]]){
        $(id).replaceChildren(...vals.map(v=>new Option(v+'%',String(v))));$(id).value=String(val);
      }
      $('date').min=man.days[0];$('date').max=state.date;$('date').value=state.date;
      $('interval').textContent=man.days[0]+' — '+man.days.at(-1)+' · 历史回测';
      state.ranks=await getFile('rank.json.gz');$('generate').disabled=false;label();render();
    }catch(err){state.manifest=null;state.initError=err.message;render();}
  }
  function page(name){
    state.page=name;$('method').hidden=name!=='method';$('workspace').hidden=name==='method';
    document.querySelectorAll('nav [data-page]').forEach(b=>{if(b.dataset.page===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    $('date-controls').hidden=name!=='daily';$('parameters').hidden=name==='compare';
    for(const id of ['daily','account','compare','periods'])$(id).hidden=id!==name;
    render();
  }
  async function render(){
    const token=++state.epoch,man=state.manifest;
    state.view=null;$('content').hidden=true;$('error').hidden=true;$('status').textContent='';
    if(state.page==='method')return;
    for(const id of ['prev','next','latest','date','ratio','bin'])$(id).disabled=!man;
    if(!man){if(state.initError)showError(state.initError);else $('status').textContent='正在读取交易日与参数…';return;}
    if(!state.ranks){$('status').textContent='正在读取回测索引…';return;}
    const index=man.combos.findIndex(r=>r.m===state.m&&r.n===state.n),combo=man.combos[index];
    const materialize=async pack=>{
      const mask=state.mask,series=pack.series.slice(),keys=new Set([...pack.variants[mask],pack.variants[63][0]]);
      await Promise.all([...keys].map(async k=>{if(typeof series[k]==='string')series[k]=await getFile(series[k]);}));
      return selectedLedger({...pack,series},mask,state.ranks[mask][index]);
    };
    const near=dateNeighbours(man.days,state.date);
    $('prev').disabled=!near.prev;$('next').disabled=!near.next;$('latest').disabled=state.date===man.days.at(-1);
    try{
      if(state.page==='daily'&&near.index<0){
        $('status').textContent='所选日期没有可用的交易日数据。请选择上一交易日、下一交易日或最新交易日。';return;
      }
      $('status').textContent='正在读取并核对数据…';
      if(state.page==='compare'){drawCompare();}
      else if(!combo)throw Error('该参数组合没有发布结果');
      else if(state.page==='daily'){
        const year=state.date.slice(0,4),shared=await getFile('shared.json.gz');
        if(token!==state.epoch)return;
        const [pool,pack,prices]=await Promise.all([getFile('pool/m'+state.m+'.json.gz'),getFile(combo.path),getFile(shared.price_paths[year])]);
        if(token!==state.epoch)return;
        const di=near.index;
        const detail=await materialize(pack);if(token!==state.epoch)return;
        const p=shared.mask_periods.filter(row=>row[0]<=state.date).at(-1);
        const gate=state.mask?{period:{source_date:p?.[0],close_effective_date:p?.[0]},codes:new Set(shared.codes.filter((_,i)=>p&&(p[1][i]&state.mask)===state.mask))}:null;
        const snap=daySnapshot({day:di,n:state.n,refs:shared.refs,spans:pool.spans,detail,allowed:gate?.codes??null,price:code=>prices.rows[code]?.[di-prices.start]??null});
        if(snap.signals.filter(r=>r.action==='可买'||r.action==='可加仓').length!==detail.nav[di][3])throw Error('当日可买名单与回测账本不一致');
        const missing=[];
        for(const row of snap.holdings){
          row.mark=row.close;row.markDate=real(row.close)?state.date:null;
          if(!row.markDate)missing.push(row);
        }
        // Only search older slices when the selected holding is actually missing a mark.
        if(missing.length){
          for(const yr of Object.keys(shared.price_paths).filter(y=>y<=year).sort().reverse()){
            const p=yr===year?prices:await getFile(shared.price_paths[yr]);if(token!==state.epoch)return;
            for(const r of missing.filter(x=>!x.markDate)){
              const a=p.rows[r.code]||[];
              for(let j=Math.min(di-p.start,a.length-1);j>=0;j--)if(real(a[j])){r.mark=a[j];r.markDate=man.days[p.start+j];break;}
            }
            if(missing.every(x=>x.markDate))break;
          }
        }
        const executed=executions(detail,shared.refs,man.days,di);
        state.view={...snap,executed,detail,di,gate};drawDaily();
      }else{
        const pack=await getFile(combo.path);if(token!==state.epoch)return;
        const detail=await materialize(pack);if(token!==state.epoch)return;state.view={detail};if(state.page==='periods')drawPeriods(periodStats(detail.nav,man));
      }
      if(token!==state.epoch)return;
      $('content').hidden=false;$('status').textContent='';
      if(state.page==='account')drawAccount(state.view.detail,man);
    }catch(err){if(token===state.epoch)showError(err.message);}
  }
  function showError(msg){state.view=null;$('content').hidden=true;$('status').textContent='';$('error').hidden=false;$('error').querySelector('span').textContent=msg+'。请重试。';}
  function table(id,heads,rows,empty='没有符合条件的记录。',extra=''){
    $(id).innerHTML=rows.length?'<div class="table-wrap '+extra+'"><table><thead><tr>'+heads.map(c=>'<th scope="col">'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<p class="empty">'+esc(empty)+'</p>';
  }
  const stock=r=>'<span class="stock-name">'+esc(r.name)+'</span><span class="code">'+esc(r.code)+'</span>';
  const badge=a=>'<span class="badge '+(a==='解套待卖'?'sell':a==='只持有'?'hold':'')+'">'+esc(a)+'</span>';
  const sideText={'B':'买入','A':'加仓','S':'卖出'};
  function executions(detail,refs,days,di){
    const result=[];
    function item(ref,side,pr,qty,gross,fee,status,why){
      const [code,name,ann]=refs[ref];
      const pend=side==='S'?detail.pending.find(([start,id,end])=>id===ref&&start<=di&&(end===-1||di<=end)):null;
      const signal=pend?days[pend[0]]:di===0?'样本期前':[ann,days[di-1]].sort().at(-1);
      result.push({code,name,side:sideText[side],status,why,price:pr,qty,gross,fee,signal,date:days[di]});
    }
    for(const [day,ref,side,pr,qty,gross,fee] of detail.trades){if(day>di)break;if(day===di)item(ref,side,pr,qty,gross,fee,'已成交',side==='S'?'收盘已解套':'满足买入门槛，分配可用现金');}
    for(const [day,ref,side,reason] of detail.blocked||[]){if(day>di)break;if(day===di)item(ref,side,null,null,null,null,'未成交',reason);}
    return result;
  }
  function drawSignals(){
    if(!state.view?.signals)return;
    const rows=state.view.signals,query=$('stock-search').value.trim().toLowerCase(),act=$('action').value;
    const kept=rows.filter(r=>(!act||r.action===act)&&(r.code+' '+r.name).toLowerCase().includes(query));
    $('signal-count').textContent='显示 '+kept.length+' / '+rows.length+' 只';
    const gated=!!state.view.gate;
    table('signal-table',['股票名称 / 代码','收盘操作',...(gated?['当期所选门槛']:[]),'股东加权成本（元）','当日收盘（元）','增持占总股本','被套幅度','公告日'],kept.map(r=>[stock(r),badge(r.action),...(gated?[r.inGate?'通过':'未通过 · 禁止加仓']:[]),num(r.cost,4),num(r.close),pct(r.ratio),pct(r.under),esc(r.ann)]),rows.length?'未找到匹配股票。请清空搜索或选择全部操作。':'当日无可买股票，也无已有持仓。可切换交易日或调整参数。');
  }
  function drawDaily(){
    const v=state.view,day=state.date,nav=v.detail.nav[v.di],buy=v.signals.filter(r=>r.action==='可买').length,add=v.signals.filter(r=>r.action==='可加仓').length;
    $('day-stamp').textContent=day+' · 收盘观察';
    if(v.gate)$('day-stamp').textContent+=' · 门槛筛选日：'+(v.gate.period?.source_date||'尚无可用名单');
    $('pool-note').textContent=nav[1]===0?'收盘可用现金为零。名单表示符合价格条件；下次开盘若没有卖出回款，不会买入或加仓。':'名单表示符合价格条件，并非已经买入。下一交易日开盘先卖后买，只有可用现金和可成交标的同时具备才会买入。';
    $('day-stats').innerHTML=[['可买（未持有）',num(buy,0)+' 只'],['可加仓（已持有）',num(add,0)+' 只'],['实际收盘持仓',num(v.holdings.length,0)+' 只'],['收盘可用现金',num(nav[1])+' 元']].map(([k,val])=>'<dl><dt>'+esc(k)+'</dt><dd>'+esc(val)+'</dd></dl>').join('');
    drawSignals();
    table('exec-table',['股票名称 / 代码','方向','执行结果','信号可用日','开盘执行日','成交价（元）','数量（股）','成交额（元）','费用（元）','原因'],v.executed.map(r=>[stock(r),esc(r.side),esc(r.status),esc(r.signal||'—'),esc(r.date),num(r.price),quantity(r.qty,4),quantity(r.gross),quantity(r.fee),esc(r.why)]),'这一交易日没有开盘成交或受阻记录。可查看其他交易日。');
    $('position-note').textContent='收盘可用现金 '+num(nav[1])+' 元。缺当日收盘价时，估值价单列并注明日期，不作为当日买入依据。';
    table('holding-table',['股票名称 / 代码','状态','持股数（股）','当日收盘（元）','估值价（元）','估值价日期','市值（元）'],v.holdings.map(r=>[stock(r),badge(r.action),quantity(r.qty,4),num(r.close),num(r.mark),esc(r.markDate||'—'),quantity(real(r.mark)?r.mark*r.qty:null)]),'当日收盘未持有股票。可在“净值与资金”查看现金变化。');
  }
  function drawPeriods(d){
    table('years-table',['年份','策略收益','万得全A收益','超额收益','最大回撤'],d.yearly.map(r=>[esc(r.year),pct(r.return),pct(r.benchmark_return),pct(r.excess_return),pct(r.max_drawdown)]));
    table('regimes-table',['市场环境','交易日数','年化收益','年化超额','年化波动','夏普比率','最大回撤'],d.regimes.map(r=>[esc(r.name),num(r.days,0),pct(r.annual_return),pct(r.excess_annual_return),pct(r.volatility),num(r.sharpe),pct(r.max_drawdown)]));
  }
  function drawAccount(d,man){
    const s=d.summary,nav=d.nav;
    $('account-stats').innerHTML=[['初始本金',num(s.initial_capital/1e4)+' 万元'],['期末权益',num(s.final_equity/1e4)+' 万元'],['累计收益',pct(s.total_return)],['最大回撤',pct(s.max_drawdown)]].map(([k,v])=>'<dl><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></dl>').join('');
    if(!window.Plotly)throw Error('图表组件未加载');
    const trace=(name,y,color)=>({name,x:man.days,y,type:'scatter',mode:'lines',line:{color,width:2},connectgaps:false});
    const layout=y=>({margin:{l:65,r:20,t:20,b:52},yaxis:{title:{text:y},gridcolor:'#e6eeeb',fixedrange:false},xaxis:{type:'date',gridcolor:'#edf2f0'},legend:{orientation:'h',y:1.02,x:0},hovermode:'x unified',font:{family:'system-ui, Microsoft YaHei, sans-serif',color:'#36534f'},paper_bgcolor:'#fff',plot_bgcolor:'#fff'});
    const config={responsive:true,displaylogo:false,displayModeBar:false,scrollZoom:false};
    const base=trace('6大门槛因子（全选）',d.baseline,'#50699b');base.line.dash='dot';
    Plotly.react('nav-chart',[trace('本次选择',nav.map(v=>v[0]),'#086658'),base,trace('万得全A',man.benchmark,'#9a6539')],layout('净值'),config);
    Plotly.react('capital-chart',[trace('股票市值',nav.map(v=>(v[0]*s.initial_capital-v[1])/1e4),'#086658'),trace('现金',nav.map(v=>v[1]/1e4),'#687f88')],layout('万元'),config);
  }
  function buyCount(s){return (s.buy_count??0)+(s.add_count??0);}
  function rankRows(){
    const metric=$('rank-by').value,min=Number($('min-buys').value)||0,max=$('max-dd').value;
    return state.manifest.combos.map((c,i)=>({...c,summary:state.ranks[state.mask][i]})).filter(({summary:s})=>buyCount(s)>=min&&(!max||(s.max_drawdown!=null&&Math.abs(s.max_drawdown)*100<=Number(max)+1e-10))).sort((a,b)=>{
      const av=a.summary[metric],bv=b.summary[metric];
      if(av==null||bv==null)return Number(av==null)-Number(bv==null);
      return metric==='max_drawdown'?Math.abs(av)-Math.abs(bv):bv-av;
    });
  }
  const rankHead=['增持门槛 m','被套门槛 n','累计收益','年化收益','最大回撤','买入含加仓（笔）','卖出（笔）'];
  function drawCompare(){
    const rows=rankRows();$('rank-count').textContent='显示 '+rows.length+' / '+state.manifest.combos.length+' 组参数';
    table('compare-table',[...rankHead,'查看'],rows.map(({m,n,summary:s})=>[m+'%',n+'%',pct(s.total_return),pct(s.annual_return),pct(s.max_drawdown),num(buyCount(s),0),num(s.sell_count,0),'<button class="pick" data-m="'+Number(m)+'" data-n="'+Number(n)+'" aria-label="查看增持 '+Number(m)+'%、被套 '+Number(n)+'% 的每日名单">查看名单</button>']),'无符合条件的组合，请放宽筛选。','rank-wrap');
  }
  function download(kind,head,rows){
    const s=state,body='\uFEFF'+[head,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');
    a.href=url;a.download=gateName(s.mask)+'_'+kind+(kind==='参数筛选'?'':'_m'+s.m+'_n'+s.n)+(s.page==='daily'?'_'+s.date:'')+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
  function setDate(date){if(!date)return;state.date=date;$('date').value=date;render();}
  $('prev').onclick=()=>setDate(dateNeighbours(state.manifest.days,state.date).prev);
  $('next').onclick=()=>setDate(dateNeighbours(state.manifest.days,state.date).next);
  $('latest').onclick=()=>setDate(state.manifest.days.at(-1));
  $('date').onchange=()=>{state.date=$('date').value;render();};
  $('ratio').onchange=$('bin').onchange=label;
  document.querySelectorAll('#gates input').forEach(e=>e.onchange=label);
  $('generate').onclick=()=>{state.mask=draftMask();state.m=Number($('ratio').value);state.n=Number($('bin').value);label();render();};
  $('retry').onclick=()=>{if(state.manifest)render();else{state.initError='';init();}};
  document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));
  $('stock-search').oninput=drawSignals;$('action').onchange=drawSignals;
  for(const id of ['min-buys','max-dd','rank-by'])$(id).oninput=drawCompare;
  $('compare-table').onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;state.m=Number(b.dataset.m);state.n=Number(b.dataset.n);$('ratio').value=b.dataset.m;$('bin').value=b.dataset.n;label();page('daily');};
  $('export-signals').onclick=()=>{
    const g=state.view.gate;
    download('收盘信号',['交易日','股票代码','名称','收盘操作','公告日','增持占比','加权成本(元)','当日收盘(元)','被套幅度',...(g?['门槛筛选日','通过所选门槛']:[])],
      state.view.signals.map(r=>[state.date,r.code,r.name,r.action,r.ann,r.ratio,r.cost,r.close,r.under,...(g?[g.period?.source_date||'',r.inGate?'是':'否']:[])]));
  };
  $('export-execs').onclick=()=>download('开盘执行',['执行日','信号可用日','股票代码','名称','方向','结果','成交价(元)','股数','成交额(元)','费用(元)','原因'],state.view.executed.map(r=>[r.date,r.signal,r.code,r.name,r.side,r.status,r.price,r.qty,r.gross,r.fee,r.why]));
  $('export-holdings').onclick=()=>download('收盘持仓',['交易日','股票代码','名称','收盘操作','股数','收盘价(元)','估值价(元)','估值价日期','市值(元)'],state.view.holdings.map(r=>[state.date,r.code,r.name,r.action,r.qty,r.close,r.mark,r.markDate,real(r.mark)?r.qty*r.mark:null]));
  $('export-nav').onclick=()=>{const d=state.view.detail,m=state.manifest;download('每日账户',['日期','本次选择净值','6大门槛因子（全选）净值','万得全A净值','权益(元)','现金(元)','股票市值(元)','持仓数','可买含加仓数','待卖数'],d.nav.map((v,i)=>[m.days[i],v[0],d.baseline[i],m.benchmark[i],v[0]*d.summary.initial_capital,v[1],v[0]*d.summary.initial_capital-v[1],v[2],v[3],v[4]]));};
  $('export-compare').onclick=()=>download('参数筛选',rankHead,rankRows().map(({m,n,summary:s})=>[m+'%',n+'%',pct(s.total_return),pct(s.annual_return),pct(s.max_drawdown),buyCount(s),s.sell_count]));
  init();
}
