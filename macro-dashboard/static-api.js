const measures=['amount','quantity'];
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const copy=value=>structuredClone(value);

/** Mirrors backend.hierarchy.monthly_values: duplicate observations in a month are null. */
export function monthlyValues(points){const result=new Map(),seen=new Set();for(const [date,value]of points||[]){const month=String(date).slice(0,7);if(seen.has(month))result.set(month,null);else result.set(month,finite(value)?value:null);seen.add(month);}return result;}

/** Mirrors backend.hierarchy.analytics; derived observations are read, never recomputed. */
export function hierarchyAnalytics(catalog,series,treeId,selectedMonth=null,flow='export'){
 if(!['export','import'].includes(flow))throw new Error('进出口方向必须为 export 或 import。');
 const tree=(catalog.hierarchies||[]).find(h=>h.id===treeId);
 if(!tree)throw new Error('商品层级不存在，请检查网页更新。');
 const monthly=new Map(),byCode=new Map(tree.nodes.map(node=>[node.code,node]));
 for(const node of tree.nodes)for(const measure of measures)for(const id of Object.values(node.series[flow][measure]))if(id&&!monthly.has(id))monthly.set(id,monthlyValues(series[id]?.points||[]));
 const value=(id,month)=>monthly.get(id)?.get(month)??null;
 const available=[...new Set(tree.nodes.flatMap(node=>measures.flatMap(measure=>[...(monthly.get(node.series[flow][measure].raw)||[])].filter(([,v])=>v!==null).map(([month])=>month))))].sort();
 const month=selectedMonth&&selectedMonth!=='latest'?selectedMonth:available.at(-1)||null;
 if(month&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('月份格式需为 YYYY-MM。');
 const root=byCode.get(tree.rootCode);
 if(!root)throw new Error('商品层级缺少 HS4 根节点。');
 const denominators={};
 const nodes=tree.nodes.map(node=>{
  const metrics={};
  for(const measure of measures){
   const mapping=node.series[flow][measure],info=node.measureInfo[flow][measure],rootInfo=root.measureInfo[flow][measure];
   const vals=Object.fromEntries(Object.entries(mapping).map(([stat,id])=>[stat,value(id,month)]));
   const denominator=value(root.series[flow][measure].raw,month),leafCodes=info.leafCodes||[];
   const valid=leafCodes.filter(code=>value(byCode.get(code)?.series?.[flow]?.[measure]?.raw,month)!==null).length;
   const knownMismatch=!!(info.unit&&rootInfo.unit&&info.unit!==rootInfo.unit),sameKnownUnit=!!(info.unit&&info.unit===rootInfo.unit);
   const sourceAmountBasis=measure==='amount'&&rootInfo.basis==='source_cached_parent';
   const withinRootScope=leafCodes.every(code=>(rootInfo.leafCodes||[]).includes(code));
   const share=vals.raw!==null&&denominator!==null&&denominator!==0&&withinRootScope&&!knownMismatch&&(sameKnownUnit||sourceAmountBasis)?vals.raw/denominator:null;
   const {raw,...derived}=vals;
   metrics[measure]={value:raw,...derived,unit:info.unit,share:finite(share)?share:null,shareLabel:rootInfo.basis==='covered_quantity_subset'?'占芯片数量篮子（不含零件，非官方HS4全量）':sourceAmountBasis&&!rootInfo.unit?'按原表金额汇总口径（单位未注明）':'占已覆盖HS8篮子（非官方HS4全量）',coverage:`覆盖篮子 ${valid}/${leafCodes.length} 项有值`,warnings:info.warnings};
   if(info.scopeLabel)Object.assign(metrics[measure],{scopeLabel:info.scopeLabel,excludedLeafCodes:info.excludedLeafCodes});
   if(node.code===tree.rootCode)denominators[measure]=Object.fromEntries(['value','unit','coverage','warnings',...(info.scopeLabel?['scopeLabel','excludedLeafCodes']:[])].map(key=>[key,metrics[measure][key]]));
  }
  return{...Object.fromEntries(['code','parentCode','level','name','evidence','warnings'].map(key=>[key,node[key]])),series:node.series[flow],metrics};
 });
 const directRoot=measures.some(measure=>root.measureInfo[flow][measure].basis==='source_cached_parent');
 return{version:catalog.version,hierarchyId:tree.id,sourceId:tree.sourceId,rootCode:tree.rootCode,name:tree.name,date:month,flow,availableMonths:available,warnings:tree.warnings,denominator:{label:directRoot?'原表缓存HS4汇总口径；单位未注明，未验证官方全量':'已覆盖HS8叶子篮子；未验证海关HS4全量',official:false,...denominators},nodes};
}

export function createStaticApi(options={}){
 const baseUrl=options.baseUrl||globalThis.document?.baseURI||globalThis.location?.href;
 if(!baseUrl)throw new Error('缺少网页地址。');
 const fetcher=options.fetch||globalThis.fetch.bind(globalThis),manifestUrl=new URL('./data/manifest.json',baseUrl);
 const sitePath=options.sitePath||new URL('./',baseUrl).pathname;
 const storageKey='macro-dashboard:workspace:'+sitePath;
 let manifest=null,manifestPending=null,storageWarning='';
 const files=new Map();
 const storage=()=>options.storage!==undefined?options.storage:globalThis.localStorage;
 async function json(url,cache){const response=await fetcher(url.toString(),{cache});if(!response.ok)throw new Error(`网页数据读取失败（${response.status}）：${new URL(url).pathname.split('/').at(-1)}`);try{return await response.json();}catch{throw new Error('网页数据格式无效，请稍后检查更新。');}}
 async function loadManifest(check=false){
  if(manifestPending)return manifestPending;
  if(manifest&&!check)return manifest;
  manifestPending=(async()=>{const url=new URL(manifestUrl);url.searchParams.set('_',String((options.now||Date.now)()));const next=await json(url,'no-store');
   if(next.schemaVersion!==1||typeof next.version!=='string'||!next.version)throw new Error('网页数据清单版本无效。');
   for(const kind of ['catalog','series','workspace'])if(typeof next[kind]!=='string'||!new RegExp('^'+kind+'\\.[A-Za-z0-9_-]+\\.json$').test(next[kind]))throw new Error('网页数据文件引用无效。');
   if(!manifest||next.version!==manifest.version){files.clear();manifest=next;}
   return manifest;
  })();
  try{return await manifestPending;}finally{manifestPending=null;}
 }
 async function file(kind,snapshot){const current=snapshot||await loadManifest(),url=new URL(current[kind],manifestUrl).toString();if(!files.has(url))files.set(url,json(url,'force-cache').catch(error=>{files.delete(url);throw error;}));return files.get(url);}
 function readSaved(){try{const target=storage();if(!target)throw new Error('storage unavailable');const raw=target.getItem(storageKey);if(raw===null)return null;const saved=JSON.parse(raw);if(saved?.schemaVersion!==1||!Array.isArray(saved.pages))throw new Error('invalid workspace');storageWarning='';return saved;}catch{storageWarning='此浏览器的配置存储不可用或已有配置无法读取。当前显示发布者配置；修改可能无法保存，请使用页面配置导出备份。';return null;}}
 async function api(path,method='GET',data){
  const request=new URL(path,'https://static-api.invalid/'),route=request.pathname.replace(/^\//,''),verb=method.toUpperCase();
  if(route==='workspace'&&verb==='PUT'){
   if(data?.schemaVersion!==1||!Array.isArray(data.pages))throw new Error('页面配置格式无效。');
   try{const target=storage(),serialized=JSON.stringify(data);if(!target)throw new Error('storage unavailable');target.setItem(storageKey,serialized);if(target.getItem(storageKey)!==serialized)throw new Error('storage unavailable');storageWarning='';return{ok:true};}catch{storageWarning='保存失败：浏览器未允许本地存储或存储空间不足。请允许此站点存储，或导出页面配置备份。';throw new Error(storageWarning);}
  }
  if(route==='refresh'&&verb==='POST'){const previous=manifest?.version,next=await loadManifest(true);return{catalog:copy(await file('catalog',next)),changed:previous!==next.version};}
  if(verb!=='GET')throw new Error('网页快照不支持添加、修改或移除本地 Excel 数据源。');
  if(route==='catalog'){const current=await loadManifest(true);return copy(await file('catalog',current));}
  if(route==='workspace'){const saved=readSaved();if(saved)return copy(saved);return copy(await file('workspace'));}
  if(route==='series'){const current=await loadManifest(),all=await file('series',current),ids=(request.searchParams.get('ids')||'').split(',').filter(Boolean);return{version:current.version,series:Object.fromEntries(ids.filter(id=>Object.hasOwn(all,id)).map(id=>[id,copy(all[id])]))};}
  if(route==='hierarchy'){const current=await loadManifest(),[catalog,series]=await Promise.all([file('catalog',current),file('series',current)]);return hierarchyAnalytics(catalog,series,request.searchParams.get('id'),request.searchParams.get('date'),request.searchParams.get('flow')||'export');}
  if(route==='health'){const current=await loadManifest();return{status:'ok',version:current.version};}
  throw new Error('网页快照不支持此操作。');
 }
 api.storageWarning=()=>storageWarning;
 api.storageKey=storageKey;
 return api;
}
