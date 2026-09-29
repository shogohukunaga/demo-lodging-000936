// Original implementation of the measured reference motion, without its source/assets.
const $=s=>document.querySelector(s), body=document.body;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=n=>Math.max(0,Math.min(1,n));
const make=(tag,cls)=>Object.assign(document.createElement(tag),{className:cls});
const menu=$('.site-menu'), menuButton=$('.menu-toggle'), menuLinks=[...menu.querySelectorAll('a')];
menuLinks.forEach((a,i)=>a.style.setProperty('--menu-index',i));
function setMenu(open,returnFocus=false){
  body.classList.toggle('menu-open',open);menu.inert=!open;
  menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');
  $('main').inert=$('footer').inert=$('.side-actions').inert=open;
  if(open)menuLinks[0].focus({preventScroll:true});else if(returnFocus)menuButton.focus({preventScroll:true});
}
menuButton.addEventListener('click',()=>setMenu(!body.classList.contains('menu-open'),true));
menuLinks.forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{
  if(!body.classList.contains('menu-open'))return;
  if(e.key==='Escape')setMenu(false,true);
  if(e.key==='Tab'){const items=[menuButton,...menuLinks],i=items.indexOf(document.activeElement);if(e.shiftKey&&i===0){e.preventDefault();items.at(-1).focus();}else if(!e.shiftKey&&i===items.length-1){e.preventDefault();items[0].focus();}}
});

document.querySelectorAll('.intro__vertical h2,.feature__rail h2').forEach(el=>{
  const text=el.textContent;el.setAttribute('aria-label',text);el.textContent='';el.classList.add('char-reveal');
  [...text].forEach((ch,i)=>{const span=make('span','motion-char');span.textContent=ch;span.setAttribute('aria-hidden','true');span.style.setProperty('--char-index',i);el.append(span);});
});
const copy=$('.intro__vertical p');
copy.replaceChildren(...copy.innerHTML.split(/<br\s*\/?\s*>/i).map((line,i)=>{const span=make('span','copy-line');span.textContent=line;span.style.setProperty('--line-index',i);return span;}));
document.querySelectorAll('.dining__visual').forEach(el=>el.classList.add('image-wash'));
document.querySelectorAll('.wellness__card>img').forEach(img=>{const wrap=make('div','wellness__photo image-wash');img.before(wrap);wrap.append(img);});
const observer=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
  if(!isIntersecting)return;target.classList.add('is-shown');
  if(target.classList.contains('intro__vertical')){target.classList.add('copy-shown');target.querySelector('h2').classList.add('is-shown');}
  observer.unobserve(target);
}),{rootMargin:'0px 0px -8% 0px'});
document.querySelectorAll('.intro__vertical,.feature__rail h2,.image-wash').forEach(el=>observer.observe(el));

const logo=$('.hero__center'),paper=$('.intro__paper'),picture=$('.intro__picture'),stage=$('.content-stage'),shell=$('.content-shell'),roomFrame=$('.stay__frame');
roomFrame.classList.add('image-wash');
let paperProgress=0,shellProgress=0,raf=0,previousTime=0;
function requestScroll(){if(!raf)raf=requestAnimationFrame(updateScroll);}
function updateScroll(time){
  raf=0;const vh=innerHeight,reduced=reduceMotion.matches,dt=previousTime?Math.min(64,time-previousTime):16;previousTime=time;
  const rect=paper.getBoundingClientRect(),top=stage.getBoundingClientRect().top;
  const p=clamp((vh-rect.top)/rect.height),s=clamp((vh-top)/vh),follow=1-Math.exp(-dt/380);
  paperProgress+=(p-paperProgress)*follow;shellProgress+=(s-shellProgress)*follow;
  const l=clamp(scrollY/vh);logo.style.opacity=reduced?'':1-l;logo.style.filter=reduced?'':`blur(${16*l}px)`;
  $('.hero__bottom').style.opacity=reduced?'':1-clamp(l*3);
  logo.style.transform=reduced?'':`translate(-50%,calc(-50% - ${logo.offsetHeight*1.5*l}px))`;logo.style.visibility=!reduced&&l>=1?'hidden':'';
  $('.intro__paper-bg').style.clipPath=reduced?'':`inset(0 ${20*(1-paperProgress)}%)`;
  picture.style.clipPath=reduced?'':`inset(0 ${10*(1-paperProgress)}%)`;
  const pr=picture.getBoundingClientRect(),ip=clamp((vh-pr.top)/(vh+pr.height));
  picture.querySelector('img').style.transform=reduced?'':`translateY(${(ip-.5)*pr.height*.7}px) scale(1.8)`;
  shell.style.clipPath=reduced?'':`inset(${innerWidth*.1*(1-shellProgress)}px ${Math.min(60,innerWidth*.1)*(1-shellProgress)}px 0)`;
  shell.style.transform=reduced?'':`translateY(${200*(1-shellProgress)}px)`;
  roomFrame.classList.toggle('is-shown',reduced||shellProgress>(innerWidth<1024?.3:.4));
  $('.site-head').classList.toggle('is-scrolled',top<vh*.3);$('.arrival__backdrop').style.visibility=top< -vh?'hidden':'visible';
  if(Math.abs(p-paperProgress)>.0005||Math.abs(s-shellProgress)>.0005)requestScroll();
}
addEventListener('scroll',requestScroll,{passive:true});addEventListener('resize',requestScroll);reduceMotion.addEventListener('change',requestScroll);requestScroll();

