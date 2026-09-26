// Small visual polish layer: star twinkle/edge padding, orange sun, connected kite tails,
// mailbox label/hitbox, and corrected night-particle ellipse.

function seedScene(w,h){
  const pad=10;
  stars=Array.from({length:95},()=>({
    x:pad+Math.random()*Math.max(1,w-pad*2),
    y:pad+Math.random()*Math.max(1,h*.46-pad*2),
    r:.35+Math.random()*1.15,
    a:.30+Math.random()*.62,
    p:Math.random()*Math.PI*2,
    tw:.0008+Math.random()*.0014
  }));
  clouds=Array.from({length:7},(_,i)=>({x:(i/7)*w+Math.random()*230,y:36+Math.random()*Math.max(85,h*.15),s:.62+Math.random()*1.2,p:Math.random()*6.28}));
  kites=[
    {x:.56,y:.27,c1:'#ef4d5b',c2:'#ff9b68',p:0},
    {x:.71,y:.20,c1:'#f2c84b',c2:'#f58d3d',p:2.1},
    {x:.84,y:.29,c1:'#36bfc1',c2:'#4b86dd',p:4.2}
  ];
  particles=[];leafParticles=[];
}

function drawSky(w,h){
  const now=performance.now();
  const c=isDay?['#6fb4e8','#d9efff','#f3d6a4']:['#06101d','#132640','#263a53'],g=ctx.createLinearGradient(0,0,0,h*.72);
  g.addColorStop(0,c[0]);g.addColorStop(.66,c[1]);g.addColorStop(1,c[2]);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  if(!isDay){
    ctx.fillStyle='#fff';
    for(const s of stars){
      const twinkle=.78+.22*Math.sin(now*s.tw+s.p);
      ctx.globalAlpha=Math.max(.12,s.a*twinkle);
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    ctx.fillStyle='#f5efcf';ctx.beginPath();ctx.arc(w*.82,h*.145,27,0,Math.PI*2);ctx.fill();
  }else{
    const sg=ctx.createRadialGradient(w*.84,h*.13,4,w*.84,h*.13,38);
    sg.addColorStop(0,'#ffd36a');sg.addColorStop(.72,'#f5a33b');sg.addColorStop(1,'rgba(242,139,44,.15)');
    ctx.fillStyle=sg;ctx.globalAlpha=.95;ctx.beginPath();ctx.arc(w*.84,h*.13,38,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
}

function drawMailbox(x,y,scale,t){
  const d=downwindVector(),idle=Math.sin(t*.0032)*.055,flagWiggle=idle+d.x*Math.min(.12,.025+wind*.0025);
  window.mailboxHitbox={x:x-30*scale,y:y-118*scale,w:62*scale,h:150*scale};
  ctx.save();
  ctx.strokeStyle=isDay?'#5c4530':'#342a21';ctx.lineWidth=7*scale;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x,y+24*scale);ctx.lineTo(x,y-78*scale);ctx.stroke();
  ctx.fillStyle=isDay?'#9e4e42':'#64382f';ctx.fillRect(x-18*scale,y-106*scale,38*scale,24*scale);
  ctx.beginPath();ctx.arc(x-18*scale,y-94*scale,12*scale,-Math.PI/2,Math.PI/2,true);ctx.fill();

  ctx.save();
  ctx.fillStyle='rgba(255,248,232,.95)';
  ctx.font=`700 ${Math.max(7,9*scale)}px system-ui,-apple-system,"Segoe UI",sans-serif`;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('Mail',x+2*scale,y-94*scale);
  ctx.restore();

  ctx.fillStyle=isDay?'#cbbaa8':'#8c7a68';ctx.save();ctx.translate(x+12*scale,y-104*scale);ctx.rotate(flagWiggle);
  ctx.fillRect(0,-2*scale,3*scale,20*scale);ctx.fillRect(3*scale,-1*scale,13*scale,4*scale);ctx.restore();
  ctx.fillStyle=isDay?'#47653b':'#263828';ctx.beginPath();ctx.ellipse(x,y+24*scale,22*scale,9*scale,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawKites(w,h,t){
  const count=kiteCount(),d=downwindVector(),gustBoost=Math.min(1,Math.max(0,gust-wind)/18),heading=Math.atan2(d.y,d.x)+Math.PI/2;
  for(let i=0;i<count;i++){
    const k=kites[i],anchorX=w*(k.x-.07),anchorY=h*.84,baseX=w*k.x,baseY=h*k.y-wind*.78,
      bob=Math.sin(t*.0017+k.p)*(6+wind*.12),swayX=d.x*(16+wind*.95)+Math.sin(t*.0011+k.p)*6*(1+gustBoost),swayY=d.y*(5+wind*.22),x=baseX+swayX,y=baseY+bob+swayY,size=23+Math.min(7,wind*.16),rot=heading+Math.sin(t*.0019+k.p)*.055;

    ctx.strokeStyle=isDay?'rgba(255,255,255,.72)':'rgba(220,225,235,.4)';ctx.lineWidth=1.15;
    ctx.beginPath();ctx.moveTo(anchorX,anchorY);ctx.quadraticCurveTo((anchorX+x)*.52-d.x*24,anchorY-95-wind*1.1,x,y+size*.72);ctx.stroke();

    // Tail first so its top section sits behind the diamond and cannot look detached.
    const bx=Math.sin(rot)*(-size*1.00),by=Math.cos(rot)*(size*1.00);
    const tailStartX=x+bx,tailStartY=y+by,tailLen=92+Math.min(40,wind*1.2);
    ctx.strokeStyle=k.c1;ctx.lineWidth=1.8;ctx.beginPath();const pts=[];
    for(let j=0;j<12;j++){
      const q=j/11,side=Math.sin(t*.003+j*.85+k.p)*(5+q*3),tx=tailStartX+d.x*tailLen*q-d.y*side,ty=tailStartY+d.y*tailLen*q+q*36+d.x*side;
      pts.push([tx,ty]);if(j===0)ctx.moveTo(tx,ty);else ctx.lineTo(tx,ty);
    }
    ctx.stroke();
    const tailAngle=Math.atan2(d.y*tailLen+36,d.x*tailLen);
    for(const j of[3,6,9]){const p=pts[j];drawKiteBow(p[0],p[1],tailAngle,5.5,k.c2)}

    ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.shadowColor='rgba(0,0,0,.18)';ctx.shadowBlur=4;ctx.strokeStyle='rgba(55,48,43,.72)';ctx.lineWidth=1.4;
    ctx.fillStyle=k.c1;ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.78,0);ctx.lineTo(0,size*1.02);ctx.lineTo(-size*.78,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=k.c2;ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.78,0);ctx.lineTo(0,0);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,size*1.02);ctx.lineTo(-size*.78,0);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.58)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-size*.92);ctx.lineTo(0,size*.94);ctx.moveTo(-size*.68,0);ctx.lineTo(size*.68,0);ctx.stroke();ctx.restore();
  }
}

