'use strict';
window.addEventListener('research-ready', async () => {
  const release = await OfflineData.init(), bar = document.createElement('section');bar.className = 'a-gates';bar.id = 'a-gates';bar.setAttribute('aria-label','6大门槛因子');
  bar.innerHTML = '<fieldset><legend>6大门槛因子</legend><div class="gate-options">'+release.gates.items.map(x=>`<label><input type="checkbox" value="${x.bit}" ${24&x.bit?'checked':''}> ${x.name}</label>`).join('')+'</div></fieldset><div class="gate-actions"><button id="generate-gates" class="primary" disabled>生成回测</button><button id="gates-all">全选</button><button id="gates-none">全不选</button><button id="gates-default">恢复默认两项</button></div><p class="muted">先过门槛，再筛7个红利因子。默认历史非ST＋净利润非负；修改勾选后点“生成回测”。</p><p id="gate-status" role="status" aria-live="polite">正在读取本次结果…</p>';
  document.getElementById('overview').before(bar);
  const status = document.getElementById('gate-status'), run = document.getElementById('generate-gates'), inputs = [...bar.querySelectorAll('input')];
  const draft = () => inputs.reduce((m,x)=>x.checked?m|Number(x.value):m,0);
  const changed = () => {status.textContent = draft()===OfflineData.getGateMask()?'当前结果：'+OfflineData.gateNames():'勾选已修改，尚未应用。当前显示仍为：'+OfflineData.gateNames()+'；请点“生成回测”。';};
  bar.querySelector('fieldset').onchange = changed;
  for (const [id, mask] of [['gates-all',63],['gates-none',0],['gates-default',24]]) document.getElementById(id).onclick=()=>{for(const x of inputs)x.checked=Boolean(mask&Number(x.value));changed();};
  const clear = () => {markStale();for(const id of ['single-result','cross-result','lab-result','matrix-result','coverage-result','search-results','pool-funnel','pool-table','pool-compare-tabs']){const e=document.getElementById(id);if(e){e.querySelectorAll('.js-plotly-plot').forEach(p=>window.Plotly?.purge(p));e.replaceChildren();}}job=null;clearTimeout(pollTimer);document.getElementById('search-status').textContent='门槛已更新，请重新筛选本组门槛的候选。';};
  run.onclick = async () => {
    const mask=draft(),active=document.querySelector('.page.active').id,manual=active==='single'?singleSteps():active==='cross'?crossSteps():labSteps();bar.querySelectorAll('button,input').forEach(e=>e.disabled=true);status.textContent='正在应用门槛并更新结论、股票池与净值…';
    try {
      const report=await OfflineData.gateReport(mask);OfflineData.setGateMask(mask);clear();await AGateHome.refresh(report);
      // Home follows the new winner; other tabs preserve the user's chosen factor combination.
      const useWinner=active==='overview'&&report.top.length,ss=useWinner?report.top[0].steps:manual;sendLab(ss);page(active);
      document.getElementById('pool-quarter').value=release.summary.quarters.at(-1);document.getElementById('compare-quarter').value=release.summary.quarters.at(-2);
      await Promise.all([backtest('lab-result',ss),pool(true)]);
      if(document.querySelector('#lab-result .error')||document.querySelector('#pool-table .error'))throw Error('本次门槛已应用，但部分结果未通过检查，请查看对应提示；未沿用旧结果。');
      if(active==='single'||active==='cross')await backtest(active+'-result',ss);
      status.textContent='已更新：'+OfflineData.gateNames()+'。'+(useWinner?'下方为本组门槛的前三名；净值和股票池已同步第一名，可用下方按钮查看。':'净值和股票池保留当前所选红利因子，结论页排名也已更新。');
    } catch(e) {status.textContent=e.message;}
    finally {bar.querySelectorAll('button,input').forEach(e=>e.disabled=false);}
  };
  window.addEventListener('gate-compute-progress',({detail:x})=>{if(run.disabled)status.textContent=`正在校验所需行情 ${x.progress}/${x.total}，随后计算净值…`;});
  try {const r=await AGateHome.refresh();if(r.top[0]){sendLab(r.top[0].steps);page('overview');}changed();}catch(e){status.textContent='暂未加载结果：'+e.message;}
  run.disabled=false;
});