// Anchor targets use layout coordinates, excluding the entrance transform.
// Otherwise a jump from the footer can land a heading beneath the fixed header.
document.addEventListener('click',e=>{
  const link=e.target.closest('a[href^="#"]');if(!link)return;
  const target=document.getElementById(link.getAttribute('href').slice(1));
  if(!target||!shell.contains(target))return;
  e.preventDefault();let y=0;for(let node=target;node;node=node.offsetParent)y+=node.offsetTop;
  history.replaceState(null,'',link.getAttribute('href'));
  scrollTo({top:y-parseFloat(getComputedStyle(target).scrollMarginTop),behavior:reduceMotion.matches?'instant':'smooth'});
});

const rooms=[
  {src:'assets/room-main.jpg',alt:'畳と木の設えを持つ客室のイメージ写真'},
  {src:'assets/interior-winter.jpg',alt:'雪の庭を望む和室のイメージ写真'},
  {src:'assets/interior-light.jpg',alt:'光と影が美しい和室のイメージ写真'}
];
const roomStage=make('div','room-stage');roomFrame.querySelector('img').remove();roomFrame.prepend(roomStage);
const tabs=[...document.querySelectorAll('.stay__tabs button')];
let roomIndex=0,busy=false,queued=null,roomVisible=false,roomTimer;
function roomPanel(i){const p=make('div','room-panel'),img=new Image();img.src=rooms[i].src;img.alt=rooms[i].alt;img.draggable=false;p.append(img);return p;}
let activePanel=roomPanel(0);roomStage.append(activePanel);
function scheduleRoom(){clearTimeout(roomTimer);if(roomVisible&&!reduceMotion.matches&&!document.hidden)roomTimer=setTimeout(()=>showRoom(roomIndex+1),5000);}
async function showRoom(requested){
  const target=(requested+rooms.length)%rooms.length;if(busy){queued=requested;return;}if(target===roomIndex){scheduleRoom();return;}
  clearTimeout(roomTimer);busy=true;const dir=requested<roomIndex?-1:1,outgoing=activePanel,incoming=roomPanel(target);
  incoming.style.transform=`translateX(${dir*100}%)`;outgoing.setAttribute('aria-hidden','true');roomStage.append(incoming);roomIndex=target;
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===target));tab.tabIndex=i===target?0:-1;});$('#room-current').textContent=String(target+1).padStart(2,'0');
  const opts={duration:reduceMotion.matches?0:1600,easing:'cubic-bezier(.723,.002,.263,1.003)',fill:'forwards'};
  const animations=[outgoing.animate([{transform:'translateX(0)'},{transform:`translateX(${-dir*100}%)`}],opts),incoming.animate([{transform:`translateX(${dir*100}%)`},{transform:'translateX(0)'}],opts),incoming.querySelector('img').animate([{transform:`translateX(${-dir*18}%) scale(1.36)`},{transform:'translateX(0) scale(1)'}],opts)];
  await Promise.all(animations.map(a=>a.finished.catch(()=>{})));outgoing.remove();incoming.style.transform='';animations.forEach(a=>a.cancel());activePanel=incoming;busy=false;
  if(queued!==null){const next=queued;queued=null;showRoom(next);}else scheduleRoom();
}
tabs.forEach((tab,i)=>{tab.tabIndex=i===0?0:-1;tab.addEventListener('click',()=>showRoom(i));tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const t=e.key==='Home'?0:e.key==='End'?rooms.length-1:(i+(e.key==='ArrowRight'?1:-1)+rooms.length)%rooms.length;tabs[t].focus();showRoom(t);});});
$('.carousel-prev').addEventListener('click',()=>showRoom(roomIndex-1));$('.carousel-next').addEventListener('click',()=>showRoom(roomIndex+1));
let touchStart;
roomStage.addEventListener('pointerdown',e=>{if(innerWidth<1024)touchStart={x:e.clientX,y:e.clientY};});
roomStage.addEventListener('pointerup',e=>{if(!touchStart)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))showRoom(roomIndex+(dx<0?1:-1));});
roomStage.addEventListener('pointercancel',()=>{touchStart=null;});
new IntersectionObserver(entries=>{roomVisible=entries[0].isIntersecting;scheduleRoom();},{rootMargin:'0px 0px -20% 0px'}).observe(roomFrame);

