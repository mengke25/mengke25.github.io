'use strict';
// Only opens a backtest with the chosen parameters; never sends real orders.
(()=>{
 if(!location.hash.startsWith('#research-rank='))return;
 let p;try{p=JSON.parse(decodeURIComponent(location.hash.slice(15)));}catch{return;}
 let count=0;const timer=setInterval(async()=>{
  if(++count>240){clearInterval(timer);return;}
  if(typeof busy==='undefined'||busy||!document.querySelector('#generate')||document.querySelector('#generate').disabled)return;
  clearInterval(timer);
  try{
   if(document.getElementById('ratio')){setForm(p);await generate(p);navTo('account');}
   else{for(const [id,key] of [['months','months'],['weight','weight'],['tool','tool'],['from','start'],['to','end'],['method-filter','method']]){const e=document.getElementById(id);if(e&&p[key]!==undefined)e.value=p[key];}document.getElementById('nonST').checked=p.nonST;document.getElementById('params').requestSubmit();show('nav');}
   history.replaceState(null,'',location.pathname+location.search);
  }catch(e){const output=document.getElementById('error');if(output){output.hidden=false;output.textContent='套用排名参数失败：'+e.message;}}
 },500);
})();
