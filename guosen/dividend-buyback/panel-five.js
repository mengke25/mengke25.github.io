'use strict';
(() => {
 const button=document.querySelector('.nav-item[data-panel="5"]');
 if(!button||typeof window.selectPanel!=='function'||document.getElementById('incentivePanel'))return;
 button.querySelector('.nav-name').textContent='回购与股权激励';
 button.querySelector('.nav-meta').textContent='面板 5 · 用途与公告阶段';
 const panel=document.createElement('section');panel.id='incentivePanel';panel.className='incentive-workspace panel-hidden';panel.setAttribute('aria-labelledby',button.id||'panelNav5');
 const frame=document.createElement('iframe');frame.id='incentiveFrame';frame.title='回购与股权激励研究';frame.referrerPolicy='same-origin';panel.append(frame);
 document.getElementById('reservedPanel').before(panel);
 const original=window.selectPanel;
 window.selectPanel=function(number){original(number);const active=Number(number)===5;panel.classList.toggle('panel-hidden',!active);
  if(active){document.getElementById('reservedPanel').classList.add('panel-hidden');if(!frame.hasAttribute('src'))frame.src='./buyback-incentive/index.html?v=active-20261108-1';}
  button.querySelector('.nav-meta').textContent=active?'面板 5 · 当前面板':'面板 5 · 用途与公告阶段';
 };
})();
