/** Merge only externally introduced source pages/cards; existing local edits win. */
export function mergeSourcePages(local,remote,sourceIds,indicators){
 const found=new Set();let changed=false;
 if(!remote?.pages||!sourceIds.size)return{changed,found};
 const sourceByIndicator=new Map(indicators.map(i=>[i.id,i.sourceId]));
 for(const remotePage of remote.pages){
  const hierarchySource=remotePage.hierarchy?.sourceId;
  const newHierarchy=sourceIds.has(hierarchySource);
  if(newHierarchy)found.add(hierarchySource);
  const newCards=(remotePage.cards||[]).filter(card=>(card.series||[]).some(series=>{const source=sourceByIndicator.get(series.indicatorId);if(!sourceIds.has(source))return false;found.add(source);return true;}));
  if(!newCards.length&&!newHierarchy)continue;
  let page=local.pages.find(p=>p.id===remotePage.id);
  if(!page){page={...structuredClone(remotePage),cards:[]};local.pages.push(page);changed=true;}
  else if(newHierarchy&&!page.hierarchy&&!page.hierarchyId){page.hierarchy=structuredClone(remotePage.hierarchy);changed=true;}
  for(const card of newCards){if(!page.cards.some(c=>c.id===card.id)){page.cards.push(structuredClone(card));changed=true;}}
 }
 return{changed,found};
}
