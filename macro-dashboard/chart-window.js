/** Axis limits use visible observations, never the full history outside the window. */
const finite = value => typeof value === 'number' && Number.isFinite(value);
const time = value => typeof value === 'number' ? value : Date.parse(String(value).replace(' ', 'T').replace(/^(\d{4}-\d{2}-\d{2})$/, '$1T00:00:00Z'));
const attached = new WeakMap();

export function visibleAxisRange(traces, window, axis = 'y', reversed = false) {
 const bounds = window.map(time).sort((a,b)=>a-b);
 let low=Infinity,high=-Infinity,hasBar=false;
 const include=value=>{if(finite(value)){low=Math.min(low,value);high=Math.max(high,value);}};
 for(const trace of traces){
  if((trace.yaxis||'y')!==axis||trace.visible===false||trace.visible==='legendonly')continue;
  let included=false;
  for(let i=0;i<trace.x.length;i++){
   const x=time(trace.x[i]),y=trace.y[i];
   if(x>=bounds[0]&&x<=bounds[1]&&finite(y)){include(y);included=true;}
   // Include the portion of a line crossing a window edge, without bridging nulls.
   if(i&&trace.type!=='bar'&&String(trace.mode||'lines').includes('lines')&&finite(y)&&finite(trace.y[i-1])){
    const previousX=time(trace.x[i-1]),previousY=trace.y[i-1];
    if(x!==previousX)for(const edge of bounds)if(edge>Math.min(x,previousX)&&edge<Math.max(x,previousX))include(previousY+(y-previousY)*(edge-previousX)/(x-previousX));
   }
  }
  if(included&&trace.type==='bar')hasBar=true;
 }
 if(low===Infinity)return {range:reversed?[1,0]:[0,1],empty:true};
 if(hasBar){low=Math.min(low,0);high=Math.max(high,0);}
 const pad=high===low?(Math.abs(high)*.08||1):(high-low)*.08;
 let range=[low-pad,high+pad];
 if(hasBar&&low===0&&high>0)range[0]=0;
 if(hasBar&&high===0&&low<0)range[1]=0;
 return {range:reversed?range.reverse():range,empty:false};
}

export function traceDateExtent(traces){
 let low=Infinity,high=-Infinity;
 for(const trace of traces)for(const value of trace.x){const date=time(value);if(Number.isFinite(date)){low=Math.min(low,date);high=Math.max(high,date);}}
 return low===Infinity?null:[new Date(low).toISOString().slice(0,10),new Date(high).toISOString().slice(0,10)];
}

export function detachTimeWindow(node){
 const old=attached.get(node);if(!old)return;
 node.removeListener?.('plotly_relayout',old.relayout);
 node.removeListener?.('plotly_restyle',old.restyle);
 old.tools.remove();old.disposed=true;attached.delete(node);
}

export async function attachTimeWindow(node,card){
 const extent=traceDateExtent(node.data);if(!extent)return;
 const tools=document.createElement('div');tools.className='chart-timeline-tools';
 tools.setAttribute('aria-label','图表时间窗口');
 tools.innerHTML='<div class="chart-window-dates"><label>起始 <input type="date" data-window-start aria-label="图表起始日期"></label><span>—</span><label>结束 <input type="date" data-window-end aria-label="图表结束日期"></label></div><div class="chart-window-presets"><button type="button" data-window-years="1">近1年</button><button type="button" data-window-years="3">近3年</button><button type="button" data-window-years="5">近5年</button><button type="button" data-window-years="all">全部</button></div><span class="chart-window-status" aria-live="polite">拖动时间条，纵轴自动适配</span>';
 node.after(tools);
 const start=tools.querySelector('[data-window-start]'),end=tools.querySelector('[data-window-end]'),status=tools.querySelector('.chart-window-status');
 for(const input of [start,end]){input.min=extent[0];input.max=extent[1];}
 const state={tools,disposed:false,busy:false,pending:null};attached.set(node,state);
 const current=()=>node.layout.xaxis.autorange?extent:node.layout.xaxis.range||extent;
 const sync=()=>{const range=[...current()].sort((a,b)=>time(a)-time(b));start.value=new Date(time(range[0])).toISOString().slice(0,10);end.value=new Date(time(range[1])).toISOString().slice(0,10);};
 // Coalesce rapid drags; retain the newest range if a Plotly update is in flight.
 const fit=async()=>{
  state.pending=[...current()];if(state.busy||state.disposed)return;
  state.busy=true;
  try{while(state.pending&&!state.disposed){
   const range=state.pending;state.pending=null;const update={};let any=false;
   for(const [axis,key,reversed] of [['y','yaxis',card.reverseLeft],['y2','yaxis2',card.reverseRight]]){
    if(!node.data.some(trace=>(trace.yaxis||'y')===axis))continue;
    const result=visibleAxisRange(node.data,range,axis,reversed);any ||= !result.empty;
    update[key+'.range']=result.range;update[key+'.autorange']=false;
   }
   status.textContent=any?'拖动时间条，纵轴自动适配':'当前时段暂无有效观测';
   sync();await Plotly.relayout(node,update);
  }}finally{state.busy=false;}
 };
 state.relayout=event=>{if(Object.keys(event).some(key=>/^xaxis\.(range(?:\[\d\])?|autorange)$/.test(key)))return fit();};
 state.restyle=()=>fit();
 node.on('plotly_relayout',state.relayout);node.on('plotly_restyle',state.restyle);
 const select=async(first,last)=>{
  if(!first||!last||first>last){status.textContent='请选择有效的起止日期';return;}
  first=first<extent[0]?extent[0]:first;last=last>extent[1]?extent[1]:last;
  if(first>last){status.textContent='所选时段超出数据范围';return;}
  await Plotly.relayout(node,{'xaxis.range':card.reverseX?[last,first]:[first,last],'xaxis.autorange':false});
 };
 tools.onchange=()=>select(start.value,end.value);
 tools.onclick=event=>{
  const button=event.target.closest('[data-window-years]');if(!button)return;
  const years=button.dataset.windowYears;let first=extent[0];
  if(years!=='all'){const date=new Date(extent[1]+'T00:00:00Z');date.setUTCFullYear(date.getUTCFullYear()-Number(years));first=date.toISOString().slice(0,10);}
  return select(first,extent[1]);
 };
 await fit();
}
