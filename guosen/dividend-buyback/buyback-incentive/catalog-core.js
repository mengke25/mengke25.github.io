'use strict';
const Catalog = (() => {
 function snapshot(p,date){let last=null;for(const s of p.snapshots){if(s.day>date)break;last=s;}return last;}
 function stage(plan,incentive,link,date){
  if(!incentive||!link||!link.reviewed||link.knownFrom>date||incentive.proposal>date)return '回购';
  return incentive.implementation&&incentive.implementation<=date?'股权激励·已实施':'股权激励·待实施';
 }
 function rows(data,date,filters={}){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>data.cutoff||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('请选择数据截止日以内的有效日期');
  const incentives=new Map(data.incentives.map(p=>[p.id,p])),links=new Map(data.links.map(l=>[l.buybackId,l])),covered=new Set(),out=[];
  for(const p of data.buybacks){
   const s=snapshot(p,date);if(!s)continue;
   const l=links.get(p.id),i=l?incentives.get(l.incentiveId):null,g=stage(p,i,l,date);
   if(g!=='回购')covered.add(i.id);
   out.push({id:p.id,code:p.code,name:p.name,kind:'回购方案',stage:g,purpose:s.purpose,rawPurpose:s.rawPurpose,method:s.method,proposal:p.proposal,disclosure:s.day,progress:s.progress,amount:s.amount,shares:s.shares,incentiveProposal:g!=='回购'?i.proposal:null,implementation:g==='股权激励·已实施'?i.implementation:null,link:g!=='回购'?'已核实对应方案':'未核实对应激励，不自动转类',evidence:g!=='回购'?l.evidence:'原表回购明细；未提供对应激励方案编号',conflict:s.conflict?'同日明细存在差异，金额未汇总':'',sourceIds:s.evidence.join('；')});
  }
  for(const p of data.incentives){
   if(p.proposal>date||covered.has(p.id))continue;
   const implemented=p.implementation&&p.implementation<=date;
   out.push({id:p.id,code:p.code,name:p.name,kind:'独立激励方案',stage:implemented?'股权激励·已实施':'股权激励·待实施',purpose:'股权激励方案',rawPurpose:p.tools.join('、'),method:'不适用（激励方案）',proposal:p.proposal,disclosure:implemented?p.implementation:p.proposal,progress:implemented?'已有首次实施公告':'预案已公告，未见当时实施日期',amount:null,shares:null,incentiveProposal:p.proposal,implementation:implemented?p.implementation:null,link:'对应回购批次未核实',evidence:'股权激励一览：预案公告日 / 首次实施公告日',conflict:p.dateConflict?'原始日期存在冲突，请核查':'',sourceIds:p.id});
  }
  const has=(v,x)=>!v||v==='全部'||v===x,q=(filters.query||'').trim().toLowerCase();
  return out.filter(r=>has(filters.purpose,r.purpose)&&has(filters.method,r.method)&&has(filters.stage,r.stage)&&(!q||(r.code+' '+r.name).toLowerCase().includes(q))).sort((a,b)=>b.disclosure.localeCompare(a.disclosure)||a.code.localeCompare(b.code)||a.id.localeCompare(b.id));
 }
 function diff(a,b){
  const am=new Map(a.map(r=>[r.id,r])),bm=new Map(b.map(r=>[r.id,r]));
  if(am.size!==a.length||bm.size!==b.length)throw Error('方案标识重复');
  return [...new Set([...am.keys(),...bm.keys()])].sort().map(id=>{const x=am.get(id),y=bm.get(id);return {id,code:(y||x).code,name:(y||x).name,before:x,after:y,status:!x?'新增':!y?'移出':x.stage!==y.stage?'阶段变更':x.purpose!==y.purpose||x.method!==y.method?'用途/方式变更':'保留'};});
 }
 return {snapshot,stage,rows,diff};
})();
if(typeof module!=='undefined')module.exports=Catalog;
