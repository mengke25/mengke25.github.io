'use strict';
const BuybackFilter=(()=>{
 function items(e,p){return e.items.filter(i=>(p.tool==='全部'||i.purpose===p.tool)&&(p.method==='全部'||i.method===p.method));}
 function view(d,p){
  if(typeof p.method!=='string'||!p.method)throw Error('回购方式无效');
  // A purpose and method must match the SAME plan, never two different plans of a stock.
  return {...d,byDay:d.byDay.map(rs=>rs.filter(r=>items(d.events[r],p).length))};
 }
 return {items,view};
})();
if(typeof module!=='undefined')module.exports=BuybackFilter;
