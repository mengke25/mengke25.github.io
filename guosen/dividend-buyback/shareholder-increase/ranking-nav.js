'use strict';
// Audited, complete daily curves for the fixed published ranking, not a new optimization.
window.RankingNav=(()=>{
 const cache=new Map(),mounted=new Map();
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-8*(1+Math.abs(b));
 async function load(report,top){
  const descriptor=top.nav;if(!descriptor)throw Error('本组净值尚未发布，请刷新后重试。');
  const key=descriptor.sha256;
  if(!cache.has(key))cache.set(key,(async()=>{
   const response=await fetch(new URL(descriptor.file,location.href),{cache:'no-cache'});
   if(!response.ok)throw Error('净值数据下载失败，请刷新后重试。');
   const bytes=await response.arrayBuffer();
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
   if(bytes.byteLength!==descriptor.bytes||digest!==descriptor.sha256)throw Error('净值版本校验失败，请刷新后重试。');
   return JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
  })().catch(e=>{cache.delete(key);throw e;}));
  const data=await cache.get(key),n=data.days?.length;
  if(data.schema!=='ranking-nav-v1'||data.fingerprint!==report.fingerprint||data.kind!==report.kind||data.rank!==top.rank||data.accountDigest!==top.accountDigest||JSON.stringify(data.params)!==JSON.stringify(top.params))throw Error('净值与当前排名参数不一致，暂不展示。');
  if(!n||n!==descriptor.points||data.strategy.length!==n||data.benchmark.length!==n||data.days[0]!==descriptor.baseDate||data.days[1]!==report.start||data.days.at(-1)!==report.end||data.strategy[0]!==1||data.benchmark[0]!==1)throw Error('净值日期或基期不完整，暂不展示。');
  if(!data.days.every((v,i)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&(!i||v>data.days[i-1]))||![...data.strategy,...data.benchmark].every(v=>Number.isFinite(v)&&v>0))throw Error('净值数据异常，暂不展示。');
  if(!near(data.strategy.at(-1)-1,top.full.total)||!near(data.benchmark.at(-1)-1,top.full.benchmark)||!near(data.strategy.at(-1)**(244/(n-1))-1,top.full.annual))throw Error('净值与本组绩效不一致，暂不展示。');
  return data;
 }
 function sheets(report,top,data){return [{name:'每日净值',columns:['日期','策略净值','万得全A净值','相对净值'].map(label=>({label,width:22})),rows:data.days.map((date,i)=>[date,data.strategy[i],data.benchmark[i],data.strategy[i]/data.benchmark[i]]),filter:true}];}
 function cleanup(){for(const [host,state] of mounted)if(!host.isConnected){state.observer.disconnect();if(window.Plotly)Plotly.purge(state.graph);mounted.delete(host);}}
 async function mount(host,report,top){
  cleanup();host.dataset.navKind=report.kind;host.dataset.navRank=top.rank;
  host.innerHTML=`<h4>第 ${top.rank} 名净值：${esc(top.label)}</h4><div class="rank-nav-tools"><label>显示<select class="rank-nav-mode"><option value="nav">策略净值与万得全A</option><option value="relative">相对净值（策略 ÷ 万得全A）</option></select></label><button class="rank-nav-reset" disabled>恢复全区间</button><button class="rank-nav-download" disabled>下载每日净值 XLSX</button></div><p class="rank-nav-status" role="status">正在核对本组日频净值…</p><div class="rank-nav-plot" role="region" aria-label="${esc(report.title)}第${top.rank}名净值曲线"></div><p class="rank-note">没有符合条件的买入或尚未成交时，资金留在现金；空仓期间净值走平，不代表曲线缺失。</p>`;
  const graph=host.querySelector('.rank-nav-plot'),status=host.querySelector('.rank-nav-status'),mode=host.querySelector('.rank-nav-mode'),download=host.querySelector('.rank-nav-download'),reset=host.querySelector('.rank-nav-reset');
  let data=null,drawToken=0;
  const observer=new ResizeObserver(()=>{if(host.isConnected&&graph.data&&graph.offsetWidth)Plotly.Plots.resize(graph).catch(()=>{});});observer.observe(graph);mounted.set(host,{graph,observer});
  function fail(e){status.textContent='净值未展示：'+e.message;status.setAttribute('role','alert');host.dataset.navState='error';download.disabled=reset.disabled=true;if(window.Plotly)Plotly.purge(graph);}
  async function draw(){
   const token=++drawToken,relative=mode.value==='relative';
   const trace=(name,y,color)=>({name,x:data.days,y,type:'scatter',mode:'lines',connectgaps:false,line:{color,width:1.8},hovertemplate:'%{y:.4f}<extra>%{fullData.name}</extra>'});
   const traces=relative?[trace('相对净值',data.strategy.map((v,i)=>v/data.benchmark[i]),'#087f74')]:[trace('策略净值',data.strategy,'#087f74'),trace('万得全A',data.benchmark,'#aa8040')];
   await Plotly.react(graph,traces,{height:360,margin:{l:56,r:18,t:52,b:46},font:{family:'Microsoft YaHei,system-ui',color:'#36534f'},paper_bgcolor:'#fff',plot_bgcolor:'#fff',hovermode:'x unified',legend:{orientation:'h',x:0,y:1.17},xaxis:{type:'date',range:[data.days[0],data.days.at(-1)],gridcolor:'#edf2f0'},yaxis:{title:{text:relative?'相对净值':'净值'},tickformat:'.2f',gridcolor:'#edf2f0',rangemode:'normal'},transition:{duration:0}},{responsive:true,displaylogo:false,displayModeBar:true,modeBarButtonsToRemove:['lasso2d','select2d'],toImageButtonOptions:{format:'png',filename:report.title+'_第'+top.rank+'名净值',scale:2}});
   if(token!==drawToken||!host.isConnected)return;
   status.textContent=`基期 ${data.days[0]}＝1 · 截至 ${data.days.at(-1)} · ${data.days.length-1} 个交易日。${relative?'相对净值高于1表示累计跑赢基准。':'两条曲线采用相同基期，包含账户现金。'}拖动放大，双击恢复；缩放不改变绩效。`;
   status.setAttribute('role','status');host.dataset.navState='ready';download.disabled=reset.disabled=false;
  }
  try{data=await load(report,top);if(!host.isConnected){cleanup();return;}if(!window.Plotly)throw Error('图表组件未加载，请刷新后重试。');await draw();}
  catch(e){if(host.isConnected)fail(e);return;}
  mode.onchange=()=>draw().catch(fail);reset.onclick=()=>draw().catch(fail);
  download.onclick=()=>{try{
   const info={name:'参数与口径',columns:[{label:'项目',width:25},{label:'内容',width:90}],rows:[['策略',report.title],['参数',top.label],['固定条件',report.fixed],['基期',data.baseDate+'，净值为1'],['区间',report.start+'—'+report.end],['口径','完整日频账户净值；不复权；零费用；相对净值=策略/万得全A；不是年化超额收益'],['排序','完整区间Sharpe降序；历史筛选，不代表未来结果'],['版本',report.fingerprint]]};
   const url=URL.createObjectURL(new Blob([PoolCompare.xlsx([info,...sheets(report,top,data)])],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})),a=document.createElement('a');a.href=url;a.download=`${report.title}_第${top.rank}名_每日净值.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){status.textContent='下载失败：'+e.message;status.setAttribute('role','alert');}};
 }
 return {load,mount,cleanup,sheets};
})();
