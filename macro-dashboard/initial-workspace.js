/** Create a fresh layout from catalog mappings, without guessing commodity codes. */
export function createInitialWorkspace(catalog,{makeId,makeCard}){
 const pages=[],usedNames=new Set();
 const uniqueName=(preferred,source,rootCode='')=>{let name=preferred||source.name||'研究页面';if(usedNames.has(name))name+=' · '+source.name+(rootCode?' '+rootCode:'');let suffix=2,base=name;while(usedNames.has(name))name=base+' '+suffix++;usedNames.add(name);return name;};
 for(const source of catalog.sources||[]){
  const hierarchies=(catalog.hierarchies||[]).filter(h=>h.sourceId===source.id);
  if(hierarchies.length){
   for(const h of hierarchies){const branches=(h.nodes||[]).filter(n=>n.level===6);pages.push({id:makeId(),name:uniqueName(h.name,source,h.rootCode),sourceId:source.id,hierarchyId:h.id,hierarchy:{id:h.id,sourceId:source.id,rootCode:h.rootCode,hidden:false,flow:'export',metric:'amount',month:'latest',selectedCode:branches[0]?.code||h.rootCode,collapsed:branches.slice(1).map(n=>n.code),diyInitialized:false},cards:[]});}
   continue;
  }
  const available=(catalog.indicators||[]).filter(i=>i.sourceId===source.id&&i.count>0),raw=available.filter(i=>!i.percent),first=(raw.length?raw:available).slice(0,2);
  const page={id:makeId(),name:uniqueName(source.group||source.name,source),sourceId:source.id,cards:[]};
  if(first.length){page.cards.push(makeCard(source.name+' · 指标走势','line',first.map(i=>i.id)),makeCard(first[0].name+' · 季节性','seasonal',[first[0].id]));if(first.length>1)page.cards.push(makeCard(source.name+' · 指标相关性','scatter',first.map(i=>i.id)));}
  pages.push(page);
 }
 if(!pages.length)pages.push({id:makeId(),name:'我的研究',cards:[]});
 return{schemaVersion:1,pages,activePageId:pages[0].id};
}
