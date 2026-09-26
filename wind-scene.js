const canvas=document.getElementById('scene'),ctx=canvas.getContext('2d'),stage=document.getElementById('stage'),scroller=document.getElementById('scroller');
const summaryBtn=document.getElementById('summaryBtn'),summaryLine=document.getElementById('summaryLine'),detailCard=document.getElementById('detailCard'),detailLoc=document.getElementById('detailLoc'),conditionEl=document.getElementById('condition'),speedEl=document.getElementById('speed'),gustEl=document.getElementById('gust'),fromText=document.getElementById('fromText'),directionEl=document.getElementById('direction'),updatedEl=document.getElementById('updated');
const picker=document.getElementById('picker'),countrySelect=document.getElementById('countrySelect'),locationSelect=document.getElementById('locationSelect');
let wind=12,gust=18,windDir=250,isDay=true,particles=[],leafParticles=[],stars=[],kites=[],clouds=[],catalog=null,currentLat=3.0738,currentLon=101.5183,currentPlace='Selangor · Shah Alam',currentArea='Selangor';
const houseImg=new Image();houseImg.src='ben-house.png';
const houseLights={
  upperLeft:false,dormerLeft:false,dormerRight:false,
  leftA:false,leftB:false,leftC:false,
  centerA:false,centerB:false,rightA:false,porch:false
};
let lightHitboxes=[],pointerStart=null;
const DPR=()=>Math.min(devicePixelRatio||1,2);

