'use strict';
importScripts('core.js?v=buyback1','buyback-filter.js');
let data=null,manifest=null,result=null;
const cache=new Map();
function progress(message){postMessage({type:'progress',message});}
async function load(){
 if(data)return;
 manifest=await (await fetch('manifest.json',{cache:'no-cache'})).json();
 async function asset(name){
  const response=await fetch(name);if(!response.ok)throw Error('数据下载失败：'+name);
  const bytes=await response.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  if(hash!==manifest.assets[name].sha256)throw Error('数据校验不通过，请刷新重试：'+name);
  const raw=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return JSON.parse(await new Response(raw).text());
 }
 progress('正在核对事件与行情…');const d=await asset('inputs/meta.json.gz');d.prices=[];
 for(let i=0;i<manifest.quotePaths.length;i+=3){
  const parts=await Promise.all(manifest.quotePaths.slice(i,i+3).map(asset));for(const x of parts)x.prices.forEach((p,j)=>d.prices[x.start+j]=p);
  progress('正在校验行情 '+Math.min(i+3,manifest.quotePaths.length)+' / '+manifest.quotePaths.length);
 }
 data=Incentive.initialize(d);
}
function run(p){const key=JSON.stringify(p);if(cache.has(key))return cache.get(key);if(!['全部',...manifest.tools].includes(p.tool)||!['全部',...manifest.methods].includes(p.method))throw Error('用途或方式无效');const view=BuybackFilter.view(data,p);const r=Incentive.run(view,{...p,tool:'全部'});r.params.tool=p.tool;if(cache.size>14)cache.delete(cache.keys().next().value);cache.set(key,r);return r;}
onmessage=async ({data:msg})=>{
 try{
  await load();
  if(msg.type==='run'){
   progress('正在计算交易与每日资金…');result=run(msg.params||manifest.default);
   postMessage({type:'result',result,meta:{days:data.days,symbols:data.symbols,names:data.names,events:data.events},manifest});
  }else if(msg.type==='inspect'){
   if(!result)throw Error('请先生成回测');postMessage({type:'inspect',day:msg.day,detail:Incentive.inspect(BuybackFilter.view(data,result.params),result,msg.day)});
  }else if(msg.type==='poolCompare'){
   const r=run(msg.params);postMessage({type:'poolCompare',id:msg.id,pair:[msg.before,msg.after].map(day=>Incentive.inspect(BuybackFilter.view(data,r.params),r,day))});
  }else if(msg.type==='compare'){
   if(!result)throw Error('请先生成回测');const rows=[];
   for(let months=1;months<=12;months++){progress('对比持有期 '+months+' / 12');const r=run({...result.params,months});rows.push({months,...r.summary,nav:r.nav.map(x=>x[0])});}
   postMessage({type:'compare',rows});
  }
 }catch(e){postMessage({type:'error',id:msg.id,message:e.message});}
};
