/* Shared, dependency-free stock-pool comparison and browser XLSX export.
 * This module only reads snapshots; it never changes the backtest account. */
'use strict';
const PoolCompare=(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const xml=v=>esc(String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,''));
 function diff(before,after){
  function keyed(rows){const m=new Map();for(const r of rows){if(!r.code||m.has(r.code))throw Error('股票池存在缺失或重复代码，未生成对比。');m.set(r.code,r);}return m;}
  const a=keyed(before),b=keyed(after),all=[...new Set([...a.keys(),...b.keys()])].sort();
  const changes=all.map(code=>({code,name:(b.get(code)||a.get(code)).name,status:a.has(code)?b.has(code)?'保留':'移除':'新增',before:a.get(code)||null,after:b.get(code)||null}));
  const status=new Map(changes.map(r=>[r.code,r.status]));
  return {before:[...a.values()].sort((x,y)=>x.code.localeCompare(y.code)).map(r=>({...r,change:status.get(r.code)})),after:[...b.values()].sort((x,y)=>x.code.localeCompare(y.code)).map(r=>({...r,change:status.get(r.code)})),changes,counts:{added:changes.filter(r=>r.status==='新增').length,kept:changes.filter(r=>r.status==='保留').length,removed:changes.filter(r=>r.status==='移除').length}};
 }
 const encoder=new TextEncoder(),NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
 function crc32(a){let c=0xffffffff;for(const b of a)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
 function concat(parts){const a=new Uint8Array(parts.reduce((s,p)=>s+p.length,0));let i=0;for(const p of parts){a.set(p,i);i+=p.length;}return a;}
 function zip(files){
  const local=[],central=[];let offset=0;
  for(const [path,text] of Object.entries(files)){
   const name=encoder.encode(path),bytes=encoder.encode(text),crc=crc32(bytes),h=new Uint8Array(30),v=new DataView(h.buffer);
   v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,name.length,true);
   local.push(h,name,bytes);const ch=new Uint8Array(46),cv=new DataView(ch.buffer);
   cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,33,true);cv.setUint32(16,crc,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);central.push(ch,name);offset+=h.length+name.length+bytes.length;
  }
  const directory=concat(central),end=new Uint8Array(22),ev=new DataView(end.buffer),n=Object.keys(files).length;
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,n,true);ev.setUint16(10,n,true);ev.setUint32(12,directory.length,true);ev.setUint32(16,offset,true);return concat([...local,directory,end]);
 }
 function col(n){let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
 function cell(value,kind,addr,header=false){
  if(value==null)return `<c r="${addr}"/>`;
  let style=header?1:kind==='percent'?3:kind==='date'?4:kind==='number'?2:0;
  if(!header&&kind==='date'&&/^\d{4}-\d{2}-\d{2}$/.test(value)){value=(Date.parse(value+'T00:00:00Z')-Date.UTC(1899,11,30))/86400000;}
  if(!header&&typeof value==='number'){if(!Number.isFinite(value))throw Error('导出包含非有限数值');return `<c r="${addr}" s="${style}"><v>${value}</v></c>`;}
  // Explicit string cells: security codes keep leading zeroes; text is never a formula.
  return `<c r="${addr}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
 }
 function xlsx(sheets){
  const files={};
  files['[Content_Types].xml']=`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
  files['_rels/.rels']='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  files['xl/workbook.xml']=`<workbook xmlns="${NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s,i)=>`<sheet name="${xml(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`;
  files['xl/_rels/workbook.xml.rels']=`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  files['xl/styles.xml']=`<styleSheet xmlns="${NS}"><numFmts count="3"><numFmt numFmtId="164" formatCode="#,##0.0000"/><numFmt numFmtId="165" formatCode="0.00%"/><numFmt numFmtId="166" formatCode="yyyy-mm-dd"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Microsoft YaHei"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Microsoft YaHei"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF087E73"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  sheets.forEach((s,i)=>{
   const end=col(s.columns.length-1)+(s.rows.length+1);
   const rows=[s.columns.map(c=>c.label),...s.rows];
   files[`xl/worksheets/sheet${i+1}.xml`]=`<worksheet xmlns="${NS}"><dimension ref="A1:${end}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="22"/><cols>${s.columns.map((c,j)=>`<col min="${j+1}" max="${j+1}" width="${c.width||20}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.map((r,n)=>`<row r="${n+1}"${n===0?' ht="32" customHeight="1"':''}>${r.map((v,j)=>cell(v,s.columns[j].kind,col(j)+(n+1),n===0)).join('')}</row>`).join('')}</sheetData>${s.filter===false?'':`<autoFilter ref="A1:${end}"/>`}</worksheet>`;
  });return zip(files);
 }
 const common=[{key:'code',label:'证券代码',width:18},{key:'name',label:'证券名称',width:18},{key:'change',label:'两期变动',width:15}];
 function workbook(model,which='both'){
  const {before,after,changes,counts}=model.diff;
  const note=[['策略',model.title],['股票池类型',model.kindLabel],['前期交易日',model.beforeDate],['本期交易日',model.afterDate],['数据截止',model.cutoff],['已生效参数',model.params],['前期股票数',before.length],['本期股票数',after.length],['新增',counts.added],['保留',counts.kept],['移除',counts.removed],['比较口径','按完整证券代码比较两日收盘名单；保留仅表示两期均在名单中，不表示数量、成本或事件不变。'],['注意','两期差异不等于区间全部买卖；期间买入又卖出的股票可能不出现在两期名单。'],['信号与持仓',model.note],['指定剔除',model.excluded||'无']];
  const sheets=[{name:'对比说明',columns:[{label:'项目',width:23},{label:'内容',width:105}],rows:note,filter:false}];
  const columns=[{key:'date',label:'交易日',kind:'date',width:16},...common,...model.columns];
  function add(name,date,rows){sheets.push({name,columns,rows:rows.map(r=>columns.map(c=>c.key==='date'?date:r[c.key]??null))});}
  if(which!=='after')add('前期股票池',model.beforeDate,before);
  if(which!=='before')add('本期股票池',model.afterDate,after);
  if(which==='both'){
   const cs=[...common.map(c=>c.key==='change'?{...c,key:'status'}:c),...['before','after'].flatMap(side=>model.columns.map(c=>({...c,key:[side,c.key],label:(side==='before'?'前期':'本期')+' '+c.label})))];
   sheets.push({name:'变动明细',columns:cs,rows:changes.map(r=>cs.map(c=>Array.isArray(c.key)?r[c.key[0]]?.[c.key[1]]??null:r[c.key]??null))});
  }return sheets;
 }
 function mount(element,adapter){
  element.innerHTML=`<div class="section-title"><h2>股票池两期对比</h2></div><div class="toolbar pc-controls"><label>比较名单<select data-pc="kind"><option value="pool">信号股票池</option><option value="holdings">实际持仓</option></select></label><label>前期交易日<input data-pc="before" type="date"></label><label>本期交易日<input data-pc="after" type="date"></label><button data-pc="refresh">更新对比</button></div><p data-pc="note" class="note"></p><p data-pc="message" role="status" aria-live="polite"></p><div class="buttons"><button data-pc="download-before" disabled>下载前期 XLSX</button><button data-pc="download-after" disabled>下载本期 XLSX</button><button data-pc="download-both" class="primary" disabled>下载两期对比 XLSX</button></div><div data-pc="tables" class="pc-pair"></div><p class="hint">新增＝仅本期在池；保留＝两期都在池；移除＝仅前期在池。名单变化不等于全部实际买卖，保留也不代表持股数不变。</p>`;
  const el=k=>element.querySelector(`[data-pc="${k}"]`);let state=null,model=null,version=0,blocked=false;
  function downloads(disabled){['before','after','both'].forEach(k=>el('download-'+k).disabled=disabled);}
  function clear(){model=null;version++;downloads(true);el('tables').innerHTML='';}
  function displayValue(v,kind){if(v==null)return '—';if(typeof v==='number')return kind==='percent'?(v*100).toFixed(2)+'%':v.toLocaleString('zh-CN',{maximumFractionDigits:4});return String(v);}
  function renderTable(title,rows){const columns=[...common,...model.columns];return `<section><h3>${esc(title)}（${rows.length} 只）</h3>${rows.length?`<div class="table-wrap"><table><thead><tr>${columns.map(c=>`<th scope="col">${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr class="pc-${r.change==='新增'?'added':r.change==='移除'?'removed':'kept'}">${columns.map(c=>`<td>${esc(displayValue(r[c.key],c.kind))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="empty">这一天没有符合条件的股票，可更换日期查看。</p>'}</section>`;}
  async function refresh(){
   if(!state||blocked)return;clear();const ticket=version,snapshot=state,kind=el('kind').value,a=el('before').value,b=el('after').value;
   const ai=snapshot.days.indexOf(a),bi=snapshot.days.indexOf(b);
   if(ai<snapshot.min||bi>snapshot.max||ai<0||bi<0||ai>bi){el('message').textContent='请选择本次回测范围内的两个交易日，且前期不能晚于本期。';return;}
   el('message').textContent='正在读取两期名单…';el('note').textContent=snapshot.notes[kind];
   try{
    const pair=await adapter.load(ai,bi,snapshot),mapped=pair.map(d=>adapter.rows(d,kind));if(ticket!==version)return;
    model={...snapshot,beforeDate:a,afterDate:b,kindLabel:kind==='pool'?'信号股票池':'实际持仓',columns:adapter.columns(kind),note:snapshot.notes[kind],diff:diff(...mapped)};
    const c=model.diff.counts;el('message').textContent=`前期 ${model.diff.before.length} 只 → 本期 ${model.diff.after.length} 只；新增 ${c.added} 只，保留 ${c.kept} 只，移除 ${c.removed} 只。`;
    el('tables').innerHTML=renderTable('前期 · '+a,model.diff.before)+renderTable('本期 · '+b,model.diff.after);downloads(false);
   }catch(e){if(ticket===version)el('message').textContent='无法生成对比：'+e.message;}
  }
  ['before','after','kind'].forEach(k=>el(k).addEventListener('change',refresh));el('refresh').onclick=refresh;
  ['before','after','both'].forEach(k=>el('download-'+k).onclick=()=>{
   if(!model||blocked)return;try{const data=xlsx(workbook(model,k)),url=URL.createObjectURL(new Blob([data],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})),a=document.createElement('a');a.href=url;a.download=`${model.title}_${model.kindLabel}_${model.beforeDate}_${model.afterDate}_${k==='both'?'两期对比':k==='before'?'前期':'本期'}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}catch(e){el('message').textContent='下载失败：'+e.message;}
  });
  return {update(next){state=next;for(const k of ['before','after']){el(k).min=next.days[next.min];el(k).max=next.days[next.max];}el('before').value=next.days[Math.max(next.min,next.max-1)];el('after').value=next.days[next.max];return refresh();},block(value){blocked=value;clear();element.querySelectorAll('input,select,button').forEach(x=>x.disabled=value);downloads(true);if(value)el('message').textContent='等待本次计算完成…';else refresh();},getModel:()=>model};
 }
 return {diff,xlsx,workbook,mount};
})();
if(typeof module!=='undefined')module.exports=PoolCompare;
