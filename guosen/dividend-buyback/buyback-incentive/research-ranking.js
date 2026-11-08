'use strict';
(()=>{
 const mount=document.getElementById('research-ranking');if(!mount)return;
 const esc=x=>String(x??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=x=>Number.isFinite(x)?(x*100).toFixed(2)+'%':'—',num=x=>Number.isFinite(x)?x.toLocaleString('zh-CN',{maximumFractionDigits:2}):'—';
 const paths={shareholder:'shareholder-increase',buyback:'buyback-incentive/buyback',incentive:'equity-incentive'},reports=[];
 const table=(headers,rows)=>rows.length?'<div class="table-wrap"><table><thead><tr>'+headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<p class="rank-note">本日没有对应记录。不用此前的股票补成今天的名单。</p>';
 const route=r=>new URL(mount.dataset.root+paths[r.kind]+'/',location.href);
 async function check(r){for(const [file,want] of [['manifest.json',r.manifestHash],['core.js',r.engineHash],...(r.filterHash?[['buyback-filter.js',r.filterHash]]:[])]){if(!want)throw Error('排名缺少版本标识');const response=await fetch(new URL(file,route(r)),{cache:'no-cache'});if(!response.ok)throw Error('无法核对排名版本');const raw=await response.arrayBuffer(),bytes=file.endsWith('.js')?new TextEncoder().encode(new TextDecoder().decode(raw).replace(/\r\n/g,'\n')):raw;const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');if(digest!==want)throw Error('数据或算法已更新，请重新生成排名；暂不展示旧结论。');}}
 function detail(i,j){
  const r=reports[i],t=r.top[j],el=mount.querySelector(`[data-detail="${i}"]`);el.dataset.selected=j;
  const next=route(r);next.hash='research-rank='+encodeURIComponent(JSON.stringify({...t.params,start:r.start,end:r.end}));
  el.innerHTML=`<h3>第 ${t.rank} 名：${esc(t.label)}</h3><p class="rank-note">${esc(r.fixed)}。这是在 ${esc(r.start)} 起运行的历史账户，不代表今天新建仓也能得到相同结果。</p><div class="rank-grid"><span>全历史年化收益 <strong>${pct(t.full.annual)}</strong></span><span>全历史最大回撤 <strong>${pct(t.full.drawdown)}</strong></span><span>期末现金 <strong>${num(t.cash)} 元</strong></span></div><div class="rank-actions"><a class="rank-apply" href="${esc(next.href)}" target="_blank" rel="noopener">套用这组参数，查看净值与交易</a><button data-download="${i}">下载本组股票与卖出日 XLSX</button></div><h4>截至 ${esc(r.end)} 的${r.kind==='shareholder'?'收盘候选池':'公告信号池'}（${t.pool.length} 只）</h4><p class="rank-note">不是今日实时荐股。${r.kind==='shareholder'?'候选不等于已经买入；下次开盘还要确认价格、可交易性和现金。':'只展示该交易日对应的公告信号，未成交原因见处理结果；不追买此前错过的公告。'}新买入后持有 ${t.params.months} 个自然月，到期不能卖则顺延。</p>`;
  el.innerHTML+=table(['代码','名称','公告日',...(r.kind==='shareholder'?['增持比例','股东成本','被套幅度']:[]),'处理结果','何时卖出'],t.pool.map(x=>[x.code,x.name,x.ann,...(r.kind==='shareholder'?[pct(x.ratio),num(x.cost),pct(x.under)]:[]),x.status,x.exitRule]));
  el.innerHTML+=`<h4>历史账户尚未卖出的持仓（${t.holdings.length} 只）</h4><p class="rank-note">按当前固定持有期规则卖出，不是股东解套即卖。“到期日”是计划日期，不是保证成交日。</p>`+table(['代码','名称','买入日','计划到期日',...(r.kind==='shareholder'?['当前被套']:[]),'持股数','状态'],t.holdings.map(x=>[x.code,x.name,x.entry,x.due,...(r.kind==='shareholder'?[pct(x.under)]:[]),num(x.qty),x.status||(x.overdue?'到期未退出':'持有至到期')]));
 }
 function download(i){const r=reports[i],j=+mount.querySelector(`[data-detail="${i}"]`).dataset.selected,t=r.top[j];
  const cols=['代码','名称','公告日','买入日','计划到期日',r.kind==='shareholder'?'股东增持成本（元/股）':'持仓买入金额（元）','被套幅度','股数','说明'];
  const rows=xs=>xs.map(x=>[x.code,x.name,x.ann,x.entry||'',x.due||'',x.cost??'',x.under??'',x.qty??'',x.exitRule||x.status||(x.overdue?'到期未退出':'持有至到期')]);
  const sheets=[{name:'说明',columns:[{label:'项目'},{label:'内容',width:95}],rows:[['策略',r.title],['参数',t.label],['固定条件',r.fixed],['截止日',r.end],['排序','前70%训练期年化收益差；后30%只检验、不排序'],['训练截止',r.trainEnd],['检验开始',r.validationStart],['风险','历史回测非实时建议；不复权、零费用；新买入按实际买入日加持有月份，到期可成交时卖出'],['版本',r.fingerprint]]},...['候选或信号池','实际持仓'].map((name,k)=>({name,columns:cols.map(label=>({label,width:22})),rows:rows(k?t.holdings:t.pool),filter:true}))];
  const url=URL.createObjectURL(new Blob([PoolCompare.xlsx(sheets)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})),a=document.createElement('a');a.href=url;a.download=`${r.title}_第${t.rank}名_${r.end}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 mount.addEventListener('click',e=>{const select=e.target.closest('[data-rank]'),dl=e.target.closest('[data-download]');if(select)detail(+select.dataset.report,+select.dataset.rank);if(dl)download(+dl.dataset.download);});
 (async()=>{try{
  const res=await fetch(mount.dataset.json,{cache:'no-cache'});if(!res.ok)throw Error('排名结果尚未发布');const raw=await res.json();reports.push(...(raw.reports||[raw]));await Promise.all(reports.map(check));
  mount.innerHTML='<h2>历史回测结论：前三名参数</h2><p class="rank-note">按前70%交易日的年化收益差（策略年化收益减万得全A年化收益）排名；后30%从现金重新开始检验，不参与排序。训练期至少30笔已卖出交易、10只股票；交易完全相同的参数只保留一组。这是有限参数范围内的历史排名，不是未来最优参数。</p><p class="rank-note">下列榜单采用固定条件，手动改门槛、仓位或日期不会自动更新榜单。不复权价格、零费用及历史数据覆盖限制仍然适用。</p>';
  reports.forEach((r,i)=>{
   mount.innerHTML+=`<h3>${esc(r.title)}</h3><p class="rank-note">${esc(r.fixed)}。比较 ${r.grid.toLocaleString()} 组参数，${r.qualified.toLocaleString()} 组达到样本门槛。训练：${esc(r.start)}—${esc(r.trainEnd)}；留出检验：${esc(r.validationStart)}—${esc(r.end)}。</p>`;
   if(!r.top.length){mount.innerHTML+='<p class="rank-warning">没有参数达到样本门槛，本次不推荐参数，不强凑前三名。</p>';return;}
   const first=r.top[0];mount.innerHTML+=`<p>训练期第一名是 <strong>${esc(first.label)}</strong>。在后30%检验期，年化收益差为 <strong>${pct(first.validation.excessAnnual)}</strong>，最大回撤为 ${pct(first.validation.drawdown)}，完成 ${first.validation.sells} 笔卖出。</p>`;
   if(first.training.excessAnnual<=0)mount.innerHTML+='<p class="rank-warning">训练期第一名也没有跑赢万得全A：这里只是候选中相对靠前，不代表找到了正超额策略。</p>';
   if(first.validation.excessAnnual<=0||first.validation.sells<30)mount.innerHTML+='<p class="rank-warning">第一名在后段检验中'+(first.validation.excessAnnual<=0?'未跑赢万得全A':'')+(first.validation.excessAnnual<=0&&first.validation.sells<30?'，且':'')+(first.validation.sells<30?'已卖出交易不足30笔':'')+'，不能据此认为已经找到稳定有效的参数。</p>';
   mount.innerHTML+='<div class="table-wrap"><table><thead><tr>'+['排名与参数','训练年化收益差','检验年化收益差','检验年化收益','检验最大回撤','检验卖出笔数','股票名单'].map(x=>'<th scope="col">'+x+'</th>').join('')+'</tr></thead><tbody>'+r.top.map((t,j)=>`<tr><td>第 ${t.rank} 名 · ${esc(t.label)}</td><td>${pct(t.training.excessAnnual)}</td><td>${pct(t.validation.excessAnnual)}</td><td>${pct(t.validation.annual)}</td><td>${pct(t.validation.drawdown)}</td><td>${t.validation.sells}</td><td><button data-report="${i}" data-rank="${j}">查看名单与卖出日</button></td></tr>`).join('')+`</tbody></table></div><div class="rank-detail" data-detail="${i}"></div>`;
  });reports.forEach((r,i)=>{if(r.top.length)detail(i,0);});
 }catch(e){mount.textContent='历史排名未展示：'+e.message;mount.setAttribute('role','alert');}})();
})();
