/** One-time, source-aware migration of the two previously published trade pages. */
export const AI_TRADE_MIGRATION='ai-trade-combined-v1';

export function migrateAiTradeWorkspace(workspace,catalog){
 if(!workspace?.pages?.length||workspace.layoutMigrations?.includes(AI_TRADE_MIGRATION))return false;
 const trees=catalog.hierarchies||[],groups=new Map();
 for(const tree of trees){
  if(!['8542','8471'].includes(tree.rootCode))continue;
  const group=groups.get(tree.sourceId)||[];group.push(tree);groups.set(tree.sourceId,group);
 }
 let changed=false;
 for(const [sourceId,trees]of groups){
  const roots=['8542','8471'].map(code=>trees.filter(h=>h.rootCode===code));
  if(roots.some(matches=>matches.length!==1))continue;
  const members=roots.map(matches=>matches[0]);
  const candidates=members.map(h=>workspace.pages.filter(p=>
   (p.hierarchy?.id===h.id&&p.hierarchy.sourceId===sourceId)||(!p.hierarchy&&p.hierarchyId===h.id)));
  // Ambiguous user-created copies are left intact rather than guessing which to merge.
  if(candidates.some(pages=>pages.length!==1)||candidates[0][0]===candidates[1][0])continue;
  const pages=candidates.map(matches=>matches[0]);
  if(pages.some(p=>p.hierarchy?.members?.length>1))continue;
  const primary=pages[0],other=pages[1],active=pages.find(p=>p.id===workspace.activePageId)||primary;
  const activeIndex=pages.indexOf(active),selected=active.hierarchy||{},collapsed=[];
  for(let index=0;index<pages.length;index++){
   const h=members[index];
   for(const code of pages[index].hierarchy?.collapsed||[])collapsed.push(code.includes('|')?code:h.id+'|'+code);
   collapsed.push(h.id+'|'+h.rootCode);
  }
  const cards=pages.flatMap(p=>p.cards||[]),used=new Set();
  for(const card of cards){
   const original=card.id;let next=original,index=2;
   while(used.has(next))next=original+'-merged-'+index++;
   if(next!==original)card.id=next;
   used.add(next);
  }
  primary.name='AI相关进出口';primary.cards=cards;
  primary.hierarchyId=members[0].id;
  primary.hierarchy={...primary.hierarchy,...selected,id:members[0].id,sourceId,rootCode:members[0].rootCode,
   members:members.map(({id,sourceId,rootCode})=>({id,sourceId,rootCode})),
   selectedHierarchyId:members[activeIndex].id,selectedCode:selected.selectedCode||members[activeIndex].rootCode,
   hidden:false,flow:selected.flow||'export',metric:selected.metric||'amount',month:selected.month||'latest',
   collapsed:[...new Set(collapsed)],diyInitialized:true};
  workspace.pages=workspace.pages.filter(p=>p!==other);
  if(pages.some(p=>p.id===workspace.activePageId))workspace.activePageId=primary.id;
  changed=true;
 }
 if(changed)workspace.layoutMigrations=[...(workspace.layoutMigrations||[]),AI_TRADE_MIGRATION];
 return changed;
}
