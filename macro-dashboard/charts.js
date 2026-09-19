import {prepareSeries,seasonality,alignScatter,formatNumber} from './transforms.js?v=87884b9e68d0c570';
import {attachTimeWindow,detachTimeWindow,traceDateExtent} from './chart-window.js?v=87884b9e68d0c570';
export const palette=['#004477','#D80C18','#9BCCFD','#C7D0D9','#E97132','#4EA72E'];
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function processed(card,metadata,values){return card.series.map((setting,index)=>{const meta=metadata.get(setting.indicatorId);const raw=values.get(setting.indicatorId);const result=prepareSeries(raw?.points||[],{...setting,start:card.start,end:card.end});return {setting,meta,index,points:result.points,warnings:[...(raw?.warnings||[]),...(result.warnings||[]),...(!meta?['指标已不在当前目录中，请重新选择。']:[])],name:setting.label||meta?.name||'失效指标',percent:!!meta?.percent&&setting.transform==='raw',unit:setting.transform==='base100'?'基期=100':setting.transform==='zscore'?'标准差':setting.transform==='log'?'自然对数':meta?.unit||'单位未注明'};});}
function axisLabel(list){const units=[...new Set(list.map(s=>s.percent?'%':s.unit))];return units.join(' / ')||'';}
function legendName(name){return name.replace(/\(hs\d+\)/gi,'').replace(/（hs\d+）/gi,'').replace(/^中国[:：]/,'').replace(/:本级/g,'').replace(/\s*·\s*(进口|出口)(金额|数量|价格)$/,' · $1$2');}
export async function renderChart(node,card,metadata,values){
 detachTimeWindow(node);
 const timeline=card.type==='line'||card.type==='bar';node.classList.toggle('has-timeline',timeline);
 const all=processed(card,metadata,values), warnings=[...new Set(all.flatMap(s=>s.warnings))];
 const good=all.filter(s=>s.points.some(p=>p[1]!==null&&Number.isFinite(p[1])));
 if(!good.length){node.innerHTML='<div class="empty">'+(card.series.length?'当前日期范围内没有可绘制数据<br>请检查日期、指标状态或变换设置。':'尚未选择指标<br>点击「编辑」添加研究序列。')+'</div>';return warnings;}
 const traces=[],left=all.filter(s=>s.setting.axis!=='right'),right=all.filter(s=>s.setting.axis==='right');
 for(const [label,list] of [['左轴',left],['右轴',right]]){if(list.some(s=>s.percent)&&list.some(s=>!s.percent))warnings.push(`${label}同时包含百分比与普通数值，建议在编辑器中分配到不同坐标轴。`);else if(new Set(list.map(s=>s.unit)).size>1)warnings.push(`${label}包含不同单位，请确认可比性或分配到另一坐标轴。`);}
 const trace=(s,points,name=s.name,color=s.setting.color||palette[s.index%palette.length])=>({name:legendName(name),x:points.map(p=>p[0]),y:points.map(p=>p[1]),type:card.type==='bar'?'bar':'scatter',...(card.type==='bar'?{offsetgroup:String(s.index),alignmentgroup:card.id}:{}),mode:'lines',connectgaps:false,line:{color,width:2},marker:{color,size:5},yaxis:s.setting.axis==='right'?'y2':'y',hovertemplate:'%{x|%Y-%m-%d}<br>'+(card.type==='seasonal'?esc(name)+' · ':'')+esc(s.meta?.name||s.name)+': %{y'+(s.percent?':.2%':':,.4~f')+'}'+(s.percent?'':' '+esc(s.unit))+'<extra></extra>'});
 if(card.type==='seasonal'){for(const s of good){for(const [n,season] of seasonality(s.points,card.years||5).entries()){traces.push(trace(s,season.points,good.length===1?String(season.year):`${s.name} · ${season.year}`,palette[n%palette.length]));}}}
 else if(card.type==='scatter'){
  if(all.length<2){node.innerHTML='<div class="empty">散点图需要至少两个指标<br>第一个指标为 X，后续指标为 Y。</div>';return warnings;}
  const x=all[0];for(const y of all.slice(1)){const aligned=alignScatter(x.points,y.points);traces.push({name:y.name,type:'scatter',mode:'markers',x:aligned.map(p=>p.x),y:aligned.map(p=>p.y),customdata:aligned.map(p=>p.date),marker:{color:y.setting.color||palette[(y.index-1)%palette.length],size:6,opacity:.65},yaxis:y.setting.axis==='right'?'y2':'y',hovertemplate:'%{customdata}<br>'+esc(x.meta?.name||x.name)+': %{x'+(x.percent?':.2%':':,.4~f')+'}<br>'+esc(y.meta?.name||y.name)+': %{y'+(y.percent?':.2%':':,.4~f')+'}<extra></extra>'});}
  if(!traces.some(t=>t.x.length)){node.innerHTML='<div class="empty">所选指标在当前日期范围内没有共同有效日期。</div>';return warnings;}
 }else for(const s of good)traces.push(trace(s,s.points));
 const yAxis=(list,reversed)=>({title:{text:axisLabel(list),font:{size:10,color:'#7d8e9c'},standoff:5},autorange:reversed?'reversed':true,tickformat:list.length&&list.every(s=>s.percent)?'.0%':'~s',gridcolor:'#eaf0f5',zerolinecolor:'#dae3ea',tickfont:{size:10,color:'#7b8d9c'},automargin:true});
 const xaxis={autorange:card.reverseX?'reversed':true,gridcolor:'#f1f4f7',showgrid:false,tickfont:{size:10,color:'#8393a1'},automargin:true};
 if(card.type==='seasonal'){xaxis.hoverformat='%m月%d日';xaxis.tickmode='array';xaxis.tickvals=Array.from({length:12},(_,i)=>`2000-${String(i+1).padStart(2,'0')}-01`);xaxis.ticktext=Array.from({length:12},(_,i)=>`${i+1}月`);xaxis.range=card.reverseX?['2000-12-31','2000-01-01']:['2000-01-01','2000-12-31'];xaxis.autorange=false;traces.forEach(t=>t.hovertemplate=t.hovertemplate.replace('%Y-%m-%d','%m-%d'));}
 if(card.type==='scatter'){xaxis.title={text:all[0].name+'（'+all[0].unit+'）',font:{size:10}};xaxis.tickformat=all[0].percent?'.0%':'~s';}
 if(timeline){xaxis.type='date';xaxis.rangeslider={visible:true,thickness:.16,bgcolor:'#f3f7fb',bordercolor:'#dce7ef',borderwidth:1,range:traceDateExtent(traces),yaxis:{rangemode:'auto'},yaxis2:{rangemode:'auto'}};}
 const scatterY=card.type==='scatter'?all.slice(1):null;
 const layout={margin:{l:56,r:right.length?58:24,t:20,b:60},paper_bgcolor:'#fff',plot_bgcolor:'#fff',font:{family:'Segoe UI, Microsoft YaHei, sans-serif',size:11,color:'#486376'},showlegend:true,legend:{orientation:'h',x:0,y:-.22,yanchor:'top',font:{size:10},itemwidth:30},hovermode:card.type==='scatter'?'closest':'x unified',hoverlabel:{bgcolor:'#fff',bordercolor:'#d8e4ed',font:{size:11}},xaxis,yaxis:yAxis(scatterY?scatterY.filter(s=>s.setting.axis!=='right'):left,card.reverseLeft),yaxis2:{...yAxis(scatterY?scatterY.filter(s=>s.setting.axis==='right'):right,card.reverseRight),overlaying:'y',side:'right',showgrid:false},barmode:'group',uirevision:JSON.stringify([card.id,card.type,card.start,card.end,card.reverseX,card.reverseLeft,card.reverseRight,card.series])};
 if(timeline){layout.margin.t=48;layout.margin.b=35;layout.legend={...layout.legend,y:1.13,yanchor:'bottom'};layout.dragmode='pan';}
 if(!node.data)node.replaceChildren();
 await Plotly.react(node,traces,layout,{responsive:true,displayModeBar:false,displaylogo:false});
 if(timeline)await attachTimeWindow(node,card);
 return warnings;
}
export function csvData(card,metadata,values){const rows=[['指标','日期','数值','单位','变换','频率','聚合']];for(const s of processed(card,metadata,values))for(const [date,value]of s.points)rows.push([s.name,date,value??'',s.unit,s.setting.transform,s.setting.frequency,s.setting.aggregation]);return '\ufeff'+rows.map(row=>row.map(x=>{const str=typeof x==='string'&&/^[\s]*[=+@\-]/.test(x)?"'"+x:String(x);return '"'+str.replaceAll('"','""')+'"';}).join(',')).join('\r\n');}
export {formatNumber};