function drawNightParticles(w,h,t){
  if(isDay)return;
  const strength=Math.max(3,wind),d=downwindVector(),target=Math.min(40,18+Math.floor(strength*.8));
  if(particles.length<target&&Math.random()<.38)particles.push({x:Math.random()*w,y:h*.28+Math.random()*h*.54,v:.45+Math.random()*1.2,a:Math.random()*6.28,fire:Math.random()>.18,sz:3+Math.random()*4});
  particles=particles.filter(p=>p.x>-90&&p.x<w+90&&p.y>-90&&p.y<h+90);
  for(const p of particles){
    p.x+=d.x*strength*.024*p.v+Math.sin(t*.002+p.a)*.22;
    p.y+=d.y*strength*.011*p.v+Math.sin(t*.0026+p.a)*.12;
    p.a+=.04*p.v;
    if(p.fire){ctx.fillStyle='#eaff91';ctx.globalAlpha=.48+.42*Math.sin(t*.005+p.a);ctx.beginPath();ctx.arc(p.x,p.y,1.7+Math.sin(p.a)*.35,0,Math.PI*2);ctx.fill()}
    else{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(d.y,d.x)+p.a*.12);ctx.fillStyle='#8a6a42bb';ctx.globalAlpha=.62;ctx.beginPath();ctx.ellipse(0,0,p.sz,2,0,0,Math.PI*2);ctx.fill();ctx.restore()}
  }
  ctx.globalAlpha=1;
}