function resize(){
  const r=stage.getBoundingClientRect(),d=DPR();
  canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);
  canvas.style.width=r.width+'px';canvas.style.height=r.height+'px';
  ctx.setTransform(d,0,0,d,0,0);seedScene(r.width,r.height)
}
function seedScene(w,h){
  stars=Array.from({length:95},()=>({x:Math.random()*w,y:Math.random()*h*.46,r:.35+Math.random()*1.15,a:.28+Math.random()*.72}));
  clouds=Array.from({length:7},(_,i)=>({x:(i/7)*w+Math.random()*230,y:36+Math.random()*Math.max(85,h*.15),s:.62+Math.random()*1.2,p:Math.random()*6.28}));
  kites=[{x:.57,y:.30,c:'#ff5b67',p:0},{x:.72,y:.23,c:'#ffd54a',p:2.1},{x:.85,y:.34,c:'#4ad1c8',p:4.2}];
  particles=[];leafParticles=[]
}
function compassName(deg){const n=['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];return n[Math.round((deg%360)/22.5)%16]}
function windStrength(v){if(v<5)return'Calm';if(v<20)return'Light breeze';if(v<39)return'Moderate breeze';if(v<62)return'Strong breeze';if(v<89)return'Gale';return'Storm-force wind'}
function downwindVector(){const a=(windDir+180)*Math.PI/180;return{x:Math.sin(a),y:-Math.cos(a)}}
function drawSky(w,h){
  const c=isDay?['#6fb4e8','#d9efff','#f3d6a4']:['#06101d','#132640','#263a53'],g=ctx.createLinearGradient(0,0,0,h*.72);
  g.addColorStop(0,c[0]);g.addColorStop(.66,c[1]);g.addColorStop(1,c[2]);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  if(!isDay){
    ctx.fillStyle='#fff';for(const s of stars){ctx.globalAlpha=s.a;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill()}
    ctx.globalAlpha=1;ctx.fillStyle='#f5efcf';ctx.beginPath();ctx.arc(w*.82,h*.145,27,0,Math.PI*2);ctx.fill()
  }else{
    ctx.fillStyle='#fff8c6';ctx.globalAlpha=.82;ctx.beginPath();ctx.arc(w*.84,h*.13,34,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1
  }
}
function cloudPos(c,w,h,t){
  const d=downwindVector(),speed=Math.max(3.2,wind*.16),dx=t*speed*.003*d.x,band=Math.max(85,h*.15);
  return{x:((c.x+dx)%(w+360)+w+360)%(w+360)-180,y:36+((c.y-36+Math.sin(t*.00018+c.p)*5)%band+band)%band}
}
function fillCloudEllipse(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function drawClouds(w,h,t){
  ctx.fillStyle=isDay?'#ffffff':'#aebdcc';
  for(const c of clouds){
    const p=cloudPos(c,w,h,t),x=p.x,y=p.y,s=c.s;
    fillCloudEllipse(x,y,74*s,24*s);fillCloudEllipse(x-47*s,y-6*s,42*s,24*s);
    fillCloudEllipse(x-10*s,y-18*s,38*s,28*s);fillCloudEllipse(x+30*s,y-14*s,44*s,30*s);fillCloudEllipse(x+58*s,y-3*s,33*s,22*s)
  }
}
function drawField(w,h){
  const horizon=h*.60,g=ctx.createLinearGradient(0,horizon,0,h);
  g.addColorStop(0,isDay?'#6f9f52':'#27422d');g.addColorStop(.58,isDay?'#517940':'#1b3022');g.addColorStop(1,isDay?'#335636':'#0e1b15');
  ctx.fillStyle=g;ctx.fillRect(0,horizon,w,h-horizon);
  ctx.fillStyle=isDay?'#5f8b48':'#213827';ctx.beginPath();ctx.moveTo(0,horizon+14);
  for(let x=0;x<=w;x+=80)ctx.lineTo(x,horizon-8-Math.sin(x*.008)*12-Math.sin(x*.021)*4);
  ctx.lineTo(w,horizon+26);ctx.lineTo(0,horizon+26);ctx.fill()
}

function houseLayout(w,h){
  const ground=h*.805;
  const width=Math.min(w*.43,h*1.12);
  const ratio=houseImg.naturalWidth&&houseImg.naturalHeight?houseImg.naturalWidth/houseImg.naturalHeight:1.7777778;
  const height=width/ratio;
  const x=Math.max(8,w*.035);
  const y=ground-height;
  return{x,y,width,height,ground}
}
function drawFenceSegment(x1,y1,x2,y2,s,front=false){
  const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len,posts=Math.max(2,Math.round(len/(50*s)));
  ctx.save();ctx.lineCap='round';ctx.strokeStyle=isDay?'#9a744c':'#51402f';
  ctx.lineWidth=front?6*s:5*s;
  for(let i=0;i<=posts;i++){
    const q=i/posts,x=x1+dx*q,y=y1+dy*q;
    ctx.beginPath();ctx.moveTo(x,y-27*s);ctx.lineTo(x,y+16*s);ctx.stroke()
  }
  for(const off of[-13*s,7*s]){
    ctx.beginPath();ctx.moveTo(x1+nx*off,y1+ny*off);ctx.lineTo(x2+nx*off,y2+ny*off);ctx.stroke()
  }
  ctx.restore()
}
function drawPropertyFenceBack(L){
  const s=Math.max(.72,Math.min(1.15,L.width/720)),pad=28*s;
  const left=L.x-pad,right=L.x+L.width+pad,frontY=L.ground+28*s,backY=L.ground-44*s;
  drawFenceSegment(left,frontY,left+24*s,backY,s);
  drawFenceSegment(left+24*s,backY,right-24*s,backY,s);
  drawFenceSegment(right-24*s,backY,right,frontY,s)
}
function drawPropertyFenceFront(L){
  const s=Math.max(.72,Math.min(1.15,L.width/720)),pad=28*s;
  const left=L.x-pad,right=L.x+L.width+pad,y=L.ground+28*s;
  const gateCenter=L.x+L.width*.67,gateHalf=42*s;
  drawFenceSegment(left,y,gateCenter-gateHalf,y,s,true);
  drawFenceSegment(gateCenter+gateHalf,y,right,y,s,true);
  drawFrontCornerBush(left+9*s,y+11*s,s);
  drawFrontCornerBush(right-9*s,y+11*s,s)
}
function drawFrontCornerBush(x,y,s){
  ctx.save();
  const base=isDay?'#3f783d':'#29462f',hi=isDay?'#609653':'#355b3c';
  ctx.fillStyle=base;
  for(const [ox,oy,rx,ry] of [[-15,0,24,16],[8,-5,28,19],[26,3,22,15]]){
    ctx.beginPath();ctx.ellipse(x+ox*s,y+oy*s,rx*s,ry*s,0,0,Math.PI*2);ctx.fill()
  }
  ctx.fillStyle=hi;
  for(const [ox,oy,r] of [[-20,-7,5],[-2,-13,6],[17,-10,5],[29,-2,4]]){ctx.beginPath();ctx.arc(x+ox*s,y+oy*s,r*s,0,Math.PI*2);ctx.fill()}
  ctx.restore()
}
function addHit(id,L,nx,ny,nw,nh){
  lightHitboxes.push({id,x:L.x+nx*L.width,y:L.y+ny*L.height,w:nw*L.width,h:nh*L.height})
}
function drawWindowGlow(box,on){
  if(!on)return;
  ctx.save();
  const alpha=isDay?.38:.72;
  ctx.fillStyle=`rgba(255,198,92,${alpha})`;
  ctx.shadowColor='rgba(255,194,82,.8)';ctx.shadowBlur=isDay?8:18;
  ctx.fillRect(box.x,box.y,box.w,box.h);
  ctx.restore()
}
function drawLampGlow(box,on){
  if(!on)return;
  const cx=box.x+box.w/2,cy=box.y+box.h/2,r=Math.max(box.w,box.h)*(isDay?1.8:3.2);
  ctx.save();
  const g=ctx.createRadialGradient(cx,cy,1,cx,cy,r);
  g.addColorStop(0,isDay?'rgba(255,211,120,.75)':'rgba(255,205,92,.95)');
  g.addColorStop(1,'rgba(255,196,70,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,221,142,.95)';ctx.beginPath();ctx.arc(cx,cy,Math.max(2,box.w*.18),0,Math.PI*2);ctx.fill();
  ctx.restore()
}
function drawHouseAsset(w,h,t){
  if(!houseImg.complete||!houseImg.naturalWidth)return;
  const L=houseLayout(w,h);
  drawPropertyFenceBack(L);
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.13)';ctx.beginPath();ctx.ellipse(L.x+L.width*.5,L.ground+12,L.width*.46,18,0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(houseImg,L.x,L.y,L.width,L.height);
  ctx.restore();

  lightHitboxes=[];
  addHit('upperLeft',L,.272,.225,.038,.135);
  addHit('dormerLeft',L,.548,.350,.028,.090);
  addHit('dormerRight',L,.585,.350,.028,.090);
  addHit('leftA',L,.202,.565,.040,.140);
  addHit('leftB',L,.267,.565,.040,.140);
  addHit('leftC',L,.330,.565,.040,.140);
  addHit('centerA',L,.544,.555,.042,.150);
  addHit('centerB',L,.600,.555,.042,.150);
  addHit('rightA',L,.862,.590,.040,.135);
  addHit('porch',L,.718,.490,.030,.050);

  for(const b of lightHitboxes){
    if(b.id==='porch')drawLampGlow(b,houseLights[b.id]);
    else drawWindowGlow(b,houseLights[b.id])
  }
  drawPropertyFenceFront(L);

  const s=Math.max(.72,Math.min(1.1,L.width/720));
  drawMailbox(L.x+L.width+82*s,L.ground+34*s,s,t)
}
function drawMailbox(x,y,scale,t){
  const d=downwindVector(),flagWiggle=Math.sin(t*.0025)*.12+d.x*Math.min(.06,wind*.0015);
  ctx.save();
  ctx.strokeStyle=isDay?'#5c4530':'#342a21';ctx.lineWidth=7*scale;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x,y+22*scale);ctx.lineTo(x,y-76*scale);ctx.stroke();
  ctx.fillStyle=isDay?'#9e4e42':'#64382f';ctx.fillRect(x-18*scale,y-104*scale,38*scale,24*scale);
  ctx.beginPath();ctx.arc(x-18*scale,y-92*scale,12*scale,-Math.PI/2,Math.PI/2,true);ctx.fill();
  ctx.fillStyle=isDay?'#cbbaa8':'#8c7a68';ctx.save();ctx.translate(x+12*scale,y-102*scale);ctx.rotate(flagWiggle);
  ctx.fillRect(0,-2*scale,3*scale,20*scale);ctx.fillRect(3*scale,-1*scale,13*scale,4*scale);ctx.restore();
  ctx.fillStyle=isDay?'#47653b':'#263828';ctx.beginPath();ctx.ellipse(x,y+22*scale,20*scale,8*scale,0,0,Math.PI*2);ctx.fill();
  ctx.restore()
}
function drawTree(w,h,t){
  const ground=h*.79,x=w*.76,scale=Math.max(.78,Math.min(1.32,w/1100)),d=downwindVector(),sway=d.x*Math.min(12,wind*.28)+Math.sin(t*.0008)*2;
  ctx.save();ctx.translate(x,ground);ctx.fillStyle=isDay?'#5a3f2b':'#2b241d';
  ctx.beginPath();ctx.moveTo(-25*scale,5);ctx.bezierCurveTo(-19*scale,-70*scale,-18*scale,-135*scale,sway*scale,-210*scale);
  ctx.bezierCurveTo(18*scale,-140*scale,24*scale,-62*scale,31*scale,5);ctx.closePath();ctx.fill();
  ctx.strokeStyle=isDay?'#65462f':'#31271f';ctx.lineCap='round';ctx.lineWidth=13*scale;
  for(const b of[[0,-155,-70,-215],[4,-145,76,-198],[-3,-178,-40,-245],[8,-170,55,-240]]){
    ctx.beginPath();ctx.moveTo((b[0]+sway*.3)*scale,b[1]*scale);ctx.lineTo((b[2]+sway)*scale,b[3]*scale);ctx.stroke()
  }
  const canopyY=-238*scale,lean=sway*1.7*scale;ctx.fillStyle=isDay?'#477f3e':'#25462e';
  for(const c of[[-68,-2,76,54],[-8,-34,92,67],[72,-6,72,55],[-26,30,90,58]]){ctx.beginPath();ctx.ellipse(c[0]*scale+lean,canopyY+c[1]*scale,c[2]*scale,c[3]*scale,0,0,Math.PI*2);ctx.fill()}
  ctx.fillStyle=isDay?'#5f9851':'#31583a';
  for(const c of[[-88,-20,43,31],[-20,-66,50,36],[54,-48,48,34],[92,-10,39,30],[-4,12,52,34]]){ctx.beginPath();ctx.ellipse(c[0]*scale+lean*.8,canopyY+c[1]*scale,c[2]*scale,c[3]*scale,0,0,Math.PI*2);ctx.fill()}
  ctx.restore();drawTreeLeaves(w,h,t,x,ground-238*scale,scale)
}
function drawTreeLeaves(w,h,t,treeX,treeY,scale){
  const d=downwindVector(),target=Math.min(24,Math.max(3,Math.floor(wind*.55)));
  if(leafParticles.length<target&&Math.random()<.22)leafParticles.push({x:treeX+(Math.random()-.5)*150*scale,y:treeY+(Math.random()-.5)*80*scale,v:.5+Math.random(),rot:Math.random()*6.28,life:0,sz:(3+Math.random()*4)*scale});
  for(const p of leafParticles){
    p.x+=d.x*(.7+wind*.035)*p.v;p.y+=d.y*(.25+wind*.012)*p.v+(.18+.18*p.v);p.rot+=.05*p.v;p.life++;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=isDay?'#6f9148':'#405234';ctx.beginPath();ctx.ellipse(0,0,p.sz,p.sz*.45,0,0,Math.PI*2);ctx.fill();ctx.restore()
  }
  leafParticles=leafParticles.filter(p=>p.x>-80&&p.x<w+80&&p.y>-80&&p.y<h+80&&p.life<900)
}
function kiteCount(){if(!isDay||wind<4||wind>45)return 0;if(wind<9)return 1;if(wind<23)return 2;return 3}
function drawKites(w,h,t){
  const count=kiteCount(),d=downwindVector(),gustBoost=Math.min(1,Math.max(0,gust-wind)/18);
  for(let i=0;i<count;i++){
    const k=kites[i],anchorX=w*(k.x-.06),anchorY=h*.80,baseX=w*k.x,baseY=h*k.y-(wind*1.05),bob=Math.sin(t*.0018+k.p)*(7+wind*.17),swayX=d.x*(18+wind*1.3)+Math.sin(t*.0012+k.p)*7*(1+gustBoost),swayY=d.y*(6+wind*.28),x=baseX+swayX,y=baseY+bob+swayY;
    ctx.strokeStyle='#ffffff80';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(anchorX,anchorY);ctx.quadraticCurveTo((anchorX+x)*.5-d.x*18,anchorY-90-(wind*1.4),x,y+14);ctx.stroke();
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(d.y,d.x)+Math.PI/2+Math.sin(t*.0018+k.p)*.05);ctx.fillStyle=k.c;ctx.beginPath();ctx.moveTo(0,-18);ctx.bezierCurveTo(13,-13,16,-4,15,0);ctx.bezierCurveTo(13,8,7,14,0,20);ctx.bezierCurveTo(-7,14,-13,8,-15,0);ctx.bezierCurveTo(-16,-4,-13,-13,0,-18);ctx.closePath();ctx.fill();ctx.strokeStyle='#ffffff88';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(0,18);ctx.stroke();ctx.restore();
    ctx.strokeStyle=k.c;ctx.lineWidth=1.4;ctx.beginPath();
    for(let j=0;j<8;j++){const q=j/7,tx=x+d.x*(12+q*58)+Math.sin(t*.003+j+k.p)*4,ty=y+20+d.y*(12+q*58)+q*34;if(j===0)ctx.moveTo(tx,ty);else ctx.lineTo(tx,ty)}
    ctx.stroke()
  }
}
function drawNightParticles(w,h,t){
  if(isDay)return;const strength=Math.max(1,wind),d=downwindVector();
  if(particles.length<Math.min(40,8+strength))particles.push({x:Math.random()*w,y:h*.25+Math.random()*h*.62,v:.45+Math.random()*1.3,a:Math.random()*6.28,fire:wind<6&&Math.random()>.45,sz:3+Math.random()*4});
  particles=particles.filter(p=>p.x>-90&&p.x<w+90&&p.y>-90&&p.y<h+90);
  for(const p of particles){
    p.x+=d.x*strength*.028*p.v;p.y+=d.y*strength*.013*p.v;p.a+=.04*p.v;
    if(p.fire){ctx.fillStyle='#eaff91';ctx.globalAlpha=.5+.4*Math.sin(t*.004+p.a);ctx.beginPath();ctx.arc(p.x,p.y,1.8,0,Math.PI*2);ctx.fill()}
    else{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(d.y,d.x)+p.a*.12);ctx.fillStyle='#8a6a42bb';ctx.globalAlpha=.72;ctx.beginPath();ctx.ellipse(0,0,p.sz,2,0,0,Math.PI*2);ctx.fill();ctx.restore()}
  }
  ctx.globalAlpha=1
}
function hitLightAt(clientX,clientY){
  const r=canvas.getBoundingClientRect(),x=clientX-r.left,y=clientY-r.top;
  for(let i=lightHitboxes.length-1;i>=0;i--){const b=lightHitboxes[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return b}
  return null
}
canvas.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY}});
canvas.addEventListener('pointerup',e=>{
  if(!pointerStart)return;
  const moved=Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y);pointerStart=null;
  if(moved>8)return;
  const b=hitLightAt(e.clientX,e.clientY);
  if(b)houseLights[b.id]=!houseLights[b.id]
});
canvas.addEventListener('pointermove',e=>{canvas.style.cursor=hitLightAt(e.clientX,e.clientY)?'pointer':'default'});
canvas.addEventListener('pointerleave',()=>{canvas.style.cursor='default';pointerStart=null});

function draw(t){
  const r=stage.getBoundingClientRect(),w=r.width,h=r.height;ctx.clearRect(0,0,w,h);
  drawSky(w,h);drawClouds(w,h,t);drawField(w,h);drawHouseAsset(w,h,t);drawTree(w,h,t);drawKites(w,h,t);drawNightParticles(w,h,t);
  requestAnimationFrame(draw)
}
