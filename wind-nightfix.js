// Hotfix for night-particle ellipse argument count.
function drawNightParticles(w,h,t){
  if(isDay)return;
  const strength=Math.max(3,wind),d=downwindVector(),target=Math.min(40,18+Math.floor(strength*.8));
  if(particles.length<target&&Math.random()<.38)particles.push({x:Math.random()*w,y:h*.28+Math.random()*h*.54,v:.45+Math.random()*1.2,a:Math.random()*6.28,fire:Math.random()>.18,sz:3+Math.random()*4});
  particles=particles.filter(p=>p.x>-90&&p.x<w+90&&p.y>-90&&p.y<h+90);
  for(const p of particles){
    p.x+=d.x*strength*.024*p.v+Math.sin(t*.002+p.a)*.22;
    p.y+=d.y*strength*.011*p.v+Math.sin(t*.0026+p.a)*.12;
    p.a+=.04*p.v;
    if(p.fire){
      ctx.fillStyle='#eaff91';ctx.globalAlpha=.48+.42*Math.sin(t*.005+p.a);
      ctx.beginPath();ctx.arc(p.x,p.y,1.7+Math.sin(p.a)*.35,0,Math.PI*2);ctx.fill();
    }else{
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(d.y,d.x)+p.a*.12);
      ctx.fillStyle='#8a6a42bb';ctx.globalAlpha=.62;ctx.beginPath();
      ctx.ellipse(0,0,p.sz,2,0,0,Math.PI*2);ctx.fill();ctx.restore();
    }
  }
  ctx.globalAlpha=1;
}
