let windMailMessages=[],windMailLast=-1,windMailPointer=null;
const mailOverlay=document.getElementById('mailOverlay'),mailPaper=document.getElementById('mailPaper'),mailGreeting=document.getElementById('mailGreeting'),mailBody=document.getElementById('mailBody'),mailClosing=document.getElementById('mailClosing'),mailClose=document.getElementById('mailClose');

fetch('messages.json',{cache:'no-store'})
  .then(r=>{if(!r.ok)throw new Error('messages');return r.json()})
  .then(v=>{if(Array.isArray(v))windMailMessages=v})
  .catch(()=>{});

function pickWindMail(){
  if(!windMailMessages.length)return null;
  let i=Math.floor(Math.random()*windMailMessages.length);
  if(windMailMessages.length>1&&i===windMailLast)i=(i+1+Math.floor(Math.random()*(windMailMessages.length-1)))%windMailMessages.length;
  windMailLast=i;return windMailMessages[i];
}
function openWindMail(){
  const m=pickWindMail()||{greeting:'Dear You,',body:'A little wind passed through. Perhaps that is enough for now.',closing:'Yours sincerely.'};
  mailGreeting.textContent=m.greeting||'Dear You,';
  mailBody.textContent=m.body||'';
  mailClosing.textContent=m.closing||'Yours sincerely.';
  mailOverlay.classList.add('show');mailOverlay.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>mailPaper.classList.add('show'));
}
function closeWindMail(){
  mailPaper.classList.remove('show');
  setTimeout(()=>{mailOverlay.classList.remove('show');mailOverlay.setAttribute('aria-hidden','true')},140);
}
function mailboxAt(clientX,clientY){
  const b=window.mailboxHitbox;if(!b)return false;
  const r=canvas.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;
  return x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
}
canvas.addEventListener('pointerdown',e=>{windMailPointer={x:e.clientX,y:e.clientY}});
canvas.addEventListener('pointerup',e=>{
  if(!windMailPointer)return;
  const moved=Math.hypot(e.clientX-windMailPointer.x,e.clientY-windMailPointer.y);windMailPointer=null;
  if(moved<=10&&mailboxAt(e.clientX,e.clientY))openWindMail();
});
canvas.addEventListener('pointermove',e=>{if(mailboxAt(e.clientX,e.clientY))canvas.style.cursor='pointer';else canvas.style.cursor='default'});
canvas.addEventListener('pointerleave',()=>{windMailPointer=null;canvas.style.cursor='default'});
mailClose.addEventListener('click',closeWindMail);
mailOverlay.addEventListener('click',e=>{if(e.target===mailOverlay)closeWindMail()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mailOverlay.classList.contains('show'))closeWindMail()});
