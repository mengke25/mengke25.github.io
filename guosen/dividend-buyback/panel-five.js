'use strict';
(() => {
 const button=document.querySelector('.nav-item[data-panel="5"]');
 if(!button||typeof window.selectPanel!=='function'||document.getElementById('incentivePanel'))return;
 button.querySelector('.nav-name').textContent='股权激励公告策略';
 button.querySelector('.nav-meta').textContent='面板 5 · 首次实施公告';
 const panel=document.createElement('section');panel.id='incentivePanel';panel.className='incentive-workspace panel-hidden';panel.setAttribute('aria-labelledby',button.id||'panelNav5');
 const frame=document.createElement('iframe');frame.id='incentiveFrame';frame.title='股权激励首次实施公告策略';frame.referrerPolicy='same-origin';panel.append(frame);
 document.getElementById('reservedPanel').before(panel);
 const original=window.selectPanel;
 window.selectPanel=function(number){original(number);const active=Number(number)===5;panel.classList.toggle('panel-hidden',!active);
  if(active){document.getElementById('reservedPanel').classList.add('panel-hidden');if(!frame.hasAttribute('src'))frame.src='./equity-incentive/index.html';}
  button.querySelector('.nav-meta').textContent=active?'面板 5 · 当前面板':'面板 5 · 首次实施公告';
 };
})();
