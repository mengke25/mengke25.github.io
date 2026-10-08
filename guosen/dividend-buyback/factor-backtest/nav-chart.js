/* Local Plotly renderer. Shared by single-factor, cross-factor and factor lab. */
'use strict';
window.ResearchCharts=(()=>{
 const charts=new Map();
 const colors={'牛市':'rgba(11,127,115,0.10)','熊市':'rgba(196,110,60,0.10)','震荡市':'rgba(150,140,120,0.10)'};
 const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function nextDay(s){return new Date(Date.parse(s+'T00:00:00Z')+86400000).toISOString().slice(0,10);}
 function teardown(){for(const [host,entry] of charts)if(!host.isConnected){entry.observer.disconnect();Plotly.purge(entry.graph);charts.delete(host);}}
 function resizeVisible(){for(const [host,e] of charts)if(host.isConnected&&host.offsetWidth&&host.offsetHeight)Plotly.Plots.resize(e.graph);}
 function background(intervals,start,end){
  const shapes=[],annotations=[];
  for(const item of intervals){
   const a=item.start<start?start:item.start,b=item.end>end?end:item.end;
   if(a>b)continue;
   shapes.push({type:'rect',xref:'x',yref:'paper',x0:a,x1:nextDay(b),y0:0,y1:1,fillcolor:colors[item.label],line:{width:0},layer:'below'});
   if(Date.parse(b)-Date.parse(a)>110*86400000)annotations.push({xref:'x',yref:'paper',x:new Date((Date.parse(a)+Date.parse(b))/2).toISOString().slice(0,10),y:1,text:item.label,showarrow:false,yanchor:'top',font:{size:11,color:'#647078'},bgcolor:'rgba(255,255,255,0.5)'});
  }
  return {shapes,annotations};
 }
 async function mount(host,result){
  teardown();const rows=result.nav||[],analysis=result.regime_analysis;
  if(!rows.length){host.textContent='没有可显示的净值数据。';return;}
  const first=rows[0].date,last=rows.at(-1).date,intervals=analysis?.info?.intervals||[];
  host.innerHTML=`<div class="chart-heading"><h3>组合净值与万得全A</h3><span>完整日频 · 与本次回测同源</span></div>
   <div class="chart-tools"><label>显示<select class="chart-mode"><option value="nav">累计净值</option><option value="drawdown">回撤曲线</option></select></label><label>开始日期<input class="chart-start" type="date" value="${first}" min="${first}" max="${last}"></label><label>结束日期<input class="chart-end" type="date" value="${last}" min="${first}" max="${last}"></label><button class="chart-range">查看区间</button><button class="chart-reset">恢复全区间</button><button class="chart-download">下载图片</button><label class="chart-shading-label"><input class="chart-shading" type="checkbox" checked>牛熊背景</label></div>
   <div class="chart-key"><span class="regime-pill bull">牛市</span><span class="regime-pill bear">熊市</span><span class="regime-pill sideways">震荡市</span><span>事后归因区间，不作择时信号</span></div>
   <div class="interactive-chart" role="region" aria-label="交互式净值与牛熊区间图"></div>
   <p class="chart-feedback" role="status">显示 ${first} 至 ${last}</p><p class="muted chart-help">悬停查看日期和数值；拖拽框选放大、工具栏平移，双击恢复；点击图例隐藏/显示曲线，双击图例单独查看。底部滑块可选区间。缩放只改变视图，不重算收益或归一化净值。相对净值＝策略净值÷基准净值。</p>`;
  const graph=host.querySelector('.interactive-chart'),start=host.querySelector('.chart-start'),end=host.querySelector('.chart-end'),feedback=host.querySelector('.chart-feedback');
  let currentMode='nav',visible=[first,last],shading=true,drawVersion=0;
  const labels=analysis?.labels||rows.map(()=> '未覆盖');
  const traces=()=>[['nav','策略净值','#0B7F73'],['benchmark','万得全A','#A8752B'],['excess_nav','相对净值','#14384C']].filter(([key])=>rows.some(r=>r[key]!=null)).map(([key,name,color])=>{
   let peak=1;const y=rows.map(r=>{const v=r[key];if(v==null)return null;peak=Math.max(peak,v);return currentMode==='nav'?v:v/peak-1;});
   return {x:rows.map(r=>r.date),y,name:currentMode==='nav'?name:name+'回撤',type:'scatter',mode:'lines',connectgaps:false,line:{color,width:key==='nav'?2.2:1.6},customdata:labels,
    hovertemplate:currentMode==='nav'?'%{y:.4f}<br>%{customdata}<extra>%{fullData.name}</extra>':'%{y:.2%}<br>%{customdata}<extra>%{fullData.name}</extra>'};
  });
  async function draw(){
   const v=++drawVersion,shadows=shading?background(intervals,first,last):{shapes:[],annotations:[]};
   await Plotly.react(graph,traces(),{height:460,margin:{l:62,r:24,t:52,b:40},font:{family:'Microsoft YaHei, PingFang SC, sans-serif',size:12,color:'#42515D'},paper_bgcolor:'#fff',plot_bgcolor:'#fff',hovermode:'x unified',dragmode:'zoom',showlegend:true,
    legend:{orientation:'h',x:0,y:1.13,itemclick:'toggle',itemdoubleclick:'toggleothers'},...shadows,
    xaxis:{type:'date',range:visible,hoverformat:'%Y-%m-%d',showgrid:false,zeroline:false,showspikes:true,spikemode:'across',spikesnap:'cursor',rangeslider:{visible:true,thickness:.12,bgcolor:'#f7f9fa',borderwidth:1,bordercolor:'#e2e8eb'}},
    yaxis:{title:{text:currentMode==='nav'?'净值':'回撤'},tickformat:currentMode==='nav'?'.2f':'.0%',gridcolor:'#E8EDF1',zeroline:false,autorange:true},transition:{duration:0}},
    {responsive:true,displaylogo:false,displayModeBar:true,scrollZoom:false,doubleClick:'reset',modeBarButtonsToRemove:['lasso2d','select2d'],toImageButtonOptions:{format:'png',filename:'A股红利因子回测',scale:2}});
   if(v!==drawVersion)return;
   await Plotly.relayout(graph,shadows);
   feedback.textContent=`显示 ${visible[0]} 至 ${visible[1]} · ${currentMode==='nav'?'累计净值':'相对各自历史峰值的回撤'}`;
  }
  try{await draw();}catch(error){feedback.textContent='图表加载失败：'+error.message;return;}
  function report(error){feedback.textContent=error.message;}
  host.querySelector('.chart-mode').onchange=e=>{currentMode=e.target.value;draw().catch(report);};
  host.querySelector('.chart-shading').onchange=e=>{shading=e.target.checked;const layers=shading?background(intervals,first,last):{shapes:[],annotations:[]};Plotly.relayout(graph,layers).catch(report);};
  host.querySelector('.chart-range').onclick=()=>{
   if(!start.value||!end.value||start.value>end.value||start.value<first||end.value>last){feedback.textContent='请输入回测覆盖内且起点不晚于终点的日期。';return;}
   if(!rows.some(r=>r.date>=start.value&&r.date<=end.value)){feedback.textContent='该区间没有交易日，请调整日期。';return;}
   visible=[start.value,end.value];draw().catch(report);
  };
  host.querySelector('.chart-reset').onclick=()=>{visible=[first,last];start.value=first;end.value=last;draw().catch(report);};
  host.querySelector('.chart-download').onclick=()=>Plotly.downloadImage(graph,{format:'png',filename:'A股红利因子回测',scale:2}).catch(report);
  graph.on('plotly_relayout',event=>{
   const a=event['xaxis.range[0]']??event['xaxis.range']?.[0],b=event['xaxis.range[1]']??event['xaxis.range']?.[1];
   if(a&&b){visible=[String(a).slice(0,10),String(b).slice(0,10)];start.value=visible[0];end.value=visible[1];feedback.textContent=`显示 ${visible[0]} 至 ${visible[1]} · 仅调整视图，绩效保持原研究区间`;}
  });
  const observer=new ResizeObserver(()=>{if(host.isConnected&&host.offsetWidth&&host.offsetHeight)Plotly.Plots.resize(graph);});observer.observe(host);charts.set(host,{graph,observer});
 }
 return {mount,resizeVisible,background};
})();
