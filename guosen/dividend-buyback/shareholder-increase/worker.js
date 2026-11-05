'use strict';
importScripts('./core.js?v=fixed-hold-1');
let data,manifest;const cache=new Map();
async function asset(path){
 const r=await fetch('./'+path);if(!r.ok)throw Error('输入读取失败：'+path);
 const raw=await r.arrayBuffer(),expected=manifest.assets[path];
 const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),x=>x.toString(16).padStart(2,'0')).join('');
 if(!expected||raw.byteLength!==expected.bytes||sha!==expected.sha256)throw Error('数据校验失败，请刷新重试：'+path);
 return JSON.parse(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
}
function result(p){
 const config=FixedHold.settings(p),key=JSON.stringify(config);
 if(!cache.has(key)){cache.set(key,FixedHold.run(data,config));if(cache.size>5)cache.delete(cache.keys().next().value);}
 return cache.get(key);
}
self.onmessage=async({data:msg})=>{
 const {id,type,p}=msg;try{
  let payload;
  if(type==='init'){
   const r=await fetch('./manifest.json',{cache:'no-store'});if(!r.ok)throw Error('无法读取研究版本');manifest=await r.json();
   if(manifest.publication!=='fixed-hold-v1-20261105')throw Error('研究版本不一致，请刷新');
   const meta=await asset('inputs/meta.json.gz'),prices=Array(meta.symbols.length);
   for(let i=0;i<manifest.quotePaths.length;i++){
    const part=await asset(manifest.quotePaths[i]);part.prices.forEach((row,k)=>{prices[part.start+k]=row;});
    self.postMessage({id,progress:`正在校验行情 ${i+1}/${manifest.quotePaths.length}`});
   }
   data=FixedHold.initialize({...meta,prices});payload={meta,manifest};
  }else{
   if(!data)throw Error('数据尚未加载');
   if(type==='run'){const r=result(p);payload={result:r,allSix:result({...p,mask:63}).nav.map(n=>n[0])};}
   else if(type==='inspect')payload=FixedHold.inspect(data,result(p),msg.day);
   else if(type==='poolCompare'){const r=result(p);payload=[msg.before,msg.after].map(day=>FixedHold.inspect(data,r,day));}
   else if(type==='compare'){
    payload=[];
    for(let months=1;months<=24;months++){
     const r=FixedHold.run(data,{...p,months});payload.push({months,...r.summary});
     self.postMessage({id,progress:`持有期对比 ${months}/24`});await new Promise(resolve=>setTimeout(resolve,0));
    }
   }else throw Error('未知操作');
  }
  self.postMessage({id,payload});
 }catch(e){self.postMessage({id,error:e.message});}
};
