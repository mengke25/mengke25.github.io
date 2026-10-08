'use strict';
(()=>{
 const button=document.querySelector('.nav-item[data-panel="2"]');if(!button||typeof window.selectPanel!=='function')return;
 button.querySelector('.nav-name').textContent='A股红利因子回测';button.querySelector('.nav-meta').textContent='面板 2 · 在线结果版';
 const panel=document.createElement('section');panel.id='factorPanel';panel.className='factor-workspace panel-hidden';
 panel.innerHTML='<iframe id="factorFrame" title="A股红利因子回测在线结果" referrerpolicy="same-origin"></iframe>';
 document.getElementById('reservedPanel').before(panel);
 const original=window.selectPanel;
 window.selectPanel=function(number){original(number);const active=Number(number)===2;panel.classList.toggle('panel-hidden',!active);if(active){document.getElementById('reservedPanel').classList.add('panel-hidden');const frame=document.getElementById('factorFrame');if(!frame.hasAttribute('src'))frame.src='./factor-backtest/index.html';}document.querySelector('.nav-item[data-panel="1"] .nav-meta').textContent=Number(number)===1?'面板 1 · 当前面板':'面板 1 · 红利回购';button.querySelector('.nav-meta').textContent=active?'面板 2 · 当前面板':'面板 2 · 在线结果版';};
})();
