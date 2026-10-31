/* S4.3: illustrated harbor entry/interior, registered soldier frames. S4.2d: generated mine and normal Magellan PNG art. Damage is runtime VFX only;
   a separately generated damaged illustration is not present. */
'use strict';
window.createStageFour=function(api){
 const {W,H,ctx,images,sprite}=api;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 let clock=0,mineWave=0,rockWave=0,zakuWave=0,started=false,phase=0,escape=0,finished=false;
 const BOSS_SECONDS=75,HULL_HP=40;
 let hullParts=[],shipBoss=null,bossAge=0,remaining=BOSS_SECONDS,damageBudget=4,failed=false,bossZakuWave=0,bossSoldierWave=0;
 let notice='',noticeUntil=0,soldierWave=0,platformPatrolWave=0;
 let suitIntroduced=false,hawkIntroduced=false,hawk=null,entryCleared=false;
 const artLayout=window.StageFourHarborLayout||{sprites:{},terrain:{}};
 const entryQuiet=()=>!started&&clock>=22&&clock<33;
 function scene(){return started?'exit':clock<18?'approach':clock<24?'entrance':clock<32?'crossing':clock<80?'interior':'exit';}
 const wallAmount=()=>started?1:clamp((clock-24)/8,0,1);
 const hawkBusy=()=>hawk?.hp>0&&['windup','turnWindup','dash'].includes(hawk.mode);
 function introduceSuit(){suitIntroduced=true;entity('charSuit',W-150,180,1,30,{role:'commander',red:false,capsuleCarrier:false,noReward:true});say('赤い宇宙服の指揮官 — 一般の補給兵とは別行動',4);}
 function introduceHawk(){hawkIntroduced=true;hawk=entity('charHawk',W+75,200,16,62,{role:'ace',red:false,capsuleCarrier:false,mode:'approach',timer:3,cycles:0,rounds:0,hitThisPass:false,exitLane:180});say('シャアザク接近 — ヒートホークの構えを見て避けろ',4);}
 function updateSuit(e,dt){e.x+=(clock<12?-75:220)*dt;e.y=boundary(offset()+e.x,true)+30+Math.sin(e.age*1.5)*8;if(clock>=16||e.x>W+100){e.hp=0;e.paid=true;}return true;}
 function hawkMove(e,vx,vy,dt,strike=false){let blocked=false;const steps=Math.max(1,Math.ceil(Math.hypot(vx,vy)*dt/12));
  for(let i=0;i<steps;i++){const a={x:e.x,y:e.y},wanted={x:clamp(e.x+vx*dt/steps,35,W+90),y:e.y+vy*dt/steps};e.x=wanted.x;e.y=wanted.y;constrain(e,33);
   if(Math.hypot(e.x-wanted.x,e.y-wanted.y)>.5){blocked=true;break;}
   if(strike&&!e.hitThisPass){const p=api.player(),dx=e.x-a.x,dy=e.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);if(Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t)<24+api.hitRadius()){api.hit(25,1);e.hitThisPass=true;}}
  }return blocked;
 }
 function beginHawkWarning(e,turn=false){e.mode=turn?'turnWindup':'windup';e.timer=turn?.65:.6;e.target={x:api.player().x,y:api.player().y};e.hitThisPass=false;}
 function updateHawk(e,dt){if(clock>=86){e.mode='retire';e.x+=400*dt;if(e.x>W+110){e.hp=0;e.paid=true;}return true;}
  e.timer-=dt;
  if(e.mode==='approach'){
   const gx=clamp(api.player().x+285,450,W-160),gy=clamp(api.player().y+(e.cycles%2?-105:105),175,floorY()-175),dx=gx-e.x,dy=gy-e.y,d=Math.hypot(dx,dy),speed=Math.min(245,d/Math.max(dt,.001));
   const blocked=hawkMove(e,dx/(d||1)*speed,dy/(d||1)*speed,dt);if(blocked)e.exitLane=e.y<floorY()/2?175:floorY()-175;
   if(blocked)hawkMove(e,0,Math.sign(e.exitLane-e.y)*170,dt);
   if((d<35||e.timer<=0)&&e.x<W-60){e.cycles++;e.rounds=0;beginHawkWarning(e);}
  }else if(e.mode==='windup'||e.mode==='turnWindup'){
   if(e.timer<=0){const a=Math.atan2(e.target.y-e.y,e.target.x-e.x);e.vx=Math.cos(a)*660;e.vy=Math.sin(a)*660;e.mode='dash';e.timer=.58;}
  }else if(e.mode==='dash'){
   const blocked=hawkMove(e,e.vx,e.vy,dt,true);if(blocked||e.timer<=0){e.blocked=blocked;e.mode='recover';e.timer=.7;}
  }else if(e.mode==='recover'){
   if(e.timer<=0){if(e.cycles%3===0&&e.rounds===0&&!e.blocked){e.rounds++;beginHawkWarning(e,true);}else{e.mode='leave';e.exitLane=e.y<floorY()/2?175:floorY()-175;e.timer=3;}}
  }else if(e.mode==='leave'){
   const vy=clamp(e.exitLane-e.y,-260,260),blocked=hawkMove(e,540,vy,dt);if(blocked)hawkMove(e,0,Math.sign(e.exitLane-e.y)*230,dt);
   if(e.x>W+60){e.mode='wait';e.timer=3.5;}
  }else if(e.mode==='wait'&&e.timer<=0){e.mode='approach';e.timer=3;}
  return true;
 }
 function drawCommander(e){ctx.save();if(e.stage4Kind==='charSuit'){
  const art=images.federationCrew2||images.federationCrew1;if(art){const h=34,w=h*art.sw/art.sh;ctx.filter='sepia(.8) saturate(2.1) hue-rotate(310deg)';ctx.drawImage(art.im,art.sx,art.sy,art.sw,art.sh,e.x-w/2,e.y-h/2,w,h);ctx.filter='none';}text('CHAR',e.x,e.y-29,12,'#ffb5ad','center');
 }else{
  const warning=e.mode==='windup'||e.mode==='turnWindup',dash=e.mode==='dash';sprite(images.charKick0?'charKick0':'charZaku',e.x,e.y,76);
  // Existing unarmed Char pose + readable axe overlay; dedicated artwork is a later step.
  ctx.translate(e.x-22,e.y-4);ctx.rotate(warning?-.8:dash?.55:.1);line(0,20,-12,-25,'#aab1bb',4);ctx.fillStyle=warning?'#ffe09a':'#ff995e';ctx.beginPath();ctx.moveTo(-13,-28);ctx.lineTo(-39,-22);ctx.lineTo(-38,-5);ctx.lineTo(-13,-13);ctx.closePath();ctx.fill();
  if(warning){ctx.rotate(.8);text(e.mode==='turnWindup'?'折り返し注意':'斬り込み予告',16,-50,15,'#ffe3a2','center');ctx.strokeStyle='#ffd19b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(15,0,46,-2.3,-.5);ctx.stroke();}
 }ctx.restore();}
 // Harbor step 1: world-space surfaces shared by drawing, actors and projectiles.
 const floorY=()=>api.floor?.()||H;
 const offset=()=>api.scroll?.()??Math.min(90,clock)*110;
 const platforms=[{wx:4800,y:278,w:250,h:76},{wx:7000,y:355,w:260,h:76},{wx:9100,y:270,w:250,h:76}];
 const TILE=1280,TILE_DRAW=1400;
 function sampleContour(name,u,side){const a=artLayout.terrain[name]?.[side];if(!a)return side==='top'?0:1;const p=clamp(u,0,1)*(a.length-1),i=Math.floor(p);return a[i]+(a[Math.min(i+1,a.length-1)]-a[i])*(p-i);}
 function boundary(wx,top=false){const f=wallAmount(),index=Math.floor(wx/TILE);let edge=top?0:floorY();for(const i of [index-1,index]){const u=(wx-i*TILE)/TILE_DRAW;if(u<0||u>1)continue;const y=top?f*(-24+sampleContour('harborCeiling',u,'bottom')*154):floorY()+f*(-136+sampleContour('harborFloor',u,'top')*160);edge=top?Math.max(edge,y):Math.min(edge,y);}return edge;}
 function harborRects(){if(wallAmount()<=0)return [];const out=[];for(let i=-1;i<Math.ceil(W/TILE)+1;i++){const x=i*TILE-((offset()%TILE)+TILE)%TILE;out.push({x,y:-24*wallAmount(),w:TILE_DRAW,h:154*wallAmount(),kind:'ceiling'},{x,y:floorY()-136*wallAmount(),w:TILE_DRAW,h:160*wallAmount(),kind:'floor'});}if(!started)for(const p of platforms){const x=p.wx-offset();if(x+p.w>-80&&x<W+160)out.push({...p,x,kind:'platform'});}return out;}
 function platformSolid(r){return {...r,x:r.x+12,y:r.y+8,w:r.w-24,h:r.h-16};}

 function spawnSoldier(index,routeOverride=null){const platform=index%4===2?platforms[Math.floor(index/4)%platforms.length]:null;
  // A central-platform patrol is released only when its platform approaches the screen.
  const route=routeOverride||(platform&&platform.wx-offset()>W-200&&platform.wx-offset()<W+300?platform:null);
  const e=entity('soldier',W+70,0,3,28,{route,wx:route?route.wx+route.w/2:offset()+W+70,top:index%2===1,red:index%3===0,launcher:index%3===1,shotCycle:-1});
  e.routeOrigin=e.wx;placeSoldier(e);return e;
 }
 function placeSoldier(e){const wave=e.age%6.4;e.hidden=wave<1||wave>=4.7;e.aiming=wave>=2&&wave<2.7;
  e.wx=e.routeOrigin+Math.sin(e.age*.8)*68;e.x=e.wx-offset();e.facing=api.player().x<e.x?-1:1;const protrude=e.hidden?-6:17;
  if(e.route)e.y=e.route.y+(e.top?e.route.h+protrude:-protrude);
  else e.y=boundary(e.wx,e.top)+(e.top?protrude:-protrude);e.surfaceY=e.route?e.route.y+(e.top?e.route.h:0):boundary(e.wx,e.top);e.gunX=e.x+e.facing*24;e.gunY=e.y+(e.top?3:-3);
 }
 function updateSoldier(e,dt){placeSoldier(e);const cycle=Math.floor(e.age/6.4),wave=e.age%6.4;
  if(!entryQuiet()&&!hawkBusy()&&wave>=2.7&&wave<4.7&&e.shotCycle!==cycle&&e.x>35&&e.x<W-30){e.shotCycle=cycle;
   if(e.launcher&&api.addBullet){const a=Math.atan2(api.player().y-e.gunY,api.player().x-e.gunX);api.addBullet({x:e.gunX,y:e.gunY,vx:Math.cos(a)*145,vy:Math.sin(a)*145,r:5,type:'missile'});}
   else api.fire(e.gunX,e.gunY,145);
  }return true;
 }
 function drawSoldier(e){const row=(e.red?2:0)+(e.launcher?1:0),pose=e.hidden?'crouch':e.aiming||e.age%6.4>=2.7?'aim':Math.floor(e.age*5)%2?'walkB':'walkA',key='harborSoldier'+row+pose,art=images[key],reg=artLayout.sprites[key];if(!art||!reg)return;
  ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.facing===1?-1:1,e.top?-1:1);const scale=34/reg.bodyHeight,foot=17;
  // Terrain conceals the crouched body. Its helmet can peek out but cannot fire while hidden.
  if(e.hidden){ctx.beginPath();ctx.rect(-70,-90,140,Math.max(0,(e.top?e.y-e.surfaceY:e.surfaceY-e.y)+90));ctx.clip();}
  ctx.drawImage(art.im,art.sx,art.sy,art.sw,art.sh,-reg.footX*scale,foot-reg.footY*scale,art.sw*scale,art.sh*scale);
  if(e.aiming){ctx.strokeStyle='#ffd17c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-24,-3,7,0,Math.PI*2);ctx.stroke();}ctx.restore();
 }
 function drawArtRect(key,r){const art=images[key];if(art)ctx.drawImage(art.im,art.sx,art.sy,art.sw,art.sh,r.x,r.y,r.w,r.h);}
 function drawHarbor(){ctx.save();for(const r of harborRects())drawArtRect(r.kind==='platform'?'harborDeck':r.kind==='ceiling'?'harborCeiling':'harborFloor',r);ctx.restore();}

 function harborShot(s){if(phase===3)return false;const top=boundary(offset()+s.x,true),bottom=boundary(offset()+s.x,false);
  if(s.kind==='bazooka'){
   if(s.y>=bottom-7){s.surface=1;s.y=bottom-7;s.vx=420;s.vy=0;}
   else if(s.y<=top+7){s.surface=-1;s.y=top+7;s.vx=420;s.vy=0;}
  }
  if(s.harborSurface){const r=s.harborSurface;if(s.x<r.wx-offset()+r.w&&s.x>r.wx-offset()){s.y=s.surface>0?r.y-7:r.y+r.h+7;s.vx=420;s.vy=0;return false;}s.harborSurface=null;s.vy=s.surface>0?120:-120;}
  const block=harborRects().filter(r=>r.kind==='platform').map(platformSolid).find(r=>s.x>r.x&&s.x<r.x+r.w&&s.y>r.y-5&&s.y<r.y+r.h+5);
  if(block&&s.kind==='bazooka'){
   const above=s.y<block.y+block.h/2;s.surface=above?1:-1;s.harborSurface={...block,wx:block.wx+12};s.y=above?block.y-7:block.y+block.h+7;s.vx=420;s.vy=0;return false;
  }
  if(block||s.kind!=='bazooka'&&(s.y<=top||s.y>=bottom)){if(s.kind==='cannon')api.detonate(s);else s.life=0;return true;}return false;
 }
 function say(s,d=4){notice=s;noticeUntil=clock+d;}
 function reset(){clock=mineWave=rockWave=zakuWave=phase=escape=soldierWave=platformPatrolWave=bossAge=bossZakuWave=bossSoldierWave=0;started=finished=failed=suitIntroduced=hawkIntroduced=false;hawk=shipBoss=null;entryCleared=false;hullParts=[];remaining=BOSS_SECONDS;damageBudget=4;notice='';noticeUntil=0;}
 function entity(kind,x,y,hp,size,extra={}){const e={type:'zaku',stage4Kind:kind,x,y,hp,max:hp,size,age:0,shot:2,base:y,phase:0,noReward:started,...extra};api.add(e);return e;}
 function mine(x,y,extra={}){return entity('mine',x,y,3,42,{vx:-82,armed:0,burst:false,...extra});}
 function rock(x,y,extra={}){return entity('debris',x,y,8,60,{vx:-100,vy:0,radius:32,warning:1.3,seed:rockWave%6,...extra});}
 function zaku(x,y,extra={}){return entity('zaku',x,y,4,65,{vx:-112,shot:2.5,...extra});}
 function beginBoss(){started=true;phase=0;bossAge=bossZakuWave=bossSoldierWave=0;remaining=BOSS_SECONDS;damageBudget=4;api.clearThreats();
  hullParts=[{name:'船首',x:914,y:175,size:124},{name:'船体',x:1000,y:floorY()/2+12,size:150},{name:'機関部',x:1090,y:floorY()-150,size:140}].map((p,i)=>entity('magellanHull',p.x,p.y,HULL_HP,p.size,{index:i,name:p.name,brokenAt:null,flash:0}));
  shipBoss={kind:'magellanBlockade',x:1000,y:floorY()/2,hp:HULL_HP*3,max:HULL_HP*3,turrets:[],guards:[],units:hullParts};api.setBoss(shipBoss);say('総員退艦確認済み — マゼラン全船体を破壊して脱出！',6);
 }
 function updateBlockade(dt){bossAge+=dt;shipBoss.hp=hullParts.reduce((n,p)=>n+Math.max(0,p.hp),0);
  if(phase===3){escape+=dt;if(escape>=8){finished=true;api.complete();}return;}
  if(shipBoss.hp<=0){phase=3;escape=0;api.score(2000);api.material(960,330,3,3);api.clearThreats();say('マゼラン完全破壊 — ホワイトベース脱出！',8);return;}
  remaining=Math.max(0,remaining-dt);if(remaining===0){failed=finished=true;say('時間切れ — 脱出失敗',8);api.fail?.('制限時間切れ。第4面に再出撃して脱出路を開こう。');return;}
  damageBudget=Math.min(4,damageBudget+8*dt);for(const p of hullParts)p.flash=Math.max(0,p.flash-dt);
  if(bossAge>=1+bossZakuWave*6){zaku(W+45,[220,440,330][bossZakuWave%3],{vx:-120,shot:2.8,red:false});bossZakuWave++;}
  if(bossAge>=1.5+bossSoldierWave*7){const e=spawnSoldier(100+bossSoldierWave);e.route=null;e.routeOrigin=offset()+[800,1030,910][bossSoldierWave%3];e.top=bossSoldierWave%2===1;e.red=bossSoldierWave<2;e.bossCapsule=e.red;placeSoldier(e);bossSoldierWave++;}
 }
 function update(t,dt){clock=t;
  if(finished)return;
  if(!started){
   if(t>=22&&!entryCleared){api.clearThreats();entryCleared=true;if(!api.deferChar)say('誘導灯に沿ってルナ2内部へ進入',10);}
   if(entryQuiet()){mineWave=Math.max(mineWave,Math.floor((t-6)/6)+1);rockWave=Math.max(rockWave,Math.floor((t-23)/6.6)+1);zakuWave=Math.max(zakuWave,Math.floor((t-13)/8)+1);soldierWave=Math.max(soldierWave,Math.floor((t-5)/7)+1);return;}
   if(t>=2&&!suitIntroduced&&t<16)introduceSuit();
   if(!api.deferChar&&t>=36&&!hawkIntroduced&&t<86)introduceHawk();
   if(t>=5+soldierWave*7&&t<79){spawnSoldier(soldierWave++);}
   if(platformPatrolWave<platforms.length&&offset()>=platforms[platformPatrolWave].wx-W+120&&t<79){spawnSoldier(50+platformPatrolWave,platforms[platformPatrolWave]);platformPatrolWave++;}
   if(t<4)say('ルナツー港へ — ホワイトベースの脱出路を開け',.2);
   if(t>=6+mineWave*6&&t<78){const y=[210,440,290,500,165,380][mineWave%6];mine(W+35,y);if(mineWave>4)mine(W+145,H-y);mineWave++;if(mineWave===1)say('機雷は接近すると点滅 → 射撃で安全に除去',5);}
   if(t>=23+rockWave*6.6&&t<81){const lane=[170,500,285,445][rockWave%4];rock(W+40,lane,{vy:rockWave%2?18:-18});rockWave++;if(rockWave===1)say('崩落物は破壊可能 — 青い隙間を通ろう',5);}
   if(t>=13+zakuWave*8&&t<82){for(let i=0;i<3;i++)zaku(W+60+i*85,[320,210,440,320][zakuWave%4]+(i-1)*60,{red:i===2});zakuWave++;}
   if(t>=82&&t<86)say('港口へ接近 — 機雷・崩落・敵部隊に備えろ',.2);
   if(t>=90)beginBoss();return;
  }
  updateBlockade(dt);
 }
 function updateEnemy(e,dt){if(!e.stage4Kind)return false;e.age+=dt;
  if(e.stage4Kind==='charSuit')return updateSuit(e,dt);
  if(e.stage4Kind==='charHawk')return updateHawk(e,dt);
  if(e.stage4Kind==='soldier')return updateSoldier(e,dt);
  if(e.stage4Kind==='magellanHull'){return true;}
  if(e.stage4Kind==='mine'){
   e.x+=e.vx*dt;e.y+=Math.sin(e.age*1.6)*5*dt;
   if(e.armed===0&&e.x<W-35&&Math.hypot(api.player().x-e.x,api.player().y-e.y)<165){e.armed=1.25;e.triggered=true;}
   else if(e.triggered){e.armed-=dt;if(e.armed<=0){e.hp=0;e.burst=true;api.explode(e.x,e.y,'#ffc56b',24);if(Math.hypot(api.player().x-e.x,api.player().y-e.y)<100+api.hitRadius())api.hit(25,1);}}
  }else if(e.stage4Kind==='debris'){
   if(e.warning>0){e.warning-=dt;}else{e.x+=e.vx*dt;e.y=clamp(e.y+e.vy*dt,100,H-100);if(Math.hypot(api.player().x-e.x,api.player().y-e.y)<e.radius+24)api.hit(20,1);}
  }else{
   e.x+=e.vx*dt;e.y=e.base+Math.sin(e.age*1.5)*36;e.shot-=dt;
   if(!entryQuiet()&&!hawkBusy()&&e.shot<=0&&e.x<W-40&&e.x>90){e.shot=5.5;api.fire(e.x-22,e.y,150);}
   if(Math.hypot(api.player().x-e.x,api.player().y-e.y)<44&&!api.meleeSafe(e))api.hit();
  }return true;
 }
 function filterDamage(e,amount,source){if(!e.stage4Kind)return amount;if(e.hp<=0||failed)return 0;if(e.stage4Kind==='charSuit')return 0;if(e.stage4Kind==='charHawk'&&['dash','leave','wait','retire'].includes(e.mode))return 0;if(e.stage4Kind==='soldier'&&e.hidden&&!(source?.r>=60))return 0;if(e.stage4Kind==='magellanHull'){
   if(phase===3)return 0;const n=Math.max(0,Math.min(amount,e.hp,damageBudget));damageBudget-=n;if(n>0)e.flash=.12;return n;
  }return amount;}
 function onKilled(e){if(!e.stage4Kind)return false;if(e.paid)return true;e.paid=true;
  if(e.stage4Kind==='charSuit')return true;
  if(e.stage4Kind==='charHawk'){api.explode(e.x,e.y,'#ffb099',22);api.score(1200);api.material(e.x,e.y,3,2);return true;}
  if(e.stage4Kind==='magellanHull'){e.brokenAt=bossAge;api.explode(e.x,e.y,'#ffbf82',38,'ship');return true;}
  if(e.stage4Kind==='soldier'){api.explode(e.x,e.y,'#b5dce4',10,'silent');if(e.noReward){if(e.bossCapsule)api.capsule(e.x,e.y);return true;}api.score(150);if(e.red)api.capsule(e.x,e.y);else api.material(e.x,e.y,1,1);return true;}
  api.explode(e.x,e.y,e.stage4Kind==='mine'?'#ffe09a':'#b7d6d9',20,e.stage4Kind==='zaku'?undefined:'silent');if(e.noReward)return true;api.score(e.stage4Kind==='zaku'?150:75);
  if(e.stage4Kind==='zaku'){if(e.red)api.capsule(e.x,e.y);else api.material(e.x,e.y,1,1);}return true;
 }
 function interceptShot(s){if(harborShot(s))return true;s.hitTargets ||= new Set();for(const e of api.enemies()){
  if(!e.stage4Kind||e.hp<=0||s.hitTargets.has(e))continue;
  const pad=e.stage4Kind==='magellanHull'?e.size/2:e.stage4Kind==='debris'?e.radius:e.stage4Kind==='soldier'?17:24;
  if(Math.abs(s.x-e.x)>s.w/2+pad||Math.abs(s.y-e.y)>s.h/2+pad)continue;
  if(['bazooka','cannon'].includes(s.kind)){api.detonate(s);return true;}
  api.damage(e,s.damage,{x:s.x,y:s.y,r:Math.max(s.w,s.h)/2});s.hitTargets.add(e);if(s.kind!=='laser'){s.life=0;return true;}
 }return false;}
 function constrain(body,pad=28){if(!started){const old={x:body.x,y:body.y};body.y=clamp(body.y,boundary(offset()+body.x,true)+pad,boundary(offset()+body.x,false)-pad);
  for(const r of harborRects().filter(r=>r.kind==='platform').map(platformSolid)){if(body.x+pad<=r.x||body.x-pad>=r.x+r.w||body.y+pad<=r.y||body.y-pad>=r.y+r.h)continue;
   const options=[{d:body.x+pad-r.x,x:r.x-pad,y:body.y},{d:r.x+r.w+pad-body.x,x:r.x+r.w+pad,y:body.y},{d:body.y+pad-r.y,x:body.x,y:r.y-pad},{d:r.y+r.h+pad-body.y,x:body.x,y:r.y+r.h+pad}].sort((a,b)=>a.d-b.d);body.x=options[0].x;body.y=options[0].y;
  }if(old.x!==body.x||old.y!==body.y)api.stopTarget(body);return;}if(phase>=3)return;const oldY=body.y;body.y=clamp(body.y,boundary(offset()+body.x,true)+pad,boundary(offset()+body.x,false)-pad);if(oldY!==body.y)api.stopTarget(body);const edge=900-pad;if(body.x>edge){body.x=edge;api.stopTarget(body);}}
 function line(x,y,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
 function text(s,x,y,size=16,color='#e9f6ff',align='left'){ctx.fillStyle=color;ctx.font='bold '+size+'px "Yu Gothic",sans-serif';ctx.textAlign=align;ctx.fillText(s,x,y);ctx.textAlign='left';}
 function drawShip(x,y,scale=1,angle=0){if(!images.magellanNormal)return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);sprite('magellanNormal',0,0,470);ctx.restore();}
 function drawBlockade(){for(const part of hullParts){const broken=part.hp<=0,age=broken?Math.max(0,bossAge-(part.brokenAt??bossAge)):0;if(age>3.2)continue;
  ctx.save();if(broken){ctx.translate((part.index-1)*age*22,28*age+65*age*age);ctx.globalAlpha=Math.max(0,1-age/3.2);}
  const cuts=[0,235,425,H+150];ctx.beginPath();ctx.rect(720,cuts[part.index],520,cuts[part.index+1]-cuts[part.index]);ctx.clip();if(part.flash>0)ctx.filter='brightness(1.7)';drawShip(1020,floorY()/2,1.17,1.06);ctx.restore();}
 }
 function drawBackdrop(){ctx.save();const gradient=ctx.createLinearGradient(0,0,W,H);gradient.addColorStop(0,'#071c2c');gradient.addColorStop(1,'#040b19');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
  // Space recedes BEHIND the entrance; rock interior then covers the entire far field.
  for(let i=0;i<52;i++){const x=(i*193-clock*(7+i%3*4)+W*100)%W;ctx.fillStyle=i%4?'#41677a':'#b0d1d8';ctx.fillRect(x,(i*113)%H,2,2);}
  const p=clamp(clock/24,0,1),inside=clamp((clock-26)/6,0,1),exit=started?1:clamp((clock-80)/10,0,1);
  if(clock<30){const approach=clamp(clock/24,0,1);sprite('lunaTwo',1040-approach*360,200+approach*120,460+approach*1550,1);}
  if(inside>0){ctx.save();ctx.globalAlpha=inside;ctx.fillStyle='#101a23';ctx.fillRect(0,0,W*(1-exit),H);ctx.globalAlpha=inside*.45;for(let i=-1;i<8;i++){const x=i*240-(clock*25)%240;if(x>W*(1-exit))continue;ctx.fillStyle='#26353d';ctx.fillRect(x,0,18,H);line(x,100,x+170,H-120,'#34434c',7);}ctx.restore();}
  if(clock>=18&&clock<32){const q=clamp((clock-18)/14,0,1),w=600+q*2400,h=w*2/3;ctx.save();ctx.globalAlpha=clamp((clock-18)/2,0,1);drawArtRect('harborEntry',{x:W/2-w/2,y:H/2-h/2,w,h});ctx.restore();for(let i=0;i<4;i++){const x=260+i*210;ctx.fillStyle=clock%1<.65?'#f1c775':'#65563d';ctx.fillRect(x,135,10,4);ctx.fillRect(x,floorY()-135,10,4);}text(clock<24?'LUNA II — DOCK ENTRY':'ルナ2内部へ進入',W/2,145,20,'#e4d8b5','center');}
  api.drawDockBackground?.(ctx,clock);drawHarbor();
  if(started){drawBlockade();if(phase<3){text('退艦済みマゼランが出口を封鎖',995,94,14,'#bdd6de','center');text('船首・船体・機関部を全破壊して脱出',995,114,12,'#a9becb','center');}
   else{const x=-220+Math.max(0,escape-2)*270;sprite('whiteBase',x,340,350);text('マゼラン全破壊 — ホワイトベース脱出',W/2,165,24,'#a3f4e1','center');}}
  text('LUNA II / '+({approach:'APPROACH',entrance:'DOCK ENTRY',crossing:'ENTERING ROCK DOCK',interior:'INTERIOR DOCK',exit:'EXIT TO SPACE'}[scene()]),38,113,13,'#6e9eb6');
  // All decoration is drawn before enemies and bullets, never over their warning/attack layer.
  if(clock<noticeUntil){const noticeY=Math.min(H-110,floorY()-175);ctx.fillStyle='#071b2eea';ctx.fillRect(180,noticeY-27,W-360,42);text(notice,W/2,noticeY,18,'#d7f6ff','center');}ctx.restore();}

 function drawEnemy(e){if(!e.stage4Kind)return false;if(['charSuit','charHawk'].includes(e.stage4Kind)){drawCommander(e);return true;}if(e.stage4Kind==='soldier'){drawSoldier(e);return true;}ctx.save();
  if(e.stage4Kind==='zaku'){sprite('zaku',e.x,e.y,65);if(e.red){ctx.strokeStyle='#ffc66e';ctx.beginPath();ctx.arc(e.x,e.y,34,0,Math.PI*2);ctx.stroke();}}
  else if(e.stage4Kind==='mine'){const armed=e.triggered;ctx.translate(e.x,e.y);ctx.rotate(e.age*.45);if(armed&&Math.sin(e.age*22)>0)ctx.filter='brightness(1.8)';sprite('harborMine',0,0,54);ctx.filter='none';ctx.rotate(-e.age*.45);
   if(armed){ctx.setLineDash([6,8]);ctx.strokeStyle='#ffb96a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,100,0,Math.PI*2);ctx.stroke();text('退避',0,-112,13,'#ffcc91','center');}}
  else if(e.stage4Kind==='debris'){if(e.warning>0){ctx.setLineDash([10,12]);line(400,e.y,W,e.y,'#ffca6d88',2);text('崩落 →',1000,e.y-18,16,'#ffcf7f');}else{ctx.translate(e.x,e.y);ctx.rotate(e.age*.32);sprite('asteroidArt'+(e.seed%6),0,0,72);}}
  else if(e.stage4Kind==='magellanHull'){ctx.fillStyle='#0d2131';ctx.fillRect(e.x-48,e.y-52,96,7);ctx.fillStyle='#ffbe82';ctx.fillRect(e.x-48,e.y-52,96*e.hp/e.max,7);text(e.name+' '+Math.ceil(e.hp),e.x,e.y-60,13,'#ffe3be','center');}
  ctx.restore();return true;}
 function drawBoss(){if(!started||phase>=3)return;ctx.save();ctx.fillStyle='#071b2ef2';ctx.fillRect(270,18,660,60);text('マゼラン船体破壊  /  残り '+Math.ceil(remaining)+'秒',W/2,43,21,remaining<=15?'#ff8f79':'#f7dc9e','center');ctx.fillStyle='#334b5d';ctx.fillRect(410,58,380,8);ctx.fillStyle='#ffba84';ctx.fillRect(410,58,380*Math.max(0,shipBoss.hp)/shipBoss.max,8);ctx.restore();}
 function snapshot(){return {version:"S4.3",scene:scene(),entryQuiet:entryQuiet(),entryCleared,wallAmount:wallAmount(),started,phase,escape,finished,failed,bossAge,remaining,bossSeconds:BOSS_SECONDS,totalHullHP:HULL_HP*3,damageBudget,bossZakuWave,bossSoldierWave,soldierWave,suitIntroduced,hawkIntroduced,hawk:hawk?{x:hawk.x,y:hawk.y,hp:hawk.hp,mode:hawk.mode,timer:hawk.timer,cycles:hawk.cycles,rounds:hawk.rounds}:null,harborRects:harborRects(),soldiers:api.enemies().filter(e=>e.stage4Kind==='soldier').map(e=>({x:e.x,y:e.y,hidden:e.hidden,aiming:e.aiming,red:e.red,launcher:e.launcher,facing:e.facing,surfaceY:e.surfaceY,gunX:e.gunX,gunY:e.gunY})),hullParts:hullParts.map(p=>({x:p.x,y:p.y,hp:p.hp,max:p.max,name:p.name,brokenAt:p.brokenAt})),notice};}
 return {reset,update,updateEnemy,filterDamage,onKilled,interceptShot,constrain,drawBackdrop,drawEnemy,drawBoss,snapshot,boundary,get harborActive(){return !finished&&phase<3;},get zone(){return started?phase>=3?'完全破壊 / 脱出':failed?'時間切れ / 脱出失敗':'マゼラン破壊 / 残り'+Math.ceil(remaining)+'秒':scene()==='approach'?'宇宙港へ接近':scene()==='entrance'?'誘導灯 / ドック入口':scene()==='crossing'?'ルナ2内部へ進入':scene()==='interior'?'岩盤内ドック / 脱出航路':'出口 / 星空へ';}};
};


/* S4.4b: infiltration, blockade escape and a final Char heat-hawk duel.
   This file is concatenated into allowlisted stage-four.js by the packaging script. */
(function(){const createLegacy=window.createStageFour;
window.createStageFour=function(api){const data=window.StageFourHumanData;if(!data)return createLegacy(api);
 const {W,H,ctx,images,sprite}=api,nav=data.nav,free=Uint8Array.from(atob(nav.free),c=>c.charCodeAt(0)),shotFree=Uint8Array.from(atob(nav.shots||nav.free),c=>c.charCodeAt(0));const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 let active=true,initialized=false,camera={x:0,y:0},world={x:nav.start[0],y:nav.start[1]},safe={...world},facing=1,boarding=0,boardAge=0,carry=null,pending=false,elapsed=0,step=0,legacyScroll=3630;
 const plans=Array.from({length:13},(_,i)=>{const k=Math.min(nav.route.length-24,35+i*30),p=nav.route[k];return {id:i,wx:p[0]+(i%2?0:48),wy:p[1],hp:i===9?10:3,dead:false};});
 function pass(x,y){return x>=0&&y>=0&&x<nav.width&&y<nav.height&&free[Math.floor(y/nav.cell)*nav.cols+Math.floor(x/nav.cell)]===1;}
 function nearest(x,y){if(pass(x,y))return {x,y};for(let d=1;d<30;d++)for(let k=0;k<32;k++){const a=k*Math.PI/16,xx=x+Math.cos(a)*d*nav.cell,yy=y+Math.sin(a)*d*nav.cell;if(pass(xx,yy))return {x:xx,y:yy};}return {...safe};}
 let duel=null,duelAge=0,downAge=0,duelBudget=3,completed=false,duelPasses=0,boardSwitched=false;
 function shotPass(x,y){return x>=0&&y>=0&&x<nav.width&&y<nav.height&&shotFree[Math.floor(y/nav.cell)*nav.cols+Math.floor(x/nav.cell)]===1;}
 let burnerPhase='ready',burnerTime=8,fallVelocity=0,fallStep=0,grounded=false,walkDistance=0;
 function resetBurner(){burnerPhase='ready';burnerTime=8;fallVelocity=fallStep=walkDistance=0;grounded=false;}
 function activateBurner(){if(!active||boarding>0||api.player().dying>0||burnerPhase!=='ready')return false;burnerPhase='active';burnerTime=8;fallVelocity=fallStep=0;grounded=false;api.clearHumanVerticalTarget?.();return true;}
 function burnerStatus(){return {phase:burnerPhase,remaining:burnerTime,total:burnerPhase==='recharge'?2:8,grounded};}
 function drawLocomotion(key,x,y,alpha){const a=images[key];if(!a)return false;const scale=60/a.bodyHeight;ctx.save();ctx.translate(x,y);ctx.scale(facing,1);ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(a.im,a.sx,a.sy,a.sw,a.sh,(a.sx-a.bodyX)*scale,30+(a.sy-a.bodyBottom)*scale,a.sw*scale,a.sh*scale);ctx.restore();return true;}
 function advanceBoarding(dt){if(boarding<=0)return;boarding+=dt;if(boarding>=2&&!boardSwitched){carry=api.carryState?.();active=false;boardAge=0;boardSwitched=true;legacy.reset();api.boardHuman?.();legacy.update(32,0);legacy.update(33,0);}if(boarding>=3.2){boarding=0;api.freezeBoarding?.();}}
 function drawFade(){if(boarding<=0)return;const alpha=boarding<1.2?0:boarding<2?(boarding-1.2)/.8:boarding<2.2?1:clamp((3.2-boarding),0,1);if(alpha>0){ctx.save();ctx.fillStyle='rgba(0,0,0,'+alpha+')';ctx.fillRect(0,0,W,H);ctx.restore();}}
 function dockBackground(c,t){if(t<33||t>=90)return;const a=images.dockBackgroundBand;if(!a)return;const exit=clamp((t-80)/10,0,1);c.save();c.beginPath();c.rect(0,0,W*(1-exit),H);c.clip();c.globalAlpha=.48;const drift=(t*12)%(W*1.5);for(let i=-1;i<2;i++)c.drawImage(a.im,a.sx,a.sy,a.sw,a.sh,i*W*1.5-drift,125,W*1.5,390);c.restore();}
 const legacy=createLegacy({...api,deferChar:true,scroll:()=>legacyScroll,drawDockBackground:dockBackground,complete:beginDuel});
 function beginDuel(){if(duel)return;api.clearThreats();duelAge=downAge=duelPasses=0;duelBudget=3;duel={type:'zaku',stage4Kind:'duelChar',kind:'charDuel',x:W+70,y:H/2,hp:36,max:36,size:72,age:0,mode:'approach',timer:1.6,cycles:0,rounds:0,hitThisPass:false,paid:false,turrets:[],guards:[],vx:0,vy:0};api.add(duel);api.setBoss(duel);}
 function initialize(t){initialized=true;if(t>=90){active=false;boardAge=t-33;return;}world={x:nav.start[0],y:nav.start[1]};safe={...world};camera={x:clamp(world.x-W*.35,0,nav.width-W),y:clamp(world.y-H*.5,0,nav.height-H)};const p=api.player();p.x=world.x-camera.x;p.y=world.y-camera.y;}
 function reset(){resetBurner();legacy.reset();active=true;initialized=false;camera={x:0,y:0};world={x:nav.start[0],y:nav.start[1]};safe={...world};facing=1;boarding=boardAge=elapsed=step=0;carry=null;pending=false;legacyScroll=3630;duel=null;duelAge=downAge=duelPasses=0;duelBudget=3;completed=false;boardSwitched=false;for(const p of plans){p.dead=false;p.hp=p.id===9?10:3;}}
 function tick(t,dt){if(!initialized)initialize(t);if(!active){if(completed)return;if(duel){duelAge+=dt;duelBudget=Math.min(3,duelBudget+6*dt);if(duel.hp<=0){downAge+=dt;if(downAge>=2.6){completed=true;api.setBoss(null);api.complete();}}return;}boardAge+=dt;legacyScroll=Math.min(90,33+boardAge)*110;legacy.update(33+boardAge,dt);return;}
  elapsed+=dt;const p=api.player();if(p.dying>0)return;
  if(burnerPhase!=='ready'){burnerTime=Math.max(0,burnerTime-dt);if(burnerTime<.000001){if(burnerPhase==='active'){burnerPhase='recharge';burnerTime=2;}else{burnerPhase='ready';burnerTime=8;}}}
  if(burnerPhase==='active'){fallVelocity=fallStep=0;grounded=false;}else{fallVelocity=Math.min(280,fallVelocity+480*dt);fallStep=fallVelocity*dt;}

  if(Math.hypot(world.x-nav.goal[0],world.y-nav.goal[1])<90){boarding=.001;api.clearThreats();api.freezeBoarding?.();return;}
  // Only nearby fixed guards exist as live actors. Each plan pays its reward once.
  for(const plan of plans){if(plan.dead)continue;const q=nearest(plan.wx,plan.wy);plan.wx=q.x;plan.wy=q.y;const e=api.enemies().find(e=>e.humanPlan===plan.id&&e.hp>0);if(!e&&Math.abs(plan.wx-camera.x-W/2)<W*.65&&Math.abs(plan.wy-camera.y-H/2)<H*.7){api.add({type:'zaku',stage4Kind:'humanGuard',humanPlan:plan.id,commander:plan.id===9,launcher:plan.id%3===1,red:plan.id!==9&&plan.id%3===0,hp:plan.hp,max:plan.hp,size:60,age:0,shot:2.5,wx:plan.wx,wy:plan.wy,x:plan.wx-camera.x,y:plan.wy-camera.y});}}
 }
 function constrain(body){if(duel){const x=body.x,y=body.y;body.x=clamp(body.x,45,W-45);body.y=clamp(body.y,95,H-55);if(x!==body.x||y!==body.y)api.stopTarget(body);return;}if(!active)return legacy.constrain(body);if(!initialized)return;let desired={x:body.x+camera.x,y:body.y+camera.y};if(body!==api.player()){const q=nearest(desired.x,desired.y);body.x=q.x-camera.x;body.y=q.y-camera.y;return;}
  // Gravity changes only exploration; active burner preserves the approved movement delta.
  if(burnerPhase!=='active'){desired.y=safe.y+fallStep;fallStep=0;api.clearHumanVerticalTarget?.();}
  // Swept axis resolution prevents high SPEED tunnelling and permits sliding along rock.
  let pos={...safe};if(Math.hypot(desired.x-pos.x,desired.y-pos.y)>150){desired={...safe};}
  const dx=desired.x-pos.x,dy=desired.y-pos.y,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));if(Math.abs(dx)>.1)facing=Math.sign(dx);
  for(let i=0;i<n;i++){if(pass(pos.x+dx/n,pos.y))pos.x+=dx/n;if(pass(pos.x,pos.y+dy/n))pos.y+=dy/n;}
  if(burnerPhase!=='active'){grounded=!pass(pos.x,pos.y+2);if(grounded)fallVelocity=0;walkDistance+=Math.abs(pos.x-safe.x);}world=pos;safe={...pos};let next={x:clamp(pos.x-W*.42,0,nav.width-W),y:clamp(pos.y-H*.5,0,nav.height-H)};const sx=next.x-camera.x,sy=next.y-camera.y;camera=next;if(sx||sy)api.shiftHuman?.(sx,sy);body.x=pos.x-camera.x;body.y=pos.y-camera.y;if(Math.hypot(pos.x-desired.x,pos.y-desired.y)>1)api.stopTarget(body);
  let best=Infinity;for(let i=0;i<nav.route.length;i++){const d=(nav.route[i][0]-pos.x)**2+(nav.route[i][1]-pos.y)**2;if(d<best){best=d;step=i;}}
 }
 function drawCover(x,y,index=0,width=84){const key='supplyCargo'+(index%2?3:0);if(images[key])sprite(key,x,y,width);}
 function drawPerson(key,x,y,height=25,face=1,alpha=1){if(/Electric(Up|Down)$/.test(key)){api.drawVertical(key,x,y,height,alpha,face);return;}const a=images[key];if(!a)return;ctx.save();ctx.translate(x,y);ctx.scale(face,1);ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(a.im,a.sx,a.sy,a.sw,a.sh,-height*a.sw/a.sh/2,-height/2,height*a.sw/a.sh,height);ctx.restore();}
 function pose(kind){const p=api.player();return 'human'+kind+(p.melee?(p.melee.javelin?(p.melee.axis==='y'?'Electric'+(p.melee.direction<0?'Up':'Down'):'Electric'):'Baton'):p.backBoost>0?'Move':p.missile&&!p.laser?'Bazooka':p.laser?'Rifle':'Pistol');}
 function drawPlayer(alpha){if(!active)return false;const p=api.player(),q=boarding>0?clamp(boarding/1.2,0,1):0,x=p.x+(nav.goal[0]-camera.x-p.x)*q,y=p.y+(nav.goal[1]-camera.y-50-p.y)*q;if(!p.melee&&q===0&&(burnerPhase==='active'||grounded)&&drawLocomotion((burnerPhase==='active'?'humanAmuroBurner':'humanAmuroWalk')+(Math.floor(burnerPhase==='active'?elapsed*10:walkDistance/8)%4),x,y,alpha))return true;drawPerson(pose('Amuro'),x,y,60-q*24,p.melee&&p.melee.axis!=='y'?(p.melee.direction||facing):facing,alpha*(1-q*.8));return true;}
 function drawOption(i,x,y){if(!active)return false;drawPerson(pose(i%2?'White':'Orange'),x,y,56,facing);return true;}
 function drawHammer(point){if(!active)return false;sprite('humanHaro',point.x,point.y,38);return true;}
 function backdrop(){if(duel){drawSpace();return;}if(!active){legacy.drawBackdrop();if(boardAge<4){ctx.fillStyle='#061826ed';ctx.fillRect(180,H-202,W-360,46);label('ガンダム搭乗 — 装備・強化を継承',W/2,H-174,20);}return;}
 const a=images.humanMaze;if(a)ctx.drawImage(a.im,0,0,a.sw,a.sh,-camera.x,-camera.y,nav.width,nav.height);
 const bs=burnerStatus(),recover=bs.phase==='recharge',ratio=recover?1-bs.remaining/bs.total:bs.remaining/bs.total;
 ctx.fillStyle='#031321df';ctx.fillRect(18,57,252,47);ctx.fillStyle=recover?'#ffcf70':'#75edff';ctx.font='bold 13px monospace';ctx.fillText(recover?'VERNIER / 回復中':bs.phase==='active'?'VERNIER / 噴射中':'VERNIER / Bで噴射',28,74);ctx.fillStyle='#263d4c';ctx.fillRect(28,83,230,9);ctx.fillStyle=recover?'#ffcf70':'#75edff';ctx.fillRect(28,83,230*clamp(ratio,0,1),9);
 for(const plan of plans)if(plan.dead)drawCover(plan.wx-camera.x,plan.wy+18-camera.y,plan.id);
 const gx=nav.goal[0]-camera.x,gy=nav.goal[1]-camera.y;if(gx>-220&&gx<W+220&&gy>-220&&gy<H+220){sprite('gundamUnarmed',gx,gy,230);label('GUNDAM / 接近して搭乗',gx,gy-155,19);}
 ctx.fillStyle='#031321db';ctx.fillRect(W-155,18,135,205);if(a)ctx.drawImage(a.im,0,0,a.sw,a.sh,W-150,22,124,186);ctx.fillStyle='#83f7cf';ctx.fillRect(W-150+world.x/nav.width*124-2,22+world.y/nav.height*186-2,5,5);ctx.fillStyle='#ffce72';ctx.fillRect(W-150+nav.goal[0]/nav.width*124-3,22+nav.goal[1]/nav.height*186-3,6,6);
 label(boarding>0?'ガンダムに搭乗中':'アムロ / ルナ2内部を探索',W/2,100,20);const next=nav.route[Math.min(nav.route.length-1,step+12)],dx=next[0]-world.x,dy=next[1]-world.y;label('進路 '+(Math.abs(dx)>Math.abs(dy)?dx>0?'→':'←':dy>0?'↓':'↑')+'  / 緑:自機・黄:搭乗地点',W/2,126,15);
 }
 function label(s,x,y,size){ctx.save();ctx.fillStyle='#e5effa';ctx.font='bold '+size+'px sans-serif';ctx.textAlign='center';ctx.fillText(s,x,y);ctx.restore();}
 function warnDuel(e,turn=false){e.mode=turn?'turnWindup':'windup';e.timer=turn?.72:.68;e.target={x:api.player().x,y:api.player().y};e.hitThisPass=false;e.vx=e.vy=0;}
 function updateDuel(e,dt){e.age+=dt;if(e.hp<=0)return true;e.timer-=dt;
  if(e.mode==='approach'){const p=api.player(),goal={x:clamp(p.x+330,650,W-130),y:clamp(p.y+(e.cycles%2?-120:120),145,H-120)},dx=goal.x-e.x,dy=goal.y-e.y,d=Math.hypot(dx,dy),v=Math.min(265,d/Math.max(dt,.001));e.vx=dx/(d||1)*v;e.vy=dy/(d||1)*v;e.x+=e.vx*dt;e.y+=e.vy*dt;if(d<22||e.timer<=0){e.cycles++;e.rounds=0;warnDuel(e);}}
  else if(e.mode==='windup'||e.mode==='turnWindup'){if(e.timer<=0){e.angle=Math.atan2(e.target.y-e.y,e.target.x-e.x);e.mode='dash';e.timer=.52;duelPasses++;}}
  else if(e.mode==='dash'){const speed=220+540*clamp((.52-e.timer)/.12,0,1);e.vx=Math.cos(e.angle)*speed;e.vy=Math.sin(e.angle)*speed;const n=Math.max(1,Math.ceil(speed*dt/8));for(let i=0;i<n;i++){e.x+=e.vx*dt/n;e.y+=e.vy*dt/n;if(!e.hitThisPass&&Math.hypot(e.x-api.player().x,e.y-api.player().y)<28+api.hitRadius()){api.hit(25,1);e.hitThisPass=true;}}if(e.timer<=0||e.x<35||e.x>W-35||e.y<90||e.y>H-50){e.mode='recover';e.timer=.95;e.vx=e.vy=0;e.x=clamp(e.x,35,W-35);e.y=clamp(e.y,105,H-65);}}
  else if(e.mode==='recover'){if(e.timer<=0){if(e.cycles%3===0&&!e.rounds){e.rounds=1;warnDuel(e,true);}else{e.mode='leave';e.timer=1.8;e.exitY=e.y<H/2?H-140:140;}}}
  else if(e.mode==='leave'){const dx=W-100-e.x,dy=e.exitY-e.y,d=Math.hypot(dx,dy),v=Math.min(510,d/Math.max(dt,.001));e.vx=dx/(d||1)*v;e.vy=dy/(d||1)*v;e.x+=e.vx*dt;e.y+=e.vy*dt;if(d<15||e.timer<=0){e.mode='wait';e.timer=.65;e.vx=e.vy=0;}}
  else if(e.mode==='wait'&&e.timer<=0){e.mode='approach';e.timer=1.5;}
  return true;
 }
 function drawSpace(){ctx.save();ctx.fillStyle='#020b19';ctx.fillRect(0,0,W,H);for(let i=0;i<86;i++){ctx.fillStyle=i%5?'#42647a':'#b3d3e3';ctx.fillRect((i*173-duelAge*(4+i%4)+W*100)%W,(i*97)%H,i%5?1.5:2.5,i%5?1.5:2.5);}sprite('lunaTwo',160-duelAge*1.4,180,320,.3);label('ルナ2外宙域 / シャアザクと一騎打ち',W/2,112,19);if(duelAge<4)label('ホワイトベースは先行 — シャアを迎撃',W/2,H-80,18);if(duel.hp<=0){sprite('duelCharMove',duel.x,duel.y+downAge*60,100,Math.max(0,1-downAge/2.5));label('シャアザク撃破 — 脱出成功',W/2,210,25);}ctx.restore();}
 function drawDuelPose(key,x,y,flip=false,alpha=1){const a=images[key];if(!a)return;const scale=72/(a.bodyHeight||a.sh);ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(a.im,a.sx,a.sy,a.sw,a.sh,(a.sx-(a.bodyX??a.sx+a.sw/2))*scale,36+(a.sy-(a.bodyBottom??a.sy+a.sh))*scale,a.sw*scale,a.sh*scale);ctx.restore();}
 function drawDuel(){if(!duel||duel.hp<=0)return;const warning=['windup','turnWindup'].includes(duel.mode);ctx.save();if(warning&&duel.target){ctx.setLineDash([8,10]);ctx.strokeStyle='#ffd396aa';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(duel.x,duel.y);ctx.lineTo(duel.target.x,duel.target.y);ctx.stroke();ctx.setLineDash([]);label(duel.mode==='turnWindup'?'折り返し斬撃':'ヒートホーク予告',duel.x,duel.y-65,16);}drawDuelPose(duel.mode==='dash'?'duelCharSlash':warning?'duelCharReady':'duelCharMove',duel.x,duel.y,(duel.mode==='dash'?duel.vx:api.player().x-duel.x)>0);ctx.restore();}
 function drawDuelBar(){if(!duel||completed)return;ctx.save();ctx.fillStyle='#07182de8';ctx.fillRect(300,18,600,62);label('CHAR ZAKU / HEAT HAWK',W/2,42,19);ctx.fillStyle='#334654';ctx.fillRect(410,58,380,8);ctx.fillStyle='#ff9b89';ctx.fillRect(410,58,380*Math.max(0,duel.hp)/duel.max,8);ctx.restore();}
 function updateEnemy(e,dt){if(e.stage4Kind==='duelChar')return updateDuel(e,dt);if(e.stage4Kind!=='humanGuard')return active?false:legacy.updateEnemy(e,dt);e.age+=dt;const plan=plans[e.humanPlan],wave=e.age%5.5;plan.hp=e.hp;e.aiming=wave>=1.4&&wave<2.1;const wantsHide=wave<1.4,side=api.player().x<plan.wx-camera.x?-1:1;const choices=[{x:plan.wx+side*64,y:plan.wy},{x:plan.wx-side*64,y:plan.wy},{x:plan.wx,y:plan.wy-48}];const peek=choices.find(p=>pass(p.x,p.y))||{x:plan.wx,y:plan.wy};const target=wantsHide?{x:plan.wx,y:plan.wy}:peek,dx=target.x-e.wx,dy=target.y-e.wy,d=Math.hypot(dx,dy),step=Math.min(d,160*dt);if(d){e.wx+=dx/d*step;e.wy+=dy/d*step;}e.coverX=plan.wx-camera.x;e.coverY=plan.wy+18-camera.y;e.hidden=wantsHide&&Math.hypot(e.wx-plan.wx,e.wy-plan.wy)<18;e.coverPeeking=Math.hypot(e.wx-plan.wx,e.wy-plan.wy)>=38;e.x=e.wx-camera.x;e.y=e.wy-camera.y;e.face=api.player().x<e.x?-1:1;e.shot-=dt;
 if(!e.hidden&&!e.aiming&&e.coverPeeking&&e.shot<=0&&e.x>20&&e.x<W-20&&e.y>30&&e.y<H-30){e.shot=e.commander?3.1:4.5;if(e.launcher){const a=Math.atan2(api.player().y-e.y,api.player().x-e.x);api.addBullet({x:e.x+e.face*13,y:e.y,vx:Math.cos(a)*125,vy:Math.sin(a)*125,r:5,type:'missile'});}else api.fire(e.x+e.face*13,e.y,145);}if(Math.hypot(api.player().x-e.x,api.player().y-e.y)<35&&!e.hidden)api.hit(15,1);return true;}
 function drawEnemy(e){if(e.stage4Kind==='duelChar'){drawDuel();return true;}if(!active&&e.stage4Kind==='soldier'){ctx.save();ctx.translate(e.x,e.y);if(e.top)ctx.scale(1,-1);drawPerson('humanZeon'+(e.launcher?'Bazooka':'Rifle')+(e.aiming?'Ready':e.hidden?'Move':'Fire'),0,0,30,e.facing===1?-1:1);drawCover(0,16,e.launcher?1:0,54);ctx.restore();if(e.red)label('P',e.x,e.y-28,12);return true;}if(e.stage4Kind!=='humanGuard')return active?false:legacy.drawEnemy(e);const key=e.commander?'humanChar'+(e.launcher?'Bazooka':'Rifle'):'humanZeon'+(e.launcher?'Bazooka':'Rifle')+(e.aiming?'Ready':e.hidden?'Move':e.shot>3.8?'Fire':'Move');drawPerson(key,e.x,e.y,60,e.face===1?-1:1);drawCover(e.coverX??e.x,e.coverY??e.y+18,e.humanPlan);if(e.aiming)label('!',e.x,e.y-38,18);if(e.red&&!e.hidden)label('P',e.x,e.y-40,12);return true;}
 function damage(e,n,source){if(e.stage4Kind==='duelChar'){if(e.hp<=0)return 0;const d=Math.min(e.hp,duelBudget,n*(e.mode==='dash'?.4:1));duelBudget-=d;return d;}if(e.stage4Kind!=='humanGuard')return active?n:legacy.filterDamage(e,n,source);if(e.hidden&&!(source?.r>=50))return 0;return n;}
 function killed(e){if(e.stage4Kind==='duelChar'){if(!e.paid){e.paid=true;api.score(2400);api.material(e.x,e.y,3,3);api.explode(e.x,e.y,'#ffc199',35);}return true;}if(e.stage4Kind!=='humanGuard')return active?false:legacy.onKilled(e);if(e.paid)return true;e.paid=true;plans[e.humanPlan].dead=true;api.score(e.commander?600:150);api.explode(e.x,e.y,'#e6bd84',8,'silent');if(e.red)api.capsule(e.x,e.y);else api.material(e.x,e.y,1,1);return true;}
 function intercept(s){if(duel){s.hitTargets ||= new Set();if(duel.hp>0&&!s.hitTargets.has(duel)&&Math.abs(s.x-duel.x)<s.w/2+27&&Math.abs(s.y-duel.y)<s.h/2+28){if(['bazooka','cannon'].includes(s.kind)){api.detonate(s);return true;}api.damage(duel,s.damage,{x:s.x,y:s.y,r:Math.max(s.w,s.h)/2});s.hitTargets.add(duel);if(s.kind!=='laser'){s.life=0;return true;}}return false;}if(!active)return legacy.interceptShot(s);if(!shotPass(s.x+camera.x,s.y+camera.y)){if(['bazooka','cannon'].includes(s.kind))api.detonate(s);else s.life=0;return true;}s.hitTargets ||= new Set();for(const e of api.enemies()){if(e.stage4Kind!=='humanGuard'||e.hp<=0||s.hitTargets.has(e))continue;if(Math.abs(s.x-e.x)>s.w/2+24||Math.abs(s.y-e.y)>s.h/2+24)continue;if(['bazooka','cannon'].includes(s.kind)){api.detonate(s);return true;}api.damage(e,s.damage,{x:s.x,y:s.y,r:Math.max(s.w,s.h)/2});s.hitTargets.add(e);if(s.kind!=='laser'){s.life=0;return true;}}return false;}
 function snapshot(){const old=legacy.snapshot();return {...old,version:'S4.4b',completed,duelAge,duelPasses,duelBudget,duel:duel?{x:duel.x,y:duel.y,hp:duel.hp,max:duel.max,mode:duel.mode,timer:duel.timer,target:duel.target,vx:duel.vx,vy:duel.vy,downAge}:null,human:active,burner:burnerStatus(),pending,world:{...world},camera:{...camera},boarding,boardSwitched,boardAge,carry,progress:step/(nav.route.length-1),routeStep:step,goal:nav.goal,start:nav.start,facing,maze:{width:nav.width,height:nav.height,cell:nav.cell},guards:api.enemies().filter(e=>e.stage4Kind==='humanGuard').map(e=>({id:e.humanPlan,x:e.x,y:e.y,wx:e.wx,wy:e.wy,hidden:e.hidden,hp:e.hp,red:e.red,commander:e.commander})),harborRects:duel?[]:old.harborRects,scene:active?'human-maze':duel?completed?'stage-complete':duel.hp<=0?'duel-victory':'char-duel':old.failed?'escape-failed':old.phase===3?'departure':old.started?'magellan-blockade':33+boardAge>=80?'dock-exit':'gundam-scroll'};}
 return {...legacy,meleeLineClear:(a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/8));for(let i=0;i<=n;i++)if(!shotPass(a.x+(b.x-a.x)*i/n+camera.x,a.y+(b.y-a.y)*i/n+camera.y))return false;return true;},reset,activateBurner,burnerStatus,update:tick,advanceBoarding,drawOverlay:drawFade,constrain,drawBackdrop:backdrop,drawEnemy,updateEnemy,filterDamage:damage,onKilled:killed,interceptShot:intercept,drawPlayer,drawHumanOption:drawOption,drawHumanHammer:drawHammer,snapshot,boundary:(wx,top)=>(active||duel)?(top?0:H):legacy.boundary(wx,top),drawBoss:()=>{if(duel)drawDuelBar();else if(!active)legacy.drawBoss();},get inBoarding(){return boarding>0;},get humanActive(){return active;},get facing(){return facing;},get pending(){return pending;},get routeScroll(){return active?0:legacyScroll;},get harborActive(){return (active||duel)?false:legacy.harborActive;},get zone(){return active?'アムロ潜入 / 搭乗地点へ':duel?'ルナ2外 / シャアザク決闘':legacy.zone;},restoreHuman:()=>{if(active){resetBurner();const p=api.player();p.x=safe.x-camera.x;p.y=safe.y-camera.y;api.stopTarget(p);}},blocksEnemyBullet:b=>{if(active)return !shotPass(b.x+camera.x,b.y+camera.y);if(duel)return false;return b.y<=legacy.boundary(legacyScroll+b.x,true)||b.y>=legacy.boundary(legacyScroll+b.x,false)||legacy.snapshot().harborRects.some(r=>r.kind==='platform'&&b.x>r.x+12&&b.x<r.x+r.w-12&&b.y>r.y+8&&b.y<r.y+r.h-8);},passable:pass};
};})();
