'use strict';
(()=>{
 const button=document.querySelector('.nav-item[data-panel="3"]');
 if(!button||typeof window.selectPanel!=='function'||document.getElementById('hFactorPanel'))return;
 button.querySelector('.nav-name').textContent='港股红利因子回测';
 button.querySelector('.nav-meta').textContent='面板 3 · 在线结果版';
 const panel=document.createElement('section');panel.id='hFactorPanel';panel.className='h-factor-workspace panel-hidden';panel.setAttribute('aria-labelledby',button.id||'panelNav3');
 const frame=document.createElement('iframe');frame.id='hFactorFrame';frame.title='港股红利因子回测在线结果';frame.referrerPolicy='same-origin';panel.append(frame);
 document.getElementById('reservedPanel').before(panel);
 const original=window.selectPanel;
 window.selectPanel=function(number){original(number);const active=Number(number)===3;panel.classList.toggle('panel-hidden',!active);
  if(active){document.getElementById('reservedPanel').classList.add('panel-hidden');if(!frame.hasAttribute('src'))frame.src='./h-factor-backtest/index.html';}
  button.querySelector('.nav-meta').textContent=active?'面板 3 · 当前面板':'面板 3 · 在线结果版';
 };
})();
