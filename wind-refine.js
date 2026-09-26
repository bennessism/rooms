// Visual refinement layer: tighter house grounding + visible calm-wind motion.

function cloudPos(c,w,h,t){
  const d=downwindVector(),speed=Math.max(7,wind*.24),dx=t*speed*.0032*d.x,band=Math.max(85,h*.15);
  return{
    x:((c.x+dx)%(w+360)+w+360)%(w+360)-180,
    y:36+((c.y-36+Math.sin(t*.00028+c.p)*6)%band+band)%band
  }
}

function houseLayout(w,h){
  const ground=h*.835;
  const ratio=houseImg.naturalWidth&&houseImg.naturalHeight?houseImg.naturalWidth/houseImg.naturalHeight:1.33;
  const width=Math.min(w*.53,h*1.48);
  const visibleRatio=.78;
  const height=width/ratio*visibleRatio;
  const x=Math.max(2,w*.018);
  const y=ground-height;
  return{x,y,width,height,ground,visibleRatio}
}

function drawHouseAsset(w,h,t){
  if(!houseImg.complete||!houseImg.naturalWidth)return;
  const L=houseLayout(w,h);
  const sourceH=Math.floor(houseImg.naturalHeight*L.visibleRatio);

  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.16)';
  ctx.beginPath();
  ctx.ellipse(L.x+L.width*.50,L.ground+2,L.width*.39,11,0,0,Math.PI*2);
  ctx.fill();
  ctx.drawImage(
    houseImg,
    0,0,houseImg.naturalWidth,sourceH,
    L.x,L.y,L.width,L.height
  );
  ctx.restore();

  const s=Math.max(.78,Math.min(1.2,L.width/720));
  drawMailbox(L.x+L.width+66*s,L.ground+18*s,s,t)
}

function drawMailbox(x,y,scale,t){
  const d=downwindVector(),idle=Math.sin(t*.0028)*.035,flagWiggle=idle+d.x*Math.min(.10,.018+wind*.002);
  ctx.save();
  ctx.strokeStyle=isDay?'#5c4530':'#342a21';ctx.lineWidth=7*scale;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x,y+24*scale);ctx.lineTo(x,y-78*scale);ctx.stroke();
  ctx.fillStyle=isDay?'#9e4e42':'#64382f';ctx.fillRect(x-18*scale,y-106*scale,38*scale,24*scale);
  ctx.beginPath();ctx.arc(x-18*scale,y-94*scale,12*scale,-Math.PI/2,Math.PI/2,true);ctx.fill();
  ctx.fillStyle=isDay?'#cbbaa8':'#8c7a68';ctx.save();ctx.translate(x+12*scale,y-104*scale);ctx.rotate(flagWiggle);
  ctx.fillRect(0,-2*scale,3*scale,20*scale);ctx.fillRect(3*scale,-1*scale,13*scale,4*scale);ctx.restore();
  ctx.fillStyle=isDay?'#47653b':'#263828';ctx.beginPath();ctx.ellipse(x,y+24*scale,22*scale,9*scale,0,0,Math.PI*2);ctx.fill();
  ctx.restore()
}

function drawTree(w,h,t){
  const ground=h*.79,x=w*.76,scale=Math.max(.78,Math.min(1.32,w/1100)),d=downwindVector();
  const windLean=d.x*Math.min(12,Math.max(2.5,wind*.30));
  const idle=Math.sin(t*.00115)*4.2+Math.sin(t*.00047+1.2)*1.6;
  const sway=windLean+idle;
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
  const d=downwindVector(),target=Math.min(26,Math.max(6,Math.floor(wind*.60)+4));
  if(leafParticles.length<target&&Math.random()<.30){
    leafParticles.push({x:treeX+(Math.random()-.5)*150*scale,y:treeY+(Math.random()-.5)*80*scale,v:.5+Math.random(),rot:Math.random()*6.28,life:0,sz:(3+Math.random()*4)*scale})
  }
  for(const p of leafParticles){
    p.x+=d.x*(.75+Math.max(2,wind)*.04)*p.v+Math.sin(t*.002+p.rot)*.08;
    p.y+=d.y*(.28+Math.max(2,wind)*.015)*p.v+(.18+.16*p.v);
    p.rot+=.05*p.v;p.life++;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=isDay?'#6f9148':'#405234';ctx.beginPath();ctx.ellipse(0,0,p.sz,p.sz*.45,0,0,Math.PI*2);ctx.fill();ctx.restore()
  }
  leafParticles=leafParticles.filter(p=>p.x>-80&&p.x<w+80&&p.y>-80&&p.y<h+80&&p.life<900)
}

function drawNightParticles(w,h,t){
  if(isDay)return;
  const strength=Math.max(2,wind),d=downwindVector(),target=Math.min(34,14+Math.floor(strength*.7));
  if(particles.length<target&&Math.random()<.24){
    particles.push({x:Math.random()*w,y:h*.28+Math.random()*h*.54,v:.45+Math.random()*1.2,a:Math.random()*6.28,fire:Math.random()>.28,sz:3+Math.random()*4})
  }
  particles=particles.filter(p=>p.x>-90&&p.x<w+90&&p.y>-90&&p.y<h+90);
  for(const p of particles){
    p.x+=d.x*strength*.022*p.v+Math.sin(t*.0018+p.a)*.16;
    p.y+=d.y*strength*.010*p.v+Math.sin(t*.0024+p.a)*.08;
    p.a+=.035*p.v;
    if(p.fire){
      ctx.fillStyle='#eaff91';ctx.globalAlpha=.42+.48*Math.sin(t*.0045+p.a);
      ctx.beginPath();ctx.arc(p.x,p.y,1.6+Math.sin(p.a)*.35,0,Math.PI*2);ctx.fill()
    }else{
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(d.y,d.x)+p.a*.12);ctx.fillStyle='#8a6a42bb';ctx.globalAlpha=.62;ctx.beginPath();ctx.ellipse(0,0,p.sz,2,0,Math.PI*2);ctx.fill();ctx.restore()
    }
  }
  ctx.globalAlpha=1
}
