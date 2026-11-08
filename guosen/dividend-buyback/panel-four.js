'use strict';
(() => {
 const button=document.querySelector('.nav-item[data-panel="4"]');
 if(!button||typeof window.selectPanel!=='function'||document.getElementById('increasePanel'))return;
 button.querySelector('.nav-name').textContent='股东增持被套策略';
 button.querySelector('.nav-meta').textContent='面板 4 · 在线结果版';
 const panel=document.createElement('section');panel.id='increasePanel';panel.className='increase-workspace panel-hidden';panel.setAttribute('aria-labelledby',button.id||'panelNav4');
 const frame=document.createElement('iframe');frame.id='increaseFrame';frame.title='股东增持被套策略';frame.referrerPolicy='same-origin';panel.append(frame);
 document.getElementById('reservedPanel').before(panel);
 const original=window.selectPanel;
 window.selectPanel=function(number){original(number);const active=Number(number)===4;panel.classList.toggle('panel-hidden',!active);
  if(active){document.getElementById('reservedPanel').classList.add('panel-hidden');if(!frame.hasAttribute('src'))frame.src='./shareholder-increase/index.html?v=nav-20261108-1';}
  button.querySelector('.nav-meta').textContent=active?'面板 4 · 当前面板':'面板 4 · 在线结果版';
 };
})();