const diningFrames=[...document.querySelectorAll('.dining__visual')];
const diningPhotos=[{src:'assets/sushi-chef.jpg',alt:'料理人が寿司を仕立てるイメージ写真'},{src:'assets/sushi-detail.jpg',alt:'寿司の盛り付けのイメージ写真'}];
let diningTimer,diningVisible=false,diningIndex=0;
diningFrames.forEach((frame,i)=>{const img=new Image();img.src=diningPhotos[1-i].src;img.alt='';img.setAttribute('aria-hidden','true');img.style.opacity='0';frame.append(img);});
function scheduleDining(){clearTimeout(diningTimer);if(diningVisible&&!reduceMotion.matches&&!document.hidden)diningTimer=setTimeout(diningSwap,5000);}
function diningSwap(){diningIndex=1-diningIndex;diningFrames.forEach((frame,i)=>{const update=()=>frame.querySelectorAll('img').forEach((img,j)=>{img.style.opacity=String(j===diningIndex?1:0);img.setAttribute('aria-hidden',String(j!==diningIndex));img.alt=j===diningIndex?diningPhotos[(i+j)%2].alt:'';});if(i)setTimeout(update,200);else update();});scheduleDining();}
new IntersectionObserver(entries=>{diningVisible=entries[0].isIntersecting;scheduleDining();},{rootMargin:'0px 0px -20% 0px'}).observe($('#dining'));

const wellness=$('.wellness__cards'),controls=make('div','wellness__controls');
controls.innerHTML='<span aria-live="polite">01 / 02</span><input type="range" min="0" max="1000" value="0" aria-label="くつろぎ写真の位置"><button type="button" aria-label="前のくつろぎ写真">←</button><button type="button" aria-label="次のくつろぎ写真">→</button>';wellness.after(controls);
const wellnessButtons=controls.querySelectorAll('button'),range=controls.querySelector('input');
function syncWellness(){const max=wellness.scrollWidth-wellness.clientWidth,p=max>0?wellness.scrollLeft/max:0;range.value=Math.round(p*1000);wellnessButtons[0].disabled=p<.01;wellnessButtons[1].disabled=p>.99;controls.querySelector('span').textContent=(p>.5?'02':'01')+' / 02';}
wellness.addEventListener('scroll',syncWellness,{passive:true});range.addEventListener('input',()=>{wellness.scrollLeft=(wellness.scrollWidth-wellness.clientWidth)*range.value/1000;});
let wellnessAnimation=0;
function stopWellness(){cancelAnimationFrame(wellnessAnimation);wellnessAnimation=0;wellness.style.scrollSnapType='';}
function slideWellness(to){
  stopWellness();if(reduceMotion.matches){wellness.scrollLeft=to;return;}
  const from=wellness.scrollLeft,start=performance.now();wellness.style.scrollSnapType='none';
  function tick(now){const t=clamp((now-start)/1600),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;wellness.scrollLeft=from+(to-from)*ease;
    if(t<1)wellnessAnimation=requestAnimationFrame(tick);else stopWellness();}
  wellnessAnimation=requestAnimationFrame(tick);
}
wellness.addEventListener('pointerdown',stopWellness);wellness.addEventListener('wheel',stopWellness,{passive:true});range.addEventListener('pointerdown',stopWellness);
wellnessButtons.forEach((button,i)=>button.addEventListener('click',()=>slideWellness(i?(wellness.scrollWidth-wellness.clientWidth):0)));addEventListener('resize',syncWellness);syncWellness();
document.addEventListener('visibilitychange',()=>{scheduleRoom();scheduleDining();});reduceMotion.addEventListener('change',()=>{scheduleRoom();scheduleDining();});

const started=performance.now(),opening=$('.opening'),heroImage=new Image();heroImage.src='assets/hero-fuji.jpg';
Promise.race([heroImage.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,3000))]).then(()=>setTimeout(()=>{body.classList.add('ready');setTimeout(()=>opening.remove(),1100);requestScroll();},reduceMotion.matches||location.hash?0:Math.max(0,1100-(performance.now()-started))));
