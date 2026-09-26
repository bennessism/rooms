let weatherSourceMode='cache';

async function loadCatalog(){
  try{
    catalog=await fetch('https://raw.githubusercontent.com/bennessism/window/main/weather/catalog.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.json()})
  }catch(e){
    catalog={default:{country:'my',location:'selangor'},countries:{my:{name:'Malaysia',locations:[{id:'selangor',name:'Selangor',city:'Shah Alam',lat:3.0738,lon:101.5183}]}}}
  }
  populateCountries()
}

function populateCountries(){
  countrySelect.innerHTML='';
  Object.entries(catalog.countries).forEach(([id,c])=>{const o=document.createElement('option');o.value=id;o.textContent=c.name;countrySelect.append(o)});
  countrySelect.value=localStorage.getItem('windCountry')||catalog.default.country||'my';
  if(!catalog.countries[countrySelect.value])countrySelect.value=Object.keys(catalog.countries)[0];
  populateLocations()
}

function populateLocations(){
  locationSelect.innerHTML='';
  const c=catalog.countries[countrySelect.value];
  c.locations.forEach(l=>{const o=document.createElement('option');o.value=l.id;o.textContent=l.name+(l.city&&l.city!==l.name?' · '+l.city:'');locationSelect.append(o)});
  const saved=localStorage.getItem('windLocation')||catalog.default.location;
  if(c.locations.some(l=>l.id===saved))locationSelect.value=saved
}

function selectedLocation(){
  const c=catalog.countries[countrySelect.value];
  return c.locations.find(l=>l.id===locationSelect.value)||c.locations[0]
}

function labelFor(loc){return loc.city&&loc.city!==loc.name?`${loc.name} · ${loc.city}`:loc.name}
function areaFor(loc){return loc.name||loc.city||'Location'}
function fmtTime(iso){if(!iso)return'--';const m=String(iso).match(/T(\d{2}):(\d{2})/);if(!m)return'--';let h=Number(m[1]);const min=m[2],s=h>=12?'PM':'AM';h=h%12||12;return`${h}:${min} ${s}`}

function refreshUI(updatedIso){
  const strength=windStrength(wind),dir=compassName(windDir);
  summaryLine.textContent=`${currentArea} · ${strength} · ${Math.round(wind)} km/h`;
  detailLoc.textContent=currentPlace;
  conditionEl.textContent=strength;
  speedEl.textContent=Math.round(wind);
  gustEl.textContent=Math.round(gust)+' km/h';
  fromText.textContent='From '+dir;
  directionEl.textContent=`${dir} · ${Math.round(windDir)}°`;
  updatedEl.textContent='Updated '+fmtTime(updatedIso)
}

function applyWindData(data,label,area){
  currentPlace=label;
  currentArea=area;
  currentLat=Number(data.latitude ?? currentLat);
  currentLon=Number(data.longitude ?? currentLon);
  wind=Number(data.wind_speed_kmh ?? data.wind_speed_10m)||0;
  gust=Number(data.wind_gusts_kmh ?? data.wind_gusts_10m)||wind;
  windDir=Number(data.wind_direction_deg ?? data.wind_direction_10m)||0;
  isDay=typeof data.is_day==='boolean'?data.is_day:Number(data.is_day)===1;
  document.querySelector('meta[name="theme-color"]').content=isDay?'#76b7e8':'#07111f';
  refreshUI(data.time);
  seedScene(stage.clientWidth,stage.clientHeight)
}

async function loadCachedWind(countryCode=countrySelect.value,locationId=locationSelect.value){
  const country=catalog?.countries?.[countryCode];
  const loc=country?.locations?.find(l=>l.id===locationId)||country?.locations?.[0];
  if(!loc)return;
  weatherSourceMode='cache';
  currentLat=loc.lat;
  currentLon=loc.lon;
  currentPlace=labelFor(loc);
  currentArea=areaFor(loc);
  try{
    const url=`https://raw.githubusercontent.com/bennessism/window/main/weather/data/${countryCode}.json?ts=${Date.now()}`;
    const payload=await fetch(url,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.json()});
    const data=payload.locations?.[loc.id];
    if(!data)throw new Error();
    applyWindData(data,labelFor(loc),areaFor(loc))
  }catch(e){
    await loadLiveWind(loc.lat,loc.lon,labelFor(loc),areaFor(loc),false)
  }
}

async function loadLiveWind(lat=currentLat,lon=currentLon,label=currentPlace,area=currentArea,setMode=true){
  if(setMode)weatherSourceMode='live';
  currentLat=lat;currentLon=lon;currentPlace=label;currentArea=area;
  try{
    const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,is_day&wind_speed_unit=kmh&timezone=auto`;
    const j=await fetch(u,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.json()});
    applyWindData({...j.current,latitude:lat,longitude:lon},label,area)
  }catch(e){
    summaryLine.textContent=currentArea+' · data unavailable'
  }
}

function refreshCurrentWind(){
  if(weatherSourceMode==='cache')return loadCachedWind(countrySelect.value,locationSelect.value);
  return loadLiveWind(currentLat,currentLon,currentPlace,currentArea,true)
}

function useBrowserLocation(){
  if(!navigator.geolocation)return;
  navigator.geolocation.getCurrentPosition(p=>{
    picker.classList.remove('show');
    loadLiveWind(p.coords.latitude,p.coords.longitude,'Your location','Your location',true)
  },()=>{},{enableHighAccuracy:false,timeout:8000,maximumAge:600000})
}

summaryBtn.onclick=()=>{const open=detailCard.classList.toggle('show');summaryBtn.classList.toggle('open',open);if(!open)picker.classList.remove('show')};
document.getElementById('detailClose').onclick=()=>{detailCard.classList.remove('show');summaryBtn.classList.remove('open');picker.classList.remove('show')};
document.getElementById('changeLocationBtn').onclick=()=>picker.classList.toggle('show');
countrySelect.onchange=populateLocations;
document.getElementById('myLocationBtn').onclick=useBrowserLocation;
document.getElementById('applyLocationBtn').onclick=()=>{
  const loc=selectedLocation();
  localStorage.setItem('windCountry',countrySelect.value);
  localStorage.setItem('windLocation',loc.id);
  picker.classList.remove('show');
  loadCachedWind(countrySelect.value,loc.id)
};

scroller.addEventListener('scroll',()=>{if(innerWidth>700)return;const i=Math.max(0,Math.min(2,Math.round(scroller.scrollLeft/innerWidth)));document.querySelectorAll('.dots i').forEach((d,n)=>d.classList.toggle('on',n===i))},{passive:true});
addEventListener('resize',resize);
resize();
requestAnimationFrame(draw);
loadCatalog().then(()=>{const loc=selectedLocation();loadCachedWind(countrySelect.value,loc.id)});
setInterval(refreshCurrentWind,30*60*1000);
