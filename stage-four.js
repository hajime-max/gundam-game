/* S4.3: illustrated harbor entry/interior, registered soldier frames and Magellan blockade. */
'use strict';
window.createStageFour=function(api){
 const {W,H,ctx,images,sprite}=api;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 let clock=0,mineWave=0,rockWave=0,zakuWave=0,started=false,phase=0,escape=0,finished=false;
 const BOSS_SECONDS=75,HULL_HP=64,HULL_DAMAGE_RATE=6;
 const MAGELLAN_WIDTH=470*1.17;
 const BLOCKADE_X=885,BLOCKADE_ANGLE=-1.06,CHAR_DIALOGUE_AT=2.3,CHAR_DIALOGUE_LENGTH=39;
 const DEMOLITION_AUDIO_AT=5,DEMOLITION_START=5.15,REACTION_AT=8.45,BOAT_LAUNCH=11.3;
 const MAGELLAN_FADE=.28,MAIN_GUN_AT=35.44,MAIN_GUN_TRAVEL=.24;
 const MAIN_GUN_IMPACT_AT=MAIN_GUN_AT+MAIN_GUN_TRAVEL;
 const demolitionCharges=[
  {offset:-165,side:-1,place:2.4,blast:DEMOLITION_START,char:true},
  {offset:-90,side:1,place:2.75,blast:DEMOLITION_START+.30},
  {offset:65,side:-1,place:3.25,blast:DEMOLITION_START+.63},
  {offset:155,side:1,place:3.65,blast:DEMOLITION_START+.95}
 ];
 let blockadeIntro=null,magellanFinisher=null;
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
   if(strike&&!e.hitThisPass){const p=api.player(),dx=e.x-a.x,dy=e.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);if(Math.hypot(p.x-a.x-dx*t,p.y-a.y-dy*t)<24+api.hitRadius()){api.hit(35,2);e.hitThisPass=true;}}
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
  const e=entity('soldier',W+70,0,3,26,{route,wx:route?route.wx+route.w/2:offset()+W+70,
   top:index%2===1,red:index%3===0,launcher:true,shotCycle:-1,burstLeft:0});
  e.routeOrigin=e.wx;placeSoldier(e);return e;
 }
 function placeSoldier(e){const wave=e.age%6.4;e.hidden=false;e.aiming=wave>=2&&wave<2.7;
  e.wx=e.routeOrigin+Math.sin(e.age*.8)*68;e.x=e.wx-offset();e.facing=api.player().x<e.x?-1:1;const protrude=e.hidden?-6:17;
  if(e.route)e.y=e.route.y+(e.top?e.route.h+protrude:-protrude);
  else e.y=boundary(e.wx,e.top)+(e.top?protrude:-protrude);e.surfaceY=e.route?e.route.y+(e.top?e.route.h:0):boundary(e.wx,e.top);e.gunX=e.x+e.facing*24;e.gunY=e.y+(e.top?3:-3);
 }
 function updateSoldier(e,dt){placeSoldier(e);const cycle=Math.floor(e.age/6.4),wave=e.age%6.4;
  if(entryQuiet()||hawkBusy()||wave<2.7||wave>=4.7||e.x<=35||e.x>=W-30)return true;
 if(e.shotCycle!==cycle){e.shotCycle=cycle;e.burstLeft=started?5:3;e.burstClock=0;}
  e.burstClock-=dt;
  if(e.burstLeft>0&&e.burstClock<=0){
   const a=Math.atan2(api.player().y-e.gunY,api.player().x-e.gunX);
   api.addBullet({x:e.gunX,y:e.gunY,vx:Math.cos(a)*185,vy:Math.sin(a)*185,
    angle:a,r:5,type:'missile',gattleHoming:true,age:0,trail:[]});
   e.burstLeft--;e.burstClock=started?.25:.32;
  }
  return true;
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
 function reset(){blockadeIntro=magellanFinisher=null;clock=mineWave=rockWave=zakuWave=phase=escape=soldierWave=platformPatrolWave=bossAge=bossZakuWave=bossSoldierWave=0;started=finished=failed=suitIntroduced=hawkIntroduced=false;hawk=shipBoss=null;entryCleared=false;hullParts=[];remaining=BOSS_SECONDS;damageBudget=4;notice='';noticeUntil=0;}
 function entity(kind,x,y,hp,size,extra={}){const e={type:'zaku',stage4Kind:kind,x,y,hp,max:hp,size,age:0,shot:2,base:y,phase:0,noReward:started,...extra};api.add(e);return e;}
 function mine(x,y,extra={}){return entity('mine',x,y,3,42,{vx:-82,armed:0,burst:false,...extra});}
 function rock(x,y,extra={}){return entity('debris',x,y,8,60,{vx:-100,vy:0,radius:32,warning:1.3,seed:rockWave%6,...extra});}
 function zaku(x,y,extra={}){return entity('zaku',x,y,4,65,{vx:-112,shot:2.5,...extra});}
 function zakuFormation(x,y,extra={}){
  for(const wing of [0,-1,1]){
   zaku(x+Math.abs(wing)*76,y+wing*62,{...extra,red:!!extra.red&&wing===0});
  }
 }
 function blockadeIntroPose(age){
  const tilt=clamp((age-DEMOLITION_START)/3.25,0,1);
  const entry=clamp(age/CHAR_DIALOGUE_AT,0,1);
  const crossing=clamp((age-CHAR_DIALOGUE_AT)/(DEMOLITION_START-CHAR_DIALOGUE_AT),0,1);
  return {x:age<CHAR_DIALOGUE_AT?-MAGELLAN_WIDTH/2-15+(W/2+MAGELLAN_WIDTH/2+15)*entry:
   W/2+(BLOCKADE_X-W/2)*crossing,y:floorY()/2,angle:BLOCKADE_ANGLE*tilt*tilt*(3-2*tilt)};
 }
 function chargePosition(charge,pose){
  const y=charge.side*60,cos=Math.cos(pose.angle),sin=Math.sin(pose.angle);
  return {x:pose.x+charge.offset*cos-y*sin,y:pose.y+charge.offset*sin+y*cos};
 }
 function evacuationBoat(age){
  const elapsed=Math.max(0,age-BOAT_LAUNCH);
  return {x:BLOCKADE_X-35-234*elapsed-18*elapsed*elapsed,y:floorY()/2-12-Math.min(55,elapsed*17)};
 }
 function beginBlockadeIntro(){
  blockadeIntro={age:0,fadeRemaining:api.magellanAudioEnabled?.()?MAGELLAN_FADE:0,awaitingSortieVoice:false,charDialogueStarted:false,charDialoguePlaying:false,charDialogueAge:0};
  api.clearThreats();api.freezeBoarding?.();
 }
 function updateBlockadeIntro(dt){
  if(blockadeIntro.fadeRemaining>0){
   blockadeIntro.fadeRemaining-=dt;
   if(blockadeIntro.fadeRemaining<=0)blockadeIntro.awaitingSortieVoice=!!api.playMagellanSortieVoice();
   return;
  }
  if(blockadeIntro.awaitingSortieVoice){
   if(!api.magellanSortieVoiceFinished(blockadeIntro,dt)){
    blockadeIntro.age=Math.min(CHAR_DIALOGUE_AT-.001,blockadeIntro.age+dt*CHAR_DIALOGUE_AT/(api.magellanSortieDuration||12.14));
    return;
   }
   blockadeIntro.awaitingSortieVoice=false;
  }
  if(blockadeIntro.charDialoguePlaying){
   const position=api.magellanCharDialogueTime(blockadeIntro,dt);
   if(position===null||position>=CHAR_DIALOGUE_LENGTH){
    blockadeIntro.charDialoguePlaying=false;
    blockadeIntro.age=DEMOLITION_AUDIO_AT-.001;
   }else{
    blockadeIntro.charDialogueAge=Math.max(blockadeIntro.charDialogueAge,position);
    blockadeIntro.age=CHAR_DIALOGUE_AT+(DEMOLITION_AUDIO_AT-.001-CHAR_DIALOGUE_AT)*blockadeIntro.charDialogueAge/CHAR_DIALOGUE_LENGTH;
   }
   return;
  }
  const before=blockadeIntro.age;
  if(!blockadeIntro.charDialogueStarted&&before+dt>=CHAR_DIALOGUE_AT){
   blockadeIntro.charDialogueStarted=true;
   if(api.playMagellanCharDialogue?.()){
    blockadeIntro.age=CHAR_DIALOGUE_AT;
    blockadeIntro.charDialoguePlaying=true;
    return;
   }
  }
  if(before<DEMOLITION_AUDIO_AT&&before+dt>=DEMOLITION_AUDIO_AT&&api.playMagellanDemolition?.()){
   blockadeIntro.age=DEMOLITION_AUDIO_AT;
   blockadeIntro.syncAudio=true;
   return;
  }
  const audioTime=blockadeIntro.syncAudio?api.magellanDemolitionTime(blockadeIntro,dt):null;
  if(audioTime===null)blockadeIntro.syncAudio=false;
  blockadeIntro.age=audioTime===null?before+dt:Math.max(before,DEMOLITION_AUDIO_AT+audioTime);
  if(before<REACTION_AT&&blockadeIntro.age>=REACTION_AT){
   blockadeIntro.syncAudio=false;
   api.playMagellanReaction?.();
  }
  for(const charge of demolitionCharges){
   if(before>=charge.blast||blockadeIntro.age<charge.blast)continue;
   const p=chargePosition(charge,blockadeIntroPose(charge.blast));
   api.explode(p.x,p.y,'#ffbd80',charge.char?48:28,charge.char&&audioTime===null?'ship':'silent');
  }
  if(evacuationBoat(blockadeIntro.age).x<-72){
   blockadeIntro=null;
   api.freezeBoarding?.();
   beginBoss();
  }
 }
 function beginBoss(){started=true;phase=0;bossAge=bossZakuWave=bossSoldierWave=0;remaining=BOSS_SECONDS;damageBudget=4;hawkIntroduced=false;hawk=null;api.clearThreats();
  hullParts=[{name:'船首',x:BLOCKADE_X+106,y:175,size:124},{name:'船体',x:BLOCKADE_X+20,y:floorY()/2+12,size:150},{name:'機関部',x:BLOCKADE_X-70,y:floorY()-150,size:140}].map((p,i)=>entity('magellanHull',p.x,p.y,HULL_HP,p.size,{index:i,name:p.name,brokenAt:null,flash:0}));
  shipBoss={kind:'magellanBlockade',x:BLOCKADE_X,y:floorY()/2,hp:HULL_HP*3,max:HULL_HP*3,turrets:[],guards:[],units:hullParts};api.setBoss(shipBoss);say('総員退艦確認済み — マゼラン全船体を破壊して脱出！',6);
 }
 function finishMagellan(){
  phase=3;escape=0;magellanFinisher=null;api.score(2000);api.material(BLOCKADE_X,330,3,3);
  say('マゼラン粉砕 — ホワイトベース脱出！',8);
 }
 function updateMagellanFinisher(dt){
  const scene=magellanFinisher;
  if(scene.phase==='fade'){
   scene.age+=dt;
   if(scene.age<MAGELLAN_FADE)return;
   scene.phase='order';scene.age=0;scene.synced=!!api.playMagellanFinisher('order');
   return;
  }
  const position=scene.synced?api.magellanFinisherTime(scene,dt,scene.phase):null;
  if(position===null)scene.synced=false;
  scene.age=position===null?scene.age+dt:Math.max(scene.age,position);
  if(scene.phase==='fire'&&scene.age>=MAIN_GUN_IMPACT_AT&&!scene.shattered){
   scene.shattered=true;
   for(const [x,y] of [[-96,140],[-48,70],[0,0],[48,-70],[96,-140]]){
    api.explode(BLOCKADE_X+x,floorY()/2+y,'#ffdcaa',60,'silent');
   }
  }
  if(scene.age<api.magellanFinisherDuration(scene.phase))return;
  if(scene.phase==='order'){
   scene.phase='fire';scene.age=0;scene.synced=!!api.playMagellanFinisher('fire');
  }else finishMagellan();
 }
 function updateBlockade(dt){bossAge+=dt;
  if(phase===3){escape+=dt;if(escape>=8){finished=true;api.complete();}return;}
  if(magellanFinisher){updateMagellanFinisher(dt);return;}
  if(shipBoss.hp<=0){
   api.clearThreats();
   if(api.playMagellanFinisher)magellanFinisher={phase:'fade',age:0,shattered:false};
   else finishMagellan();
   return;
  }
  remaining=Math.max(0,remaining-dt);if(remaining===0){failed=finished=true;say('時間切れ — 脱出失敗',8);api.fail?.('制限時間切れ。第4面に再出撃して脱出路を開こう。');return;}
  damageBudget=Math.min(4,damageBudget+HULL_DAMAGE_RATE*dt);for(const p of hullParts)p.flash=Math.max(0,p.flash-dt);
  if(bossAge>=1+bossZakuWave*6.5){
   const activeZaku=api.enemies().filter(e=>e.blockadeAttack&&e.hp>0&&e.x>0).length;
   if(activeZaku<=2){
    const lane=[220,440,330][bossZakuWave%3],wing=bossZakuWave%2?1:-1;
    zaku(W+45,lane,{vx:-120,shot:.25,blockadeAttack:true});
    zaku(W+121,lane+wing*62,{vx:-120,shot:.25,blockadeAttack:true});
   }
   bossZakuWave++;
  }
  if(bossAge>=1.5+bossSoldierWave*7){const e=spawnSoldier(100+bossSoldierWave);e.route=null;e.routeOrigin=offset()+[800,1030,910][bossSoldierWave%3];e.top=bossSoldierWave%2===1;e.red=bossSoldierWave<2;e.bossCapsule=e.red;placeSoldier(e);bossSoldierWave++;}
 }
 function update(t,dt){clock=t;
  if(finished)return;
  if(blockadeIntro){updateBlockadeIntro(dt);return;}
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
   if(t>=13+zakuWave*8&&t<82){zakuFormation(W+60,[320,210,440,320][zakuWave%4],{red:true});zakuWave++;}
   if(t>=82&&t<86)say('港口へ接近 — 機雷・崩落・敵部隊に備えろ',.2);
   if(t>=90)beginBlockadeIntro();return;
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
   if(e.shot<=0&&e.x<W-40&&e.x>90){
    if(e.blockadeAttack){
     e.burstLeft=(e.burstLeft||3)-1;
     e.shot=e.burstLeft>0?.19:1.85;
     api.fire(e.x-22,e.y,245,2);
    }else if(!entryQuiet()&&!hawkBusy()){e.shot=5.5;api.fire(e.x-22,e.y,150);}
   }
   if(Math.hypot(api.player().x-e.x,api.player().y-e.y)<44&&!api.meleeSafe(e))api.hit();
  }return true;
 }
 function filterDamage(e,amount,source){if(!e.stage4Kind)return amount;if(e.hp<=0||failed)return 0;if(e.stage4Kind==='charSuit')return 0;if(e.stage4Kind==='charHawk'&&['dash','leave','wait','retire'].includes(e.mode))return 0;if(e.stage4Kind==='soldier'&&e.hidden&&!(source?.r>=60))return 0;if(e.stage4Kind==='magellanHull'){
   if(phase===3||magellanFinisher)return 0;
   const n=Math.max(0,Math.min(amount,shipBoss.hp,damageBudget));
   damageBudget-=n;shipBoss.hp-=n;if(n>0)e.flash=.12;
   return 0;
  }return amount;}
 function onKilled(e){if(!e.stage4Kind)return false;if(e.paid)return true;e.paid=true;
  if(e.stage4Kind==='charSuit')return true;
  if(e.stage4Kind==='charHawk'){
   api.explode(e.x,e.y,'#ffb099',22);
   api.score(1200);api.material(e.x,e.y,3,2);
   return true;
  }
  if(e.stage4Kind==='magellanHull')return true;
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
 function drawMagellanFrame(frame,whole,pose={x:BLOCKADE_X,y:floorY()/2,angle:BLOCKADE_ANGLE}){
  const scale=MAGELLAN_WIDTH/whole.sw;
  ctx.translate(pose.x,pose.y);
  ctx.rotate(pose.angle);
  ctx.scale(-1,1);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(frame.im,frame.sx,frame.sy,frame.sw,frame.sh,
   (frame.sx-whole.sx)*scale-MAGELLAN_WIDTH/2,-whole.sh*scale/2,
   frame.sw*scale,frame.sh*scale);
 }
 function drawBlockade(){
  const whole=images.magellanNormal;
  const finale=magellanFinisher;
  if(whole&&phase<3&&!finale?.shattered){
   ctx.save();
   if(hullParts.some(part=>part.flash>0)&&!finale)ctx.filter='brightness(1.45)';
   drawMagellanFrame(whole,whole);
   ctx.restore();
  }
  if(!finale)return;
  const shipX=clamp(finale.phase==='order'?-180+finale.age*70:270,-180,270);
  const gunY=floorY()/2;
  sprite('whiteBase',shipX,gunY+22,350);
  const blastAge=finale.phase==='fire'?finale.age-MAIN_GUN_AT:-1;
  if(blastAge>=0&&blastAge<MAIN_GUN_TRAVEL+.24){
   const muzzleX=shipX+130;
   const progress=clamp(blastAge/MAIN_GUN_TRAVEL,0,1);
   const headX=muzzleX+(BLOCKADE_X-muzzleX)*progress;
   const tailX=Math.max(muzzleX,headX-190);
   ctx.save();ctx.globalAlpha=1-clamp((blastAge-MAIN_GUN_TRAVEL)/.24,0,1);
   ctx.shadowColor='#ff974d';ctx.shadowBlur=28;
   line(tailX,gunY,headX,gunY,'#ffb15e',30);
   line(tailX,gunY,headX,gunY,'#fff4c5',10);
   ctx.restore();
  }
 }
 function drawEvacuationBoat(p,elapsed){
  if(!images.magellanEvacuationBoat)return;
  ctx.save();ctx.translate(p.x,p.y);
  ctx.fillStyle='#ed9a5e';
  for(const y of [-2,7]){
   ctx.beginPath();ctx.moveTo(23,y-3);
   ctx.lineTo(43+Math.sin(elapsed*42+y)*5,y);ctx.lineTo(23,y+3);ctx.fill();
  }
  ctx.scale(-1,1);
  sprite('magellanEvacuationBoat',0,0,60);
  ctx.restore();
 }
 function drawBlockadeIntro(){
  const age=blockadeIntro.age,pose=blockadeIntroPose(age),whole=images.magellanNormal;
  if(whole){
   ctx.save();
   if(age>=DEMOLITION_START&&age<DEMOLITION_START+.15)ctx.filter='brightness(1.55)';
   drawMagellanFrame(whole,whole,pose);
   ctx.restore();
  }
  for(const charge of demolitionCharges){
   const p=chargePosition(charge,pose);
   if(age<CHAR_DIALOGUE_AT)continue;
   const approach=clamp((age-charge.place+1.1)/1.1,0,1);
   const withdraw=clamp((age-charge.place-.16)/1.05,0,1);
   if(approach>0&&withdraw<1){
    const x=p.x+78*(1-approach)-38*withdraw;
    const y=p.y+charge.side*(132*(1-approach)+155*withdraw);
    const ready=Math.abs(age-charge.place)<.35;
    const key=charge.char?'humanCharRifle':ready?'humanZeonRifleReady':'humanZeonRifleMove';
    if(!ready){ctx.fillStyle='#7be1ff';ctx.fillRect(x+6,y+11,3,9+Math.sin(age*50)*3);}
    sprite(key,x,y,24);
    if(charge.char)text('シャア',x,y-23,12,'#ffd5cd','center');
   }
   if(age>=charge.place&&age<charge.blast){
    ctx.fillStyle='#303941';ctx.fillRect(p.x-9,p.y-5,18,10);
    ctx.fillStyle=Math.floor(age*7)%2?'#ff554e':'#ffc866';ctx.fillRect(p.x-3,p.y-2,6,4);
   }
  }
  if(age>=BOAT_LAUNCH-.25){
   const hatch=evacuationBoat(BOAT_LAUNCH);
   ctx.fillStyle='#192a34';ctx.fillRect(hatch.x-13,hatch.y-7,26,14);
   ctx.strokeStyle='#9bb8bd';ctx.strokeRect(hatch.x-13,hatch.y-7,26,14);
   if(age>=BOAT_LAUNCH)drawEvacuationBoat(evacuationBoat(age),age-BOAT_LAUNCH);
  }
  const message=age<demolitionCharges[0].place-1.45?'マゼランが進行中':
   age<DEMOLITION_START?'ジオン兵が進路の上下に爆弾を設置':
   age<BOAT_LAUNCH?'爆発でマゼランが傾き、出口を塞ぐ':'脱出艇が離脱中';
  text(message,W/2,138,19,'#f1d3ac','center');
 }
 function drawBackdrop(){ctx.save();const gradient=ctx.createLinearGradient(0,0,W,H);gradient.addColorStop(0,'#071c2c');gradient.addColorStop(1,'#040b19');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
  // Space recedes BEHIND the entrance; rock interior then covers the entire far field.
  for(let i=0;i<52;i++){const x=(i*193-clock*(7+i%3*4)+W*100)%W;ctx.fillStyle=i%4?'#41677a':'#b0d1d8';ctx.fillRect(x,(i*113)%H,2,2);}
  const p=clamp(clock/24,0,1),inside=clamp((clock-26)/6,0,1),exit=started?1:clamp((clock-80)/10,0,1);
  if(clock<30){const approach=clamp(clock/24,0,1);sprite('lunaTwo',1040-approach*360,200+approach*120,460+approach*1550,1);}
  if(inside>0){ctx.save();ctx.globalAlpha=inside;ctx.fillStyle='#101a23';ctx.fillRect(0,0,W*(1-exit),H);ctx.globalAlpha=inside*.45;for(let i=-1;i<8;i++){const x=i*240-(clock*25)%240;if(x>W*(1-exit))continue;ctx.fillStyle='#26353d';ctx.fillRect(x,0,18,H);line(x,100,x+170,H-120,'#34434c',7);}ctx.restore();}
  if(clock>=18&&clock<32){const q=clamp((clock-18)/14,0,1),w=600+q*2400,h=w*2/3;ctx.save();ctx.globalAlpha=clamp((clock-18)/2,0,1);drawArtRect('harborEntry',{x:W/2-w/2,y:H/2-h/2,w,h});ctx.restore();for(let i=0;i<4;i++){const x=260+i*210;ctx.fillStyle=clock%1<.65?'#f1c775':'#65563d';ctx.fillRect(x,135,10,4);ctx.fillRect(x,floorY()-135,10,4);}text(clock<24?'LUNA II — DOCK ENTRY':'ルナ2内部へ進入',W/2,145,20,'#e4d8b5','center');}
  api.drawDockBackground?.(ctx,clock);drawHarbor();
  if(blockadeIntro)drawBlockadeIntro();
  if(started){drawBlockade();if(phase<3){text('退艦済みマゼランが出口を封鎖',995,94,14,'#bdd6de','center');text(magellanFinisher?'ホワイトベース主砲射撃':'マゼランにダメージを与えろ',995,114,12,'#a9becb','center');}
   else{const x=-220+Math.max(0,escape-2)*270;sprite('whiteBase',x,340,350);text('マゼラン全破壊 — ホワイトベース脱出',W/2,165,24,'#a3f4e1','center');}}
  text('LUNA II / '+({approach:'APPROACH',entrance:'DOCK ENTRY',crossing:'ENTERING ROCK DOCK',interior:'INTERIOR DOCK',exit:'EXIT TO SPACE'}[scene()]),38,113,13,'#6e9eb6');
  // All decoration is drawn before enemies and bullets, never over their warning/attack layer.
  if(clock<noticeUntil){const noticeY=Math.min(H-110,floorY()-175);ctx.fillStyle='#071b2eea';ctx.fillRect(180,noticeY-27,W-360,42);text(notice,W/2,noticeY,18,'#d7f6ff','center');}ctx.restore();}

 function drawEnemy(e){if(!e.stage4Kind)return false;if(['charSuit','charHawk'].includes(e.stage4Kind)){drawCommander(e);return true;}if(e.stage4Kind==='soldier'){drawSoldier(e);return true;}ctx.save();
  if(e.stage4Kind==='zaku'){sprite('zaku',e.x,e.y,65);if(e.red){ctx.strokeStyle='#ffc66e';ctx.beginPath();ctx.arc(e.x,e.y,34,0,Math.PI*2);ctx.stroke();}}
  else if(e.stage4Kind==='mine'){const armed=e.triggered;ctx.translate(e.x,e.y);ctx.rotate(e.age*.45);if(armed&&Math.sin(e.age*22)>0)ctx.filter='brightness(1.8)';sprite('harborMine',0,0,54);ctx.filter='none';ctx.rotate(-e.age*.45);
   if(armed){ctx.setLineDash([6,8]);ctx.strokeStyle='#ffb96a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,100,0,Math.PI*2);ctx.stroke();text('退避',0,-112,13,'#ffcc91','center');}}
  else if(e.stage4Kind==='debris'){if(e.warning>0){ctx.setLineDash([10,12]);line(400,e.y,W,e.y,'#ffca6d88',2);text('崩落 →',1000,e.y-18,16,'#ffcf7f');}else{ctx.translate(e.x,e.y);ctx.rotate(e.age*.32);sprite('asteroidArt'+(e.seed%6),0,0,72);}}
  ctx.restore();return true;}
 function drawBoss(){if(!started||phase>=3||magellanFinisher)return;ctx.save();ctx.fillStyle='#071b2ef2';ctx.fillRect(270,18,660,60);text('マゼラン船体破壊  /  残り '+Math.ceil(remaining)+'秒',W/2,43,21,remaining<=15?'#ff8f79':'#f7dc9e','center');ctx.fillStyle='#334b5d';ctx.fillRect(410,58,380,8);ctx.fillStyle='#ffba84';ctx.fillRect(410,58,380*Math.max(0,shipBoss.hp)/shipBoss.max,8);ctx.restore();}
 function snapshot(){return {version:"S4.3",scene:scene(),blockadeIntro:blockadeIntro?{age:blockadeIntro.age,...blockadeIntroPose(blockadeIntro.age),boat:blockadeIntro.age>=BOAT_LAUNCH?evacuationBoat(blockadeIntro.age):null}:null,entryQuiet:entryQuiet(),entryCleared,wallAmount:wallAmount(),started,phase,escape,finished,failed,bossAge,remaining,bossSeconds:BOSS_SECONDS,totalHullHP:HULL_HP*3,damageBudget,bossZakuWave,bossSoldierWave,soldierWave,suitIntroduced,hawkIntroduced,hawk:hawk?{x:hawk.x,y:hawk.y,hp:hawk.hp,mode:hawk.mode,timer:hawk.timer,cycles:hawk.cycles,rounds:hawk.rounds}:null,harborRects:harborRects(),soldiers:api.enemies().filter(e=>e.stage4Kind==='soldier').map(e=>({x:e.x,y:e.y,hidden:e.hidden,aiming:e.aiming,red:e.red,launcher:e.launcher,facing:e.facing,surfaceY:e.surfaceY,gunX:e.gunX,gunY:e.gunY})),hullParts:hullParts.map(p=>({x:p.x,y:p.y,hp:p.hp,max:p.max,name:p.name,brokenAt:p.brokenAt})),notice};}
 return {reset,update,updateEnemy,filterDamage,onKilled,interceptShot,constrain,drawBackdrop,drawEnemy,drawBoss,snapshot,boundary,get inBlockadeIntro(){return !!blockadeIntro||!!magellanFinisher;},get magellanBgmFade(){return !!magellanFinisher||!!blockadeIntro&&blockadeIntro.age<DEMOLITION_START;},get harborActive(){return !finished&&phase<3;},get zone(){return blockadeIntro?(blockadeIntro.awaitingSortieVoice?'マゼラン / 出撃指令':'マゼラン / 脱出艇の離脱を待つ'):started?phase>=3?'完全破壊 / 脱出':failed?'時間切れ / 脱出失敗':'マゼラン破壊 / 残り'+Math.ceil(remaining)+'秒':scene()==='approach'?'宇宙港へ接近':scene()==='entrance'?'誘導灯 / ドック入口':scene()==='crossing'?'ルナ2内部へ進入':scene()==='interior'?'岩盤内ドック / 脱出航路':'出口 / 星空へ';}};
};


/* S4.4b: infiltration, blockade escape and a final Char heat-hawk duel.
   This file is concatenated into allowlisted stage-four.js by the packaging script. */
(function(){const createLegacy=window.createStageFour;
window.createStageFour=function(api,prototype=null){const data=window.StageFourHumanData;if(!data&&!prototype)return createLegacy(api);
 const {W,H,ctx,images,sprite}=api,nav=prototype?.nav||data.nav;
 const navBytes=value=>typeof value==='string'?Uint8Array.from(atob(value),c=>c.charCodeAt(0)):value;
 const free=navBytes(nav.free),shotFree=navBytes(nav.shots||nav.free);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const terrainEdges=[];
 const openCell=(x,y)=>x>=0&&y>=0&&x<nav.cols&&y<Math.ceil(nav.height/nav.cell)&&shotFree[y*nav.cols+x]===1;
 for(let y=0;y<=Math.ceil(nav.height/nav.cell);y++){let start=-1;for(let x=0;x<=nav.cols;x++){const edge=x<nav.cols&&openCell(x,y)!==openCell(x,y-1);if(edge&&start<0)start=x;if(!edge&&start>=0){terrainEdges.push([start*nav.cell,y*nav.cell,x*nav.cell,y*nav.cell]);start=-1;}}}
 for(let x=0;x<=nav.cols;x++){let start=-1;for(let y=0;y<=Math.ceil(nav.height/nav.cell);y++){const edge=y<Math.ceil(nav.height/nav.cell)&&openCell(x,y)!==openCell(x-1,y);if(edge&&start<0)start=y;if(!edge&&start>=0){terrainEdges.push([x*nav.cell,start*nav.cell,x*nav.cell,y*nav.cell]);start=-1;}}}
 function drawTerrainEdges(){ctx.save();ctx.beginPath();for(const [x1,y1,x2,y2] of terrainEdges){if(Math.max(x1,x2)<camera.x-6||Math.min(x1,x2)>camera.x+W+6||Math.max(y1,y2)<camera.y-6||Math.min(y1,y2)>camera.y+H+6)continue;ctx.moveTo(x1-camera.x,y1-camera.y);ctx.lineTo(x2-camera.x,y2-camera.y);}ctx.lineJoin='round';ctx.lineWidth=7;ctx.strokeStyle='#010811d9';ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#9ab8c4aa';ctx.stroke();ctx.restore();}
 function pressure(){const level=clamp(Number(api.level?.())||1,1,5),rank=level-1;return {level,rank,guardInterval:3.1-.20*rank,charInterval:3.1-.25*rank,charMove:1+.06*rank,charRecovery:.95-.06*rank};}
 function laserShot(x,y,target){const a=Math.atan2(target.y-y,target.x-x),speed=260+pressure().rank*15;api.addBullet({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:4,w:42,h:8,type:'laser',charBeam:true,angle:a,damage:25,coverOriginX:active?x+camera.x:undefined});}
 let active=true,initialized=false,camera={x:0,y:0},world={x:nav.start[0],y:nav.start[1]},safe={...world},facing=1,boarding=0,boardAge=0,carry=null,pending=false,elapsed=0,step=0,legacyScroll=3630;
 const coverWidth=84, standingOffset=34;
 const boardingPositions=[[600,5448],[3512,5448]];
 let boardingGoal=prototype?.nav.goal||boardingPositions[0];
 let boardingStandoff=null;
 let prototypeReached=false;
 const visitedRooms=new Set();
 const collectedSupplies=new Set();
 const plans=[];
 const tileCoverPlans=[];
 const guardRouteSteps=Array.from({length:13},(_,id)=>35+id*30);
 guardRouteSteps.push(53,109,184,254,333,379);
 for(const [id,routeStep] of (prototype?[]:guardRouteSteps).entries()){
  const [x,y]=nav.route[Math.min(nav.route.length-24,routeStep)];
  const placement=findCoverFloor(x,y,id%3===2?90:72);
  plans.push({id,wx:placement.x,wy:placement.y,floor:placement.floor,peek:placement.peek,
   mobile:id===9||id%3===2||placement.floor===null,maxHp:id===9?26:3,dead:false});
 }
 for(const [x,y] of prototype?[]:[[560,5096],[936,5336],[1384,5024],[1744,5432],[2248,5208],[2696,5000],[3104,5368],[3504,5152]]){
  if(pass(x,y))plans.push({id:plans.length,wx:x,wy:y,floor:null,peek:[],mobile:true,maxHp:3,dead:false});
 }
 if(prototype)for(const [index,supply] of prototype.supplies.entries()){
  if(supply.value<2||supply.value===2&&index%4!==0)continue;
  const team={x:supply.x,y:supply.y};
  const offsets=[[160,-88],[86,-144],[-16,-172],[-112,-128],[-164,-62],
   [160,0],[-160,0],[74,72],[-74,72],[0,-90],[74,0],[-74,0],[0,0]];
  let rank=0;
  for(const [dx,dy] of offsets){
   const x=supply.x+dx,y=supply.y+dy;
   if(!guardPathClear(supply.x,supply.y,x,y))continue;
   plans.push({id:plans.length,wx:x,wy:y,floor:null,peek:[],mobile:true,team,rank:rank++,
    resourceTier:supply.value,maxHp:supply.value===3?4:3,dead:false});
   if(rank===(supply.value===3?4:3))break;
  }
 }
 if(prototype){
  for(const room of prototype.rooms){
   const candidates=prototype.supplies.filter(supply=>
    Math.floor(supply.x/window.Luna2Maze.roomWidth)===room.id%2&&
    Math.floor(supply.y/window.Luna2Maze.roomHeight)===Math.floor(room.id/2));
   if(room.id===0)candidates.unshift({x:nav.start[0]+120,y:nav.start[1]});
   let count=0;
   for(const candidate of candidates){
    const spot=findCoverFloor(candidate.x,candidate.y,72);
    if(spot.floor===null||Math.hypot(spot.x-candidate.x,spot.y-candidate.y)>360)continue;
    tileCoverPlans.push({id:tileCoverPlans.length,wx:spot.x,wy:spot.y,floor:spot.floor,peek:spot.peek});
    if(++count===4)break;
   }
   placeAirCover(room);
  }
 }
 const coverPlans=prototype?tileCoverPlans:plans;
 const federationPosts=[];
 const crossfireRounds=[];
 if(prototype){
  const {roomWidth,roomHeight}=window.Luna2Maze;
  for(const room of prototype.rooms){
   const inside=(x,y)=>x>=room.x&&x<room.x+roomWidth&&y>=room.y&&y<room.y+roomHeight;
   let count=0;
   for(const plan of plans){
    if(plan.rank!==0||!inside(plan.wx,plan.wy))continue;
    for(const [dx,dy] of [[-240,32],[224,64],[-176,-136],[160,-136],[0,180],[0,-180],[-144,0],[144,0]]){
     const x=plan.wx+dx,y=plan.wy+dy;
     if(!inside(x,y)||!guardPathClear(plan.wx,plan.wy,x,y))continue;
     if(federationPosts.some(post=>Math.hypot(post.x-x,post.y-y)<320))continue;
     federationPosts.push({x,y,homeX:x,homeY:y,homeFace:dx>0?-1:1,face:dx>0?-1:1,shot:0,flashUntil:0,hitUntil:0,strikeAt:0,batonReady:0,batonUntil:0,moving:false});
     count++;break;
    }
    if(count===3)break;
   }
  }
 }
 function pass(x,y){return x>=0&&y>=0&&x<nav.width&&y<nav.height&&free[Math.floor(y/nav.cell)*nav.cols+Math.floor(x/nav.cell)]===1;}
 function nearest(x,y){if(pass(x,y))return {x,y};for(let d=1;d<30;d++)for(let k=0;k<32;k++){const a=k*Math.PI/16,xx=x+Math.cos(a)*d*nav.cell,yy=y+Math.sin(a)*d*nav.cell;if(pass(xx,yy))return {x:xx,y:yy};}return {...safe};}
 const chaseDistance=new Int32Array(free.length),chaseQueue=new Int32Array(free.length);
 let chaseRefresh=0;
 let prototypeChar=null,nextCharHunt=22;
 function navIndex(x,y){return Math.floor(y/nav.cell)*nav.cols+Math.floor(x/nav.cell);}
 function rebuildChaseDistances(){
  chaseDistance.fill(-1);
  const start=navIndex(world.x,world.y);
  chaseQueue[0]=start;chaseDistance[start]=0;
  let count=1;
  function visit(next,distance){
   if(free[next]!==1||chaseDistance[next]>=0)return;
   chaseDistance[next]=distance;chaseQueue[count++]=next;
  }
  for(let i=0;i<count;i++){
   const cell=chaseQueue[i],column=cell%nav.cols,distance=chaseDistance[cell]+1;
   if(column>0)visit(cell-1,distance);
   if(column<nav.cols-1)visit(cell+1,distance);
   visit(cell-nav.cols,distance);visit(cell+nav.cols,distance);
  }
 }
 function guardPathClear(x,y,toX,toY){
  const steps=Math.max(1,Math.ceil(Math.hypot(toX-x,toY-y)/6));
  for(let i=1;i<=steps;i++)if(!pass(x+(toX-x)*i/steps,y+(toY-y)*i/steps))return false;
  return true;
 }
 function moveGuard(e,target,speed,dt){
  if(!target)return true;
  const dx=target.x-e.wx,dy=target.y-e.wy,distance=Math.hypot(dx,dy);
  if(distance<.01)return true;
  const fraction=Math.min(1,speed*dt/distance);
  const x=e.wx+dx*fraction,y=e.wy+dy*fraction;
  if(!guardPathClear(e.wx,e.wy,x,y))return true;
  e.wx=x;e.wy=y;
  return fraction===1;
 }
 function chaseWaypoint(e){
  if(elapsed>=chaseRefresh){rebuildChaseDistances();chaseRefresh=elapsed+.5;}
  const cell=navIndex(e.wx,e.wy),column=cell%nav.cols;
  const neighbors=[cell-nav.cols,cell+nav.cols];
  if(column>0)neighbors.push(cell-1);
  if(column<nav.cols-1)neighbors.push(cell+1);
  let best=cell;
  for(const next of neighbors){
   if(chaseDistance[next]>=0&&chaseDistance[next]<chaseDistance[best])best=next;
  }
  if(best===cell)return null;
  const point={x:(best%nav.cols+.5)*nav.cell,y:(Math.floor(best/nav.cols)+.5)*nav.cell};
  if(guardPathClear(e.wx,e.wy,point.x,point.y))return point;
  return {x:(column+.5)*nav.cell,y:(Math.floor(cell/nav.cols)+.5)*nav.cell};
 }
 function patrolWaypoint(e,plan){
  const offsets=[[210,-110],[-180,135],[120,180],[-210,-95],[0,180],[0,-180],[160,0],[-160,0]];
  for(let i=0;i<offsets.length;i++){
   const index=((e.patrolIndex??plan.id??0)+i)%offsets.length;
   const [dx,dy]=offsets[index];
   const target={x:plan.wx+dx,y:plan.wy+dy};
   if(Math.hypot(target.x-e.wx,target.y-e.wy)<36||!guardPathClear(e.wx,e.wy,target.x,target.y))continue;
   e.patrolIndex=(index+1)%offsets.length;
   return target;
  }
  return {x:plan.wx,y:plan.wy};
 }
 let duel=null,duelAge=0,downAge=0,duelBudget=3,completed=false,duelPasses=0,boardSwitched=false;
 function shotPass(x,y){return x>=0&&y>=0&&x<nav.width&&y<nav.height&&shotFree[Math.floor(y/nav.cell)*nav.cols+Math.floor(x/nav.cell)]===1;}
 const BURNER_SECONDS=22,RECOVERY_SECONDS=1;
 const BURNER_WARNING_SECONDS=3,BURNER_BEEP_INTERVAL=.6;
 let playerCover=null;
 function walkingMode(){return active&&boarding===0&&api.player().dying<=0&&burnerPhase!=='active';}
 function coverAvailable(){return prototype?active&&boarding===0&&api.player().dying<=0:walkingMode();}
 function placeAirCover(room){
  const {roomWidth,roomHeight}=window.Luna2Maze;
  const stride=nav.cell*4;
  for(const [column,row] of [[0,0],[1,0],[0,1],[1,1]]){
   const left=room.x+column*roomWidth/2,top=room.y+row*roomHeight/2;
   const centerX=left+roomWidth/4,centerY=top+roomHeight/4;
   let best=null,bestScore=Infinity;
   for(let y=top+stride;y<top+roomHeight/2-stride;y+=stride){
    for(let x=left+stride;x<left+roomWidth/2-stride;x+=stride){
     if(!pass(x,y)||!pass(x,y+96))continue;
     if(![[-42,-40],[42,-40],[-42,40],[42,40]].every(([dx,dy])=>shotPass(x+dx,y+dy)))continue;
     const flanks=[x-66,x+66].filter(side=>guardPathClear(x,y,side,y));
     if(!flanks.length||tileCoverPlans.some(plan=>Math.hypot(plan.wx-x,plan.wy-y)<290))continue;
     const score=Math.hypot(x-centerX,y-centerY)+(flanks.length===1?100:0);
     if(score<bestScore){best={wx:x,wy:y,floor:y+40,air:true};bestScore=score;}
    }
   }
   if(best)tileCoverPlans.push({id:tileCoverPlans.length,...best});
  }
 }
 function roomHasCoverSpace(x,floor){
  const y=floor-44;
  let left=0,right=0,above=0;
  while(left<320&&shotPass(x-left-nav.cell,y))left+=nav.cell;
  while(right<320&&shotPass(x+right+nav.cell,y))right+=nav.cell;
  const width=left+right+nav.cell;
  if(left<96||right<96||width<256)return false;
  while(above<=width*1.5&&shotPass(x,y-above-nav.cell))above+=nav.cell;
  return above<=width*1.5;
 }
 function findCoverFloor(routeX,routeY,peekDistance){
  let best=null,bestScore=Infinity;
  let standing=null,standingScore=Infinity;
  const firstRow=Math.max(nav.cell,Math.floor((routeY-64)/nav.cell)*nav.cell);
  const lastRow=Math.min(nav.height-nav.cell,routeY+640);
  for(let x=routeX-192;x<=routeX+192;x+=nav.cell/2){
   for(let floor=firstRow;floor<=lastRow;floor+=nav.cell){
    const y=floor-standingOffset;
    if(!pass(x,y)||pass(x,y+3))continue;
    if(plans.some(plan=>Math.abs(plan.wx-x)<118&&Math.abs(plan.wy-y)<72)||
     tileCoverPlans.some(plan=>Math.hypot(plan.wx-x,plan.wy-y)<250))continue;
    const distance=Math.abs(x-routeX)+Math.abs(y-routeY);
    if(distance<standingScore){standing={x,y,floor:null,peek:[]};standingScore=distance;}
    const supported=[-40,-24,0,24,40].every(dx=>shotPass(x+dx,floor-1)&&!shotPass(x+dx,floor)&&shotPass(x+dx,floor-coverWidth));
    if(!supported||!roomHasCoverSpace(x,floor))continue;
    const peek=[x-peekDistance,x+peekDistance].filter(px=>pass(px,y)&&!pass(px,y+3));
    if(!peek.length)continue;
    const score=distance+(peek.length===1?90:0);
    if(score<bestScore){best={x,y,floor,peek};bestScore=score;}
   }
  }
  // Keep the route usable if the terrain changes and this guard has no suitable cover.
  return best||standing||{...nearest(routeX,routeY),floor:null,peek:[]};
 }
 function coverBoxes(plan){
  if(plan.floor===null)return [];
  const key=images.humanCoverContainer?'humanCoverContainer':'supplyCargo'+(plan.id%2?3:0);
  const art=images[key],h=art?coverWidth*art.sh/art.sw:80;
  const base={id:plan.id,key,x:plan.wx,y:plan.air?plan.wy:plan.floor-h/2,w:coverWidth,h,air:!!plan.air};
  const stack=plan.id%3;
  if(prototype||!stack)return [base];
  const upper={...base,x:base.x+coverWidth*(stack===1?.12:.2),y:base.y-h*(stack===1?.92:.65)};
  return [base,upper];
 }
 function coverTargets(){return coverPlans.flatMap(coverBoxes);}
 function drawHumanCover(plan){
  const boxes=coverBoxes(plan);
  for(let i=boxes.length-1;i>=0;i--){
   const box=boxes[i];
   if(box.air){
    const x=box.x-camera.x,y=box.y-camera.y+box.h/2;
    ctx.fillStyle='#668493';ctx.fillRect(x-box.w*.37,y-4,box.w*.74,7);
    ctx.fillStyle='#ffcd85';ctx.fillRect(x-box.w*.30,y+3,9,3);ctx.fillRect(x+box.w*.30-9,y+3,9,3);
   }
   sprite(box.key,box.x-camera.x,box.y-camera.y,box.w);
  }
 }
 function nearbyCover(){
  let closest=null,best=Infinity;
  for(const plan of coverPlans){
   const c=coverBoxes(plan)[0];
   if(!c)continue;
   const dx=Math.max(0,Math.abs(world.x-c.x)-c.w/2);
   const dy=Math.abs(world.y-plan.wy);
   if(dx>52||dy>(prototype?22:nav.cell))continue;
   const side=Math.sign(world.x-c.x)||facing;
   let x=world.x;
   if(prototype){
    if(c.air&&burnerPhase!=='active')continue;
    x=c.x+side*Math.max(Math.abs(world.x-c.x),c.w/2+24);
    if(!guardPathClear(world.x,world.y,x,world.y))continue;
    if(burnerPhase!=='active'&&pass(x,world.y+3))continue;
   }
   const d=dx*dx+dy*dy;
   if(d<best){best=d;closest={box:c,x,side};}
  }return closest;
 }
 function leaveCover(){const had=!!playerCover;playerCover=null;return had;}
 function canToggleCover(){return coverAvailable()&&(!!playerCover||(grounded||burnerPhase==='active')&&!!nearbyCover());}
 function saferCoverSide(target){
  const {box,side}=target;
  const oppositeX=box.x-side*(box.w/2+24);
  if(!guardPathClear(world.x,world.y,oppositeX,world.y))return target;
  if(burnerPhase!=='active'&&pass(oppositeX,world.y+3))return target;
  let currentRisk=0,oppositeRisk=0;
  for(const enemy of api.enemies()){
   if(enemy.stage4Kind!=='humanGuard'||enemy.hp<=0||enemy.retreatUntil||enemy.coverExit)continue;
   const distance=Math.hypot(enemy.wx-box.x,enemy.wy-box.y);
   if(distance>650)continue;
   const risk=1/Math.max(60,distance);
   if(!lineCrossesCover(enemy.wx,enemy.wy,target.x,world.y,box)&&guardPathClear(enemy.wx,enemy.wy,target.x,world.y))currentRisk+=risk;
   if(!lineCrossesCover(enemy.wx,enemy.wy,oppositeX,world.y,box)&&guardPathClear(enemy.wx,enemy.wy,oppositeX,world.y))oppositeRisk+=risk;
  }
  return oppositeRisk<currentRisk?{box,x:oppositeX,side:-side}:target;
 }
 function toggleCover(){
  if(!coverAvailable())return false;
  if(playerCover)return leaveCover();
  if(!grounded&&burnerPhase!=='active')return false;
  let target=nearbyCover();if(!target)return false;
  if(prototype)target=saferCoverSide(target);
  playerCover={...target.box,side:-target.side};
  if(prototype){
   world={x:target.x,y:world.y};safe={...world};
   api.player().x=world.x-camera.x;
   fallVelocity=fallStep=0;
  }
  walking=false;walkClock=0;api.player().melee=null;api.stopTarget(api.player());return true;
 }
 function coverBlocks(source){
  if(!playerCover||!coverAvailable()||!source)return false;
  if(prototype){
   const x=source.coverOriginX??source.x+camera.x;
   const y=source.coverOriginY??source.y+camera.y;
   return lineCrossesCover(x,y,world.x,world.y,playerCover);
  }
  // Use the muzzle in world coordinates, even after the projectile crosses the player.
  const incoming=Number.isFinite(source.coverOriginX)?Math.sign(source.coverOriginX-world.x):
   Number.isFinite(source.vx)&&Math.abs(source.vx)>.01?-Math.sign(source.vx):Math.sign(source.x-api.player().x);
  return incoming===playerCover.side;
 }
 function lineCrossesCover(x,y,toX,toY,box){
  let near=0,far=1;
  for(const [from,to,min,max] of [
   [x,toX,box.x-box.w/2,box.x+box.w/2],
   [y,toY,box.y-box.h/2,box.y+box.h/2]
  ]){
   const delta=to-from;
   if(Math.abs(delta)<.001){if(from<min||from>max)return false;continue;}
   const a=(min-from)/delta,b=(max-from)/delta;
   near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
   if(near>far)return false;
  }
  return true;
 }
 function enemyLostPlayer(enemy){
  return prototype&&playerCover&&coverAvailable()&&
   lineCrossesCover(enemy.wx,enemy.wy,world.x,world.y,playerCover);
 }
 function tileCoverStopsBullet(previous,bullet){
  if(!prototype||!previous)return false;
  return tileCoverPlans.some(plan=>{
   const box=coverBoxes(plan)[0];
   return lineCrossesCover(previous.x+camera.x,previous.y+camera.y,bullet.x+camera.x,bullet.y+camera.y,box);
  });
 }
 let burnerPhase='ready',burnerTime=BURNER_SECONDS,fallVelocity=0,fallStep=0,grounded=false,walkDistance=0,walking=false,walkClock=0,frameDt=0;
 function resetBurner(){playerCover=null;burnerPhase='ready';burnerTime=BURNER_SECONDS;fallVelocity=fallStep=walkDistance=walkClock=frameDt=0;grounded=walking=false;}
 function activateBurner(){if(!active||boarding>0||api.player().dying>0||burnerPhase!=='ready')return false;leaveCover();burnerPhase='active';burnerTime=BURNER_SECONDS;fallVelocity=fallStep=0;grounded=false;api.clearHumanVerticalTarget?.();return true;}
 function burnerStatus(){return {phase:burnerPhase,remaining:burnerTime,walking,walkFrame:walking?Math.floor(walkClock*10)%4:0,total:burnerPhase==='recharge'?RECOVERY_SECONDS:BURNER_SECONDS,grounded};}
 function drawLocomotion(key,x,y,alpha){const a=images[key];if(!a)return false;const scale=60/a.bodyHeight;ctx.save();ctx.translate(x,y);ctx.scale(facing,1);ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(a.im,a.sx,a.sy,a.sw,a.sh,(a.sx-a.bodyX)*scale,30+(a.sy-a.bodyBottom)*scale,a.sw*scale,a.sh*scale);ctx.restore();return true;}
 function beginBoarding(){
  boarding=.001;
  leaveCover();
  api.clearThreats();api.freezeBoarding?.();
  if(api.boardingDialogueTime){
   boardingStandoff={phase:'order',age:0,x:world.x,y:world.y,synced:!!api.playBoardingDialogue('order')};
  }
 }
 function advanceBoarding(dt){
  if(boarding<=0)return;
  if(boardingStandoff){
   const scene=boardingStandoff;
   const position=scene.synced?api.boardingDialogueTime(scene,dt,scene.phase):null;
   if(position===null)scene.synced=false;
   scene.age=position===null?scene.age+dt:Math.max(scene.age,position);
   if(scene.phase==='order'){
    if(scene.age<api.boardingDialogueDuration('order'))return;
    scene.phase='hold';scene.age=0;scene.synced=false;
    return;
   }
   if(scene.phase==='hold'){
    if(scene.age<.35)return;
    scene.phase='reply';scene.age=0;scene.synced=!!api.playBoardingDialogue('reply');
    return;
   }
   if(scene.phase==='reply'){
    if(scene.age<api.boardingDialogueDuration('reply'))return;
    scene.phase='board';scene.age=0;scene.synced=false;
    return;
   }
   if(scene.age<1)return;
   boardingStandoff=null;
  }
  boarding+=dt;if(boarding>=2&&!boardSwitched){carry=api.carryState?.();active=false;boardAge=0;boardSwitched=true;legacy.reset();api.boardHuman?.();legacy.update(32,0);legacy.update(33,0);}if(boarding>=3.2){boarding=0;api.freezeBoarding?.();}
 }
 const boardingShipOffset=prototype?150:215;
 function drawBoardingOfficer(name,uniform,shipX,shipY,targetX,targetY,progress,face){
  if(progress<=0)return;
  const depth=progress*progress*(3-2*progress);
  const x=shipX+(targetX-shipX)*depth;
  const y=shipY+(targetY-shipY)*depth;
  const height=15+59*depth;
  const stride=progress<1?Math.sin(progress*34)*3*depth:0;
  drawPerson('human'+uniform+(progress<1?'Move':'Pistol'),x,y+stride,height,face);
  if(progress>=1)label(name,x,y-height/2-12,15);
 }
 function drawBoardingStandoff(){
  const {age,phase,x,y}=boardingStandoff,cx=x-camera.x,cy=y-camera.y;
  const shipX=boardingGoal[0]-camera.x,shipY=boardingGoal[1]-camera.y-boardingShipOffset;
  const slots=[[-115,-42],[-78,67],[80,68],[127,-38],[12,-105]];
  for(const [i,[dx,dy]] of slots.entries()){
   const progress=phase==='order'?clamp((age-i*.25)/2.2,0,1):1;
   if(!progress)continue;
   const scale=1+(1-progress)*.9;
   drawPerson(progress<1?'humanWhiteMove':'humanWhiteRifle',cx+dx*scale,cy+dy*scale,54,dx<0?1:-1);
  }
  const wakkein=phase==='order'?clamp(age/2.2,0,1):1;
  const bright=phase==='order'?clamp((age-.65)/4.4,0,1):1;
  drawBoardingOfficer('ワッケイン','White',shipX-15,shipY+12,cx-59,cy+20,wakkein,1);
  drawBoardingOfficer('ブライト','Orange',shipX+15,shipY+12,cx+57,cy+29,bright,-1);
 }
 function drawFade(){if(boarding<=0)return;const alpha=boarding<1.2?0:boarding<2?(boarding-1.2)/.8:boarding<2.2?1:clamp((3.2-boarding),0,1);if(alpha>0){ctx.save();ctx.fillStyle='rgba(0,0,0,'+alpha+')';ctx.fillRect(0,0,W,H);ctx.restore();}}
 function dockBackground(c,t){if(t<33||t>=90)return;const a=images.dockBackgroundBand;if(!a)return;const exit=clamp((t-80)/10,0,1);c.save();c.beginPath();c.rect(0,0,W*(1-exit),H);c.clip();c.globalAlpha=.48;const drift=(t*12)%(W*1.5);for(let i=-1;i<2;i++)c.drawImage(a.im,a.sx,a.sy,a.sw,a.sh,i*W*1.5-drift,125,W*1.5,390);c.restore();}
 const legacy=createLegacy({...api,deferChar:true,scroll:()=>legacyScroll,drawDockBackground:dockBackground,complete:beginDuel});
 function beginDuel(){
  if(duel)return;
  api.clearThreats();duelAge=downAge=duelPasses=0;duelBudget=3;
  duel={type:'zaku',stage4Kind:'duelChar',kind:'charDuel',x:W+70,y:H/2,hp:72,max:72,size:72,age:0,mode:'approach',timer:.3,rushIndex:-1,kickSide:1,paid:false,turrets:[],guards:[],vx:0,vy:0};
  api.add(duel);api.setBoss(duel);
  for(const wing of [-1,1]){
   api.add({type:'zaku',stage4Kind:'duelEscort',x:W+120,y:H/2+wing*130,
    hp:28,max:28,size:65,wing,mode:'regroup',timer:wing<0?1.4:2.3,facing:-1});
  }
  api.playDuelArrival?.();
 }
 function initialize(t){initialized=true;if(t>=90){active=false;boardAge=t-33;return;}world={x:nav.start[0],y:nav.start[1]};safe={...world};camera={x:clamp(world.x-W*.35,0,nav.width-W),y:clamp(world.y-H*.5,0,nav.height-H)};const p=api.player();p.x=world.x-camera.x;p.y=world.y-camera.y;}
 function reset(){crossfireRounds.length=0;for(const post of federationPosts){post.x=post.homeX;post.y=post.homeY;post.face=post.homeFace;post.shot=post.flashUntil=post.hitUntil=post.strikeAt=post.batonReady=post.batonUntil=0;post.moving=false;}resetBurner();nextGrenadeTime=0;chaseRefresh=0;prototypeChar=null;nextCharHunt=22;prototypeReached=false;visitedRooms.clear();collectedSupplies.clear();boardingGoal=prototype?.nav.goal||boardingPositions[Math.random()<.5?0:1];legacy.reset();active=true;initialized=false;camera={x:0,y:0};world={x:nav.start[0],y:nav.start[1]};safe={...world};facing=1;boarding=boardAge=elapsed=step=0;boardingStandoff=null;carry=null;pending=false;legacyScroll=3630;duel=null;duelAge=downAge=duelPasses=0;duelBudget=3;completed=false;boardSwitched=false;for(const p of plans){p.dead=false;p.hp=p.maxHp;}}
 function tick(t,dt){if(!initialized)initialize(t);if(!active){if(completed)return;if(duel){duelAge+=dt;duelBudget=Math.min(3,duelBudget+6*dt);if(duel.hp<=0){downAge+=dt;if(downAge>=2.6){completed=true;api.setBoss(null);api.complete();}}return;}boardAge+=dt;legacyScroll=Math.min(90,33+boardAge)*110;legacy.update(33+boardAge,dt);return;}
  elapsed+=dt;frameDt=dt;const p=api.player();if(p.dying>0)return;
  if(burnerPhase!=='ready'){
   const previous=burnerTime;
   burnerTime=Math.max(0,burnerTime-dt);
   if(burnerTime<.000001){
    if(burnerPhase==='active'){burnerPhase='recharge';burnerTime=RECOVERY_SECONDS;}
    else{burnerPhase='ready';burnerTime=BURNER_SECONDS;}
   }else if(burnerPhase==='active'&&burnerTime<=BURNER_WARNING_SECONDS&&
    Math.ceil(previous/BURNER_BEEP_INTERVAL)>Math.ceil(burnerTime/BURNER_BEEP_INTERVAL)){
    api.burnerWarning?.();
   }
  }
  if(burnerPhase==='active'){fallVelocity=fallStep=0;grounded=false;}else{fallVelocity=Math.min(280,fallVelocity+480*dt);fallStep=fallVelocity*dt;}

  if(prototype){
   for(const [id,supply] of prototype.supplies.entries()){
    if(collectedSupplies.has(id)||Math.hypot(world.x-supply.x,world.y-supply.y)>38)continue;
    if(!guardPathClear(world.x,world.y,supply.x,supply.y))continue;
    collectedSupplies.add(id);
    if(supply.kind==='life')api.collectPrototypeLife?.();
    else api.collectPrototypeMaterial?.(supply.value);
   }
  }
  if(Math.hypot(world.x-boardingGoal[0],world.y-boardingGoal[1])<90){
   if(!prototype||!api.explorationTest){beginBoarding();return;}
   if(!prototypeReached){prototypeReached=true;api.reachPrototypeGoal?.();}
  }
  if(prototype)updateCharHunt();
  // Activate nearby patrols once. An activated enemy can follow across camera boundaries.
  const livePlans=new Set(api.enemies().filter(e=>e.hp>0).map(e=>e.humanPlan));
  for(const plan of plans){
   if(plan.dead||livePlans.has(plan.id))continue;
   const nearby=prototype?Math.hypot(plan.team.x-world.x,plan.team.y-world.y)<530:
    Math.abs(plan.wx-camera.x-W/2)<W*.65&&Math.abs(plan.wy-camera.y-H/2)<H*.7;
   if(!nearby)continue;
   if(plan.team&&!plan.team.heading){
    const length=Math.hypot(world.x-plan.team.x,world.y-plan.team.y)||1;
    plan.team.heading={x:(world.x-plan.team.x)/length,y:(world.y-plan.team.y)/length};
   }
   api.add({type:'zaku',stage4Kind:'humanGuard',humanPlan:plan.id,commander:!prototype&&plan.id===9,
    launcher:plan.id%3===1,red:!prototype&&plan.id!==9&&plan.id%3===0,resourceTier:plan.resourceTier,
    hp:plan.hp,max:plan.maxHp,flying:plan.mobile,size:60,age:0,shot:2.4+(plan.id%4)*.45,
    wx:plan.wx,wy:plan.wy,x:plan.wx-camera.x,y:plan.wy-camera.y});
  }
  if(prototype)updateCrossfire(dt);
 }
 function constrain(body){if(duel){const x=body.x,y=body.y;body.x=clamp(body.x,45,W-45);body.y=clamp(body.y,95,H-55);if(x!==body.x||y!==body.y)api.stopTarget(body);return;}if(!active)return legacy.constrain(body);if(!initialized)return;let desired={x:body.x+camera.x,y:body.y+camera.y};if(body===api.player()&&playerCover){if(!coverAvailable())leaveCover();else{desired={...safe};api.stopTarget(body);}}if(body!==api.player()){const q=nearest(desired.x,desired.y);body.x=q.x-camera.x;body.y=q.y-camera.y;return;}
  // Gravity changes only exploration; active burner preserves the approved movement delta.
  if(burnerPhase!=='active'){desired.y=safe.y+(prototype&&playerCover?0:fallStep);fallStep=0;}
  // Swept axis resolution prevents high SPEED tunnelling and permits sliding along rock.
  let pos={...safe};if(Math.hypot(desired.x-pos.x,desired.y-pos.y)>150){desired={...safe};}
  const dx=desired.x-pos.x,dy=desired.y-pos.y,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));if(!playerCover&&Math.abs(dx)>.1)facing=Math.sign(dx);
  for(let i=0;i<n;i++){
   const nx=pos.x+dx/n;
   if(pass(nx,pos.y))pos.x=nx;
   else if(burnerPhase!=='active'&&grounded&&Math.abs(dx)>.01){
    // Follow one navigation-cell floor step; taller rock faces remain walls.
    for(let lift=1;lift<=nav.cell;lift++)if(pass(pos.x,pos.y-lift)&&pass(nx,pos.y-lift)){pos.y-=lift;pos.x=nx;break;}
   }
   if(pass(pos.x,pos.y+dy/n))pos.y+=dy/n;
  }
  if(burnerPhase!=='active'){
   if(grounded){for(let drop=1;drop<=nav.cell;drop++){if(!pass(pos.x,pos.y+drop)){pos.y+=drop-1;break;}}}
   grounded=!pass(pos.x,pos.y+2);if(grounded)fallVelocity=0;
   walking=grounded&&Math.abs(pos.x-safe.x)>.01;walkDistance+=Math.abs(pos.x-safe.x);if(walking)walkClock+=frameDt;else walkClock=0;
  }else walking=false;world=pos;safe={...pos};let next={x:clamp(pos.x-W*.42,0,nav.width-W),y:clamp(pos.y-H*.5,0,nav.height-H)};const sx=next.x-camera.x,sy=next.y-camera.y;camera=next;if(sx||sy)api.shiftHuman?.(sx,sy);body.x=pos.x-camera.x;body.y=pos.y-camera.y;if(burnerPhase==='active'?Math.hypot(pos.x-desired.x,pos.y-desired.y)>1:Math.abs(pos.x-desired.x)>1)api.stopTarget(body);if(burnerPhase!=='active')api.clearHumanVerticalTarget?.();
  let best=Infinity;for(let i=0;i<nav.route.length;i++){const d=(nav.route[i][0]-pos.x)**2+(nav.route[i][1]-pos.y)**2;if(d<best){best=d;step=i;}}
 }

 function drawPerson(key,x,y,height=25,face=1,alpha=1){if(/Electric(Up|Down)$/.test(key)){api.drawVertical(key,x,y,height,alpha,face);return;}const a=images[key];if(!a)return;ctx.save();ctx.translate(x,y);ctx.scale(face,1);ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(a.im,a.sx,a.sy,a.sw,a.sh,-height*a.sw/a.sh/2,-height/2,height*a.sw/a.sh,height);ctx.restore();}
 function pose(kind){const p=api.player();return 'human'+kind+(p.melee?(p.melee.javelin?(p.melee.axis==='y'?'Electric'+(p.melee.direction<0?'Up':'Down'):'Electric'):'Baton'):p.backBoost>0?'Move':p.missile&&!p.laser?'Bazooka':p.laser?'Rifle':'Pistol');}
 function drawAmuroCover(alpha){
  const box=playerCover,a=images.humanAmuroCover;
  const face=-box.side,edge=box.x+face*box.w/2-camera.x,floor=box.y+box.h/2-camera.y;
  if(a){
   const scale=64/a.sh;
   ctx.save();ctx.translate(edge,floor);ctx.scale(face,1);ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;
   ctx.drawImage(a.im,a.sx,a.sy,a.sw,a.sh,-(1870-a.sx)*scale,-64,a.sw*scale,64);
   ctx.restore();
  }else drawPerson('humanAmuroPistol',edge+face*12,floor-25,50,face,alpha);
  drawHumanCover(coverPlans[box.id]);
 }
 function drawPlayer(alpha){if(!active)return false;const p=api.player();if(playerCover){drawAmuroCover(alpha);label('遮蔽中 / 出る ボタン ・ Cキー',p.x,p.y-48,13);return true;}const q=boarding>0?clamp(boarding/1.2,0,1):0,x=p.x+(boardingGoal[0]-camera.x-p.x)*q,y=p.y+(boardingGoal[1]-camera.y-50-p.y)*q;if(!p.melee&&q===0&&(burnerPhase==='active'||grounded)&&drawLocomotion((burnerPhase==='active'?'humanAmuroBurner':'humanAmuroWalk')+((burnerPhase==='active'?Math.floor(elapsed*10)%4:walking?Math.floor(walkClock*10)%4:0)),x,y,alpha))return true;drawPerson(pose('Amuro'),x,y,60-q*24,p.melee&&p.melee.axis!=='y'?(p.melee.direction||facing):facing,alpha*(1-q*.8));return true;}
 function drawOption(i,x,y){if(!active)return false;drawPerson(pose(i%2?'White':'Orange'),x,y,56,facing);return true;}
 function drawHammer(point){if(!active)return false;sprite('humanHaro',point.x,point.y,38);return true;}
 function drawPrototypeMap(){
  const {roomWidth,roomHeight}=window.Luna2Maze;
  const column=Math.floor(world.x/roomWidth),row=Math.floor(world.y/roomHeight);
  const current=prototype.rooms.find(room=>room.x===column*roomWidth&&room.y===row*roomHeight);
  if(current)visitedRooms.add(current.id);
  const originX=W-149,originY=54;
  const point=room=>[originX+room.x/roomWidth*31+16,originY+room.y/roomHeight*27+13];
  ctx.save();
  ctx.fillStyle='#07131fef';ctx.fillRect(originX-7,22,141,174);
  label('探索記録 '+visitedRooms.size+'/'+prototype.rooms.length,originX+64,42,12);
  ctx.strokeStyle='#738f9c';ctx.lineWidth=4;
  for(const [a,b] of prototype.connections){
   if(!visitedRooms.has(a)||!visitedRooms.has(b))continue;
   ctx.beginPath();ctx.moveTo(...point(prototype.rooms[a]));ctx.lineTo(...point(prototype.rooms[b]));ctx.stroke();
  }
  for(const room of prototype.rooms){
   if(!visitedRooms.has(room.id))continue;
   const [x,y]=point(room);
   ctx.fillStyle=room===current?'#a6edc8':room.theme.color;
   ctx.fillRect(x-11,y-8,22,16);
  }
  ctx.restore();
  label(prototypeReached?'最深部到達 / 素材を持ち帰れます':current?.theme.name||'連絡通路',W/2,100,20);
  label('回収 '+collectedSupplies.size+' / '+prototype.supplies.length,W/2,127,15);
  if(prototypeChar?.age<2.3)label('警戒 / シャアが接近',W/2,154,17);
 }
 function crossfireLineClear(x,y,toX,toY){
  if(!shotLineClear({x:x-camera.x,y:y-camera.y},{x:toX-camera.x,y:toY-camera.y}))return false;
  return !tileCoverPlans.some(plan=>lineCrossesCover(x,y,toX,toY,coverBoxes(plan)[0]));
 }
 function fireCrossfire(x,y,target,allied){
  const toX=target.wx??target.x,toY=target.wy??target.y;
  const aim=Math.atan2(toY-y,toX-x);
  for(const spread of [0,-.065,.065]){
   const angle=aim+spread;
   crossfireRounds.push({x,y,vx:Math.cos(angle)*530,vy:Math.sin(angle)*530,life:.95,target,allied});
  }
 }
 function updateFederationBaton(post,dt){
  const player=api.player();
  const distance=Math.hypot(post.x-world.x,post.y-world.y);
  if(player.dying>0||distance>360||!crossfireLineClear(post.x,post.y,world.x,world.y)){
   post.strikeAt=0;
   return;
  }
  post.face=world.x<post.x?-1:1;
  if(post.strikeAt){
   if(elapsed<post.strikeAt)return;
   post.strikeAt=0;
   post.batonUntil=elapsed+.22;
   if(distance<48)api.hit(18,1,{coverOriginX:post.x,coverOriginY:post.y});
   return;
  }
  if(distance<39){
   if(elapsed>=post.batonReady){post.strikeAt=elapsed+.23;post.batonReady=elapsed+.95;}
   return;
  }
  const fraction=Math.min(distance-34,150*dt)/distance;
  const x=post.x+(world.x-post.x)*fraction,y=post.y+(world.y-post.y)*fraction;
  if(guardPathClear(post.x,post.y,x,y)){post.x=x;post.y=y;post.moving=true;}
 }
 function updateCrossfire(dt){
  const guards=api.enemies().filter(e=>e.hp>0&&(plans[e.humanPlan]?.team||e.huntPlan)&&!e.retreatUntil&&!e.coverExit);
  for(const post of federationPosts){
   post.moving=false;
   if(Math.hypot(post.x-world.x,post.y-world.y)>690)continue;
   const nearby=guards.filter(e=>Math.hypot(e.wx-post.x,e.wy-post.y)<460);
   if(!nearby.length){updateFederationBaton(post,dt);continue;}
   post.strikeAt=0;
   const enemy=nearby.find(e=>!e.hidden&&crossfireLineClear(post.x,post.y,e.wx,e.wy));
   if(!enemy)continue;
   post.face=enemy.wx<post.x?-1:1;
   if(elapsed>=post.shot){
    fireCrossfire(post.x+post.face*15,post.y,enemy,true);
    post.flashUntil=elapsed+.11;post.shot=elapsed+.18+(post.homeX%11)*.013;
   }
  }
  for(let i=crossfireRounds.length-1;i>=0;i--){
   const round=crossfireRounds[i],nextX=round.x+round.vx*dt,nextY=round.y+round.vy*dt;
   round.life-=dt;
   if(round.life<=0||!crossfireLineClear(round.x,round.y,nextX,nextY)){
    crossfireRounds.splice(i,1);continue;
   }
   round.x=nextX;round.y=nextY;
   const target=round.target;
   if(!target.hidden&&Math.hypot(round.x-(target.wx??target.x),round.y-(target.wy??target.y))<18){
    target.hitUntil=elapsed+.12;
    crossfireRounds.splice(i,1);
   }
  }
 }
 function drawCrossfire(){
  for(const post of federationPosts){
   const x=post.x-camera.x,y=post.y-camera.y;
   if(x<-45||x>W+45||y<-45||y>H+45)continue;
   const key=post.hitUntil>elapsed?'humanWhiteHit':post.batonUntil>elapsed?'humanWhiteElectric':
    post.strikeAt?'humanWhiteBaton':post.flashUntil>elapsed?'humanWhiteRifleFire':
    post.moving?'humanWhiteMove':'humanWhiteRifle';
   drawPerson(key,x,y,54,post.face);
  }
  ctx.save();ctx.lineWidth=2.5;
  for(const round of crossfireRounds){
   const x=round.x-camera.x,y=round.y-camera.y;
   ctx.strokeStyle=round.allied?'#9de8ff':'#ffb279';
   ctx.beginPath();ctx.moveTo(x-round.vx*.035,y-round.vy*.035);ctx.lineTo(x,y);ctx.stroke();
  }
  ctx.restore();
 }
 function drawPrototypeSupplies(){
  for(const [id,supply] of prototype.supplies.entries()){
   if(collectedSupplies.has(id))continue;
   const x=supply.x-camera.x,y=supply.y-camera.y;
   if(x<-24||x>W+24||y<-24||y>H+24)continue;
   ctx.save();ctx.translate(x,y);
   const extraLife=supply.kind==='life';
   ctx.fillStyle=extraLife?'#ffe27a':supply.value===3?'#dcadff':'#87f7c2';
   ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;
   if(extraLife)ctx.fillRect(-21,-12,42,24);
   else{ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(15,0);ctx.lineTo(0,15);ctx.lineTo(-15,0);ctx.closePath();ctx.fill();}
   ctx.restore();
   ctx.save();ctx.fillStyle='#10202c';ctx.font='bold 14px monospace';ctx.textAlign='center';
   ctx.fillText(extraLife?'1UP':supply.value,x,y+5);ctx.restore();
  }
 }
 function backdrop(){if(duel){drawSpace();return;}if(!active){legacy.drawBackdrop();if(boardAge<4){ctx.fillStyle='#061826ed';ctx.fillRect(180,H-202,W-360,46);label('ガンダム搭乗 — 装備・強化を継承',W/2,H-174,20);}return;}
 const a=images.humanMaze;
 if(prototype)window.Luna2Maze.draw(ctx,prototype,camera,W,H,images.luna2Tiles);
 else if(a)ctx.drawImage(a.im,0,0,a.sw,a.sh,-camera.x,-camera.y,nav.width,nav.height);
 const gx=boardingGoal[0]-camera.x,gy=boardingGoal[1]-camera.y;
 const shipY=gy-boardingShipOffset,shipWidth=prototype?360:440;
 if(gx>-shipWidth/2&&gx<W+shipWidth/2&&shipY>-200&&shipY<H+200){
  sprite('whiteBase',gx,shipY,shipWidth,.82);
 }
 drawTerrainEdges();

 const bs=burnerStatus(),recover=bs.phase==='recharge',warning=bs.phase==='active'&&bs.remaining<=BURNER_WARNING_SECONDS;
 const ratio=recover?1-bs.remaining/bs.total:bs.remaining/bs.total;
 const barColor=recover?'#fff544':warning?'#ff51b9':'#9dff39';
 ctx.save();
 ctx.fillStyle='#031321f2';ctx.fillRect(18,57,252,47);
 ctx.fillStyle=barColor;ctx.font='bold 13px monospace';
 ctx.fillText(recover?'VERNIER / 回復中':warning?'VERNIER / 残りわずか':bs.phase==='active'?'VERNIER / 噴射中':'VERNIER / Bで噴射',28,74);
 ctx.fillText(bs.remaining.toFixed(1)+'s',208,74);
 ctx.fillStyle='#263d4c';ctx.fillRect(28,83,230,9);
 ctx.fillStyle=barColor;ctx.shadowColor=barColor;ctx.shadowBlur=8;
 ctx.fillRect(28,83,230*clamp(ratio,0,1),9);
 ctx.restore();
 for(const plan of coverPlans)if(prototype||plan.dead)drawHumanCover(plan);
 if(gx>-220&&gx<W+220&&gy>-220&&gy<H+220){
  sprite('gundamUnarmed',gx,prototype?gy-23:gy,prototype?100:230);
  label(prototype&&api.explorationTest?'最深部 / 到達地点':'GUNDAM / 接近して搭乗',gx,gy-(prototype?88:155),19);
 }
 if(boardingStandoff)drawBoardingStandoff();
 if(prototype){drawPrototypeSupplies();if(!boardingStandoff)drawCrossfire();drawPrototypeMap();return;}
 ctx.fillStyle='#031321db';ctx.fillRect(W-155,18,135,205);if(a)ctx.drawImage(a.im,0,0,a.sw,a.sh,W-150,22,124,186);ctx.fillStyle='#83f7cf';ctx.fillRect(W-150+world.x/nav.width*124-2,22+world.y/nav.height*186-2,5,5);ctx.fillStyle='#ffce72';ctx.fillRect(W-150+boardingGoal[0]/nav.width*124-3,22+boardingGoal[1]/nav.height*186-3,6,6);
 label(boarding>0?'ガンダムに搭乗中':'アムロ / ルナ2内部を探索',W/2,100,20);const next=world.y>=4880?boardingGoal:nav.route[Math.min(nav.route.length-1,step+12)],dx=next[0]-world.x,dy=next[1]-world.y;label('進路 '+(Math.abs(dx)>Math.abs(dy)?dx>0?'→':'←':dy>0?'↓':'↑')+'  / 緑:自機・黄:搭乗地点',W/2,126,15);
 if(!playerCover&&canToggleCover())label('隠れる ボタン ・ Cキー',W/2,H-45,15);
 }
 function label(s,x,y,size){ctx.save();ctx.fillStyle='#e5effa';ctx.font='bold '+size+'px sans-serif';ctx.textAlign='center';ctx.fillText(s,x,y);ctx.restore();}
 function duelEnraged(e){return e.hp<=e.max/2;}
 function updateDuelEscort(e,dt){
  if(e.hp<=0)return true;
  if(duel.hp<=0){
   e.x+=400*dt;
   if(e.x>W+140)e.hp=0;
   return true;
  }
  const player=api.player();
  e.timer-=dt;
  if(e.mode==='regroup'){
   const targetX=clamp(player.x+290,W*.58,W-110);
   const targetY=clamp(player.y+e.wing*145,115,H-85);
   e.x+=clamp(targetX-e.x,-300*dt,300*dt);
   e.y+=clamp(targetY-e.y,-175*dt,175*dt);
   e.facing=player.x<e.x?-1:1;
   if(e.timer<=0&&e.x<W-40){
    e.mode=Math.random()<.5?'burst':'windup';
    e.timer=e.mode==='burst'?0:.48;
    e.shotsLeft=4;
    e.target={x:clamp(player.x,40,W-45),y:clamp(player.y,95,H-55)};
   }
  }else if(e.mode==='burst'&&e.timer<=0){
   e.facing=player.x<e.x?-1:1;
   api.fire(e.x+e.facing*24,e.y,285,1);
   e.shotsLeft--;
   e.timer=e.shotsLeft?.23:.65;
   if(!e.shotsLeft)e.mode='regroup';
  }else if(e.mode==='windup'&&e.timer<=0){
   e.mode='slash';e.timer=.55;e.connected=false;
   const angle=Math.atan2(e.target.y-e.y,e.target.x-e.x);
   e.vx=Math.cos(angle)*630;e.vy=Math.sin(angle)*630;
  }else if(e.mode==='slash'){
   e.x=clamp(e.x+e.vx*dt,40,W-45);e.y=clamp(e.y+e.vy*dt,95,H-55);
   if(!e.connected&&Math.hypot(player.x-e.x,player.y-e.y)<26+(api.hitRadius?.()||13)&&!api.meleeSafe?.(e)){
    e.connected=true;api.hit(25,1,e);
   }
   if(e.timer<=0){e.mode='regroup';e.timer=.8;}
  }
  return true;
 }
 function drawDuelEscort(e){
  if(e.mode==='windup'&&duel.hp>0){
   ctx.save();ctx.strokeStyle='#ffb477';ctx.setLineDash([7,6]);
   ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.target.x,e.target.y);ctx.stroke();ctx.restore();
  }
  const key=e.mode==='slash'?'zakuHawkSlash':e.mode==='windup'?'zakuHawkReady':'zaku';
  drawDuelPose(images[key]?key:'zaku',e.x,e.y,e.facing>0);
  return true;
 }
 function beginDuelEvasion(e){
  const p=api.player();
  const farX=p.x<W/2?W-90:90;
  const farY=p.y<H/2?H-105:120;
  e.mode='evade';e.turn=0;
  e.evadePoints=[
   {x:clamp(e.x+(e.x<W/2?-115:115),85,W-85),y:e.y<H/2?H-115:115},
   {x:farX,y:farY}
  ];
 }
 function updateDuel(e,dt){
  e.age+=dt;
  if(e.hp<=0)return true;
  const rush=api.duelRush;
  if(e.mode==='approach'||e.mode==='recover'){
   e.timer-=dt;
   if(e.timer<=0){
    if(!e.feinted&&Math.random()<.35){
     beginDuelEvasion(e);
     e.feinted=true;e.mode='feint';
     return true;
    }
    e.feinted=false;
    if(!e.lastSlash&&Math.random()<.6){
     e.lastSlash=true;e.mode='slashWindup';e.timer=.27;
     const p=api.player(),angle=Math.atan2(p.y-e.y,p.x-e.x);
     e.facing=Math.cos(angle)<0?-1:1;
     e.vx=Math.cos(angle)*810;e.vy=Math.sin(angle)*810;
     e.connected=false;
    }else{
     e.lastSlash=false;rush.planCharRush(e);
    }
   }
   return true;
  }
  if(e.mode==='slashWindup'||e.mode==='slash'){
   e.timer-=dt;
   if(e.mode==='slashWindup'){
    if(e.timer<=0){e.mode='slash';e.timer=.68;}
    return true;
   }
   const oldX=e.x,oldY=e.y;
   e.x=clamp(e.x+e.vx*dt,45,W-45);e.y=clamp(e.y+e.vy*dt,95,H-55);
   const p=api.player(),dx=e.x-oldX,dy=e.y-oldY;
   const along=clamp(((p.x-oldX)*dx+(p.y-oldY)*dy)/(dx*dx+dy*dy||1),0,1);
   if(!e.connected&&Math.hypot(p.x-oldX-dx*along,p.y-oldY-dy*along)<29+(api.hitRadius?.()||13)&&!api.meleeSafe?.(e)){
    e.connected=true;api.hit(38,2,e);
   }
   if(e.timer<=0)beginDuelEvasion(e);
   return true;
  }
  if(e.mode==='evade'||e.mode==='feint'){
   const point=e.evadePoints[e.turn];
   const dx=point.x-e.x,dy=point.y-e.y,distance=Math.hypot(dx,dy);
   const travel=(duelEnraged(e)?890:740)*dt;
   const ratio=distance?Math.min(1,travel/distance):1;
   e.x+=dx*ratio;e.y+=dy*ratio;
   if(Math.abs(dx)>1)e.facing=dx<0?-1:1;
   if(ratio===1&&++e.turn===e.evadePoints.length){
    if(e.mode==='feint'){e.mode='recover';e.timer=.18;return true;}
    e.mode='machinegun';e.vx=e.vy=0;e.shotClock=0;
    e.shotsLeft=duelEnraged(e)?8:6;
   }
   return true;
  }
  if(e.mode==='machinegun'){
   e.facing=api.player().x<e.x?-1:1;
   e.shotClock-=dt;
   while(e.shotsLeft>0&&e.shotClock<=1e-8){
    api.fireCharMachinegun(e.x+e.facing*32,e.y,1);
    e.shotsLeft--;e.shotClock+=.19;
   }
   if(e.shotsLeft===0&&e.shotClock<=0){e.mode='recover';e.timer=.34;}
   return true;
  }
  const oldMode=e.mode,oldX=e.x,oldY=e.y;
  rush.updateChar(e,dt,duelEnraged(e)?1.1:.92);
  e.vx=dt>0?(e.x-oldX)/dt:0;e.vy=dt>0?(e.y-oldY)/dt:0;
  if(oldMode==='rushReposition'&&e.mode==='rush')duelPasses++;
  if(e.mode==='rushRecover'){
   beginDuelEvasion(e);
  }
  return true;
 }
 function drawSpace(){ctx.save();ctx.fillStyle='#020b19';ctx.fillRect(0,0,W,H);for(let i=0;i<86;i++){ctx.fillStyle=i%5?'#42647a':'#b3d3e3';ctx.fillRect((i*173-duelAge*(4+i%4)+W*100)%W,(i*97)%H,i%5?1.5:2.5,i%5?1.5:2.5);}sprite('lunaTwo',160-duelAge*1.4,180,320,.3);label('ルナ2外宙域 / シャア隊を迎撃',W/2,112,19);if(duelAge<4)label('ホワイトベースは先行 — シャアを迎撃',W/2,H-80,18);if(duel.hp<=0){drawDuelPose('duelCharMove',duel.x,duel.y+downAge*60,(duel.facing??-1)>0,Math.max(0,1-downAge/2.5));label('シャアザク撃破 — 脱出成功',W/2,210,25);}ctx.restore();}
 function drawDuelPose(key,x,y,flip=false,alpha=1){const a=images[key];if(!a)return;const zaku=images.zaku;const height=zaku?65*zaku.sh/zaku.sw:65;const scale=height/(a.bodyHeight||a.sh);ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(a.im,a.sx,a.sy,a.sw,a.sh,(a.sx-(a.bodyX??a.sx+a.sw/2))*scale,height/2+(a.sy-(a.bodyBottom??a.sy+a.sh))*scale,a.sw*scale,a.sh*scale);ctx.restore();}
 function drawDuel(){
  if(!duel||duel.hp<=0)return;
  ctx.save();ctx.lineCap='round';ctx.lineWidth=3;
  for(const segment of duel.trail||[]){
   const alpha=clamp(1-(duel.age-segment.age)/.42,0,1);
   if(!alpha)continue;
   ctx.strokeStyle='#ff6259';ctx.globalAlpha=alpha*.75;
   ctx.beginPath();ctx.moveTo(segment.x,segment.y);ctx.lineTo(segment.toX,segment.toY);ctx.stroke();
  }
  ctx.restore();
  const blade=duel.mode==='slash'?'zakuHawkSlash':duel.mode==='slashWindup'?'zakuHawkReady':null;
  const key=blade&&images[blade]?blade:duel.mode==='machinegun'?'charFire':
   duel.mode==='rush'||duel.mode==='rushReposition'?api.duelRush.charArt(duel):'duelCharMove';
  if(blade&&images[blade]){
   ctx.save();ctx.filter='sepia(.65) saturate(3.5) hue-rotate(305deg)';
   drawDuelPose(key,duel.x,duel.y,(duel.facing??-1)>0);ctx.restore();
  }else drawDuelPose(key,duel.x,duel.y,(duel.facing??-1)>0);
 }
 function drawDuelBar(){if(!duel||completed)return;ctx.save();ctx.fillStyle='#07182de8';ctx.fillRect(300,18,600,62);label(duelEnraged(duel)?'CHAR ZAKU / 高速戦闘':'CHAR ZAKU / 機動戦闘',W/2,42,19);ctx.fillStyle='#334654';ctx.fillRect(410,58,380,8);ctx.fillStyle='#ff9b89';ctx.fillRect(410,58,380*Math.max(0,duel.hp)/duel.max,8);ctx.restore();}
 let nextGrenadeTime=0;
 const GRENADE_FLIGHT=.65, GRENADE_FUSE=1.65, GRENADE_RADIUS=67;
 function grenadePoint(grenade,progress){
  return {
   x:grenade.startX+(grenade.landX-grenade.startX)*progress,
   y:grenade.startY+(grenade.landY-grenade.startY)*progress-140*progress*(1-progress)
  };
 }
 function tryGuardGrenade(enemy,muzzleX,tuning){
  if(enemy.humanPlan%3!==1||enemy.burstLeft||elapsed<nextGrenadeTime||elapsed<(enemy.nextGrenadeTime??3))return false;
  const player=api.player(),distance=Math.hypot(player.x-muzzleX,player.y-enemy.y);
  if(distance<90||distance>330)return false;
  const landX=player.x+camera.x;
  let floor=player.y+camera.y;
  const maxFloor=floor+80;
  while(floor<maxFloor&&shotPass(landX,floor))floor+=2;
  if(floor>=maxFloor)return false;
  const grenade={type:'guardGrenade',startX:muzzleX+camera.x,startY:enemy.y+camera.y,
   landX,landY:floor-6,x:muzzleX,y:enemy.y,age:0,r:6,blastRadius:GRENADE_RADIUS};
  for(let i=0;i<=50;i++){
   const point=grenadePoint(grenade,i/50);
   if(!shotPass(point.x,point.y))return false;
  }
  api.addBullet(grenade);
  nextGrenadeTime=elapsed+3.8-.2*tuning.rank;
  enemy.nextGrenadeTime=elapsed+10-.5*tuning.rank;
  enemy.grenadePoseUntil=elapsed+.4;
  enemy.shot=tuning.guardInterval;
  return true;
 }
 function updateGuardGrenade(grenade,dt){
  grenade.age+=dt;
  const point=grenadePoint(grenade,Math.min(1,grenade.age/GRENADE_FLIGHT));
  grenade.x=point.x-camera.x;
  grenade.y=point.y-camera.y;
  if(grenade.age<GRENADE_FUSE)return false;
  grenade.coverOriginX=grenade.landX;grenade.coverOriginY=grenade.landY;
  return true;
 }
 function drawGuardGrenade(grenade){
  const x=grenade.landX-camera.x,y=grenade.landY-camera.y;
  ctx.save();
  ctx.strokeStyle='#ffab64';ctx.fillStyle='#e97f281f';ctx.lineWidth=2;
  ctx.setLineDash([6,5]);ctx.beginPath();ctx.arc(x,y,GRENADE_RADIUS,0,2*Math.PI);ctx.fill();ctx.stroke();
  ctx.setLineDash([]);
  ctx.translate(grenade.x,grenade.y);ctx.rotate(Math.min(grenade.age,GRENADE_FLIGHT)*10);
  ctx.fillStyle='#202820';ctx.fillRect(-7,-6,14,12);
  ctx.fillStyle='#9ea871';ctx.fillRect(-4,-5,8,10);
  ctx.fillStyle='#ffbc70';ctx.fillRect(-2,-8,4,3);
  ctx.restore();
  label('!',x,y-14,18);
 }
 function updateCharHunt(){
  if(prototypeChar||elapsed<nextCharHunt)return;
  const offsets=[[-600,-130],[600,-130],[0,-420],[0,420],[-390,70],[390,70]];
  const candidates=offsets.map(([dx,dy])=>({wx:world.x+dx,wy:world.y+dy}))
   .filter(p=>pass(p.wx,p.wy));
  const offscreen=candidates.filter(p=>p.wx<camera.x||p.wx>camera.x+W||p.wy<camera.y||p.wy>camera.y+H);
  const choices=offscreen.length?offscreen:candidates;
  if(!choices.length){nextCharHunt=elapsed+2;return;}
  const plan=choices[Math.floor(Math.random()*choices.length)];
  prototypeChar={type:'zaku',stage4Kind:'humanGuard',humanPlan:-1,huntPlan:plan,huntTrail:[],
   commander:true,flying:true,hp:40,max:40,size:60,age:0,shot:0,
   huntUntil:elapsed+23+Math.random()*8,...plan,x:plan.wx-camera.x,y:plan.wy-camera.y};
  api.add(prototypeChar);
 }
 function startCharRetreat(e){
  if(e.retreatUntil)return;
  e.retreatUntil=elapsed+3.4;
  e.laserTarget=null;e.huntBurst=0;e.aiming=false;e.hp=Math.max(1,e.hp);
 }
 function finishCharDeparture(e){
  e.hp=0;e.retreated=true;prototypeChar=null;
  nextCharHunt=elapsed+15+Math.random()*12;
 }
 function outsideCamera(x,y){
  return x<camera.x-44||x>camera.x+W+44||y<camera.y-44||y>camera.y+H+44;
 }
 function planCharCoverExit(e){
  const first=navIndex(e.wx,e.wy),parents=new Int32Array(free.length).fill(-1);
  const center=cell=>({x:(cell%nav.cols+.5)*nav.cell,y:(Math.floor(cell/nav.cols)+.5)*nav.cell});
  let count=1,end=first,farthest=-1;
  chaseQueue[0]=first;parents[first]=first;
  function visit(next,from){
   if(free[next]!==1||parents[next]>=0)return;
   parents[next]=from;chaseQueue[count++]=next;
  }
  for(let i=0;i<count;i++){
   const cell=chaseQueue[i],p=center(cell),column=cell%nav.cols;
   if(outsideCamera(p.x,p.y)){end=cell;break;}
   const distance=Math.hypot(p.x-world.x,p.y-world.y);
   if(distance>farthest){farthest=distance;end=cell;}
   if(column>0)visit(cell-1,cell);
   if(column<nav.cols-1)visit(cell+1,cell);
   visit(cell-nav.cols,cell);visit(cell+nav.cols,cell);
  }
  const path=[];
  for(let cell=end;;cell=parents[cell]){
   path.push(center(cell));
   if(cell===first)break;
  }
  return {path:path.reverse(),index:0,fade:0};
 }
 function updateCharCoverExit(e,dt){
  const exit=e.coverExit,speed=245;
  while(dt>0&&exit.index<exit.path.length){
   const target=exit.path[exit.index];
   const dx=target.x-e.wx,distance=Math.hypot(dx,target.y-e.wy);
   if(Math.abs(dx)>.01)e.face=Math.sign(dx);
   if(!moveGuard(e,target,speed,dt))break;
   dt-=distance/speed;exit.index++;
  }
  e.x=e.wx-camera.x;e.y=e.wy-camera.y;
  if(outsideCamera(e.wx,e.wy)){finishCharDeparture(e);return;}
  // A closed room can fit entirely on screen. Fade at the far end of its passage.
  if(exit.index===exit.path.length){
   exit.fade+=Math.max(0,dt);
   if(exit.fade>=.38)finishCharDeparture(e);
  }
 }
 function updateCharRetreat(e,dt){
  let waypoint=e.huntTrail[e.huntTrail.length-1];
  if(!waypoint){e.patrolPoint??=patrolWaypoint(e,e.huntPlan);waypoint=e.patrolPoint;}
  if(moveGuard(e,waypoint,290,dt)){
   if(e.huntTrail.length)e.huntTrail.pop();
   else e.patrolPoint=null;
  }
  e.x=e.wx-camera.x;e.y=e.wy-camera.y;
  if(elapsed>=e.retreatUntil)finishCharDeparture(e);
 }
 function updateFlyingGuard(e,plan,dt){
  const tuning=pressure();
  const distance=Math.hypot(world.x-e.wx,world.y-e.wy);
  const direct=distance<650&&guardPathClear(e.wx,e.wy,world.x,world.y);
  const speed=e.huntPlan?145+tuning.rank*8:e.commander?205+tuning.rank*10:135+tuning.rank*7;
  if(e.commander&&(!direct||distance>210)){
   if(direct){
    e.chasePoint=null;
    moveGuard(e,world,speed,dt);
   }else{
    e.chasePoint??=chaseWaypoint(e);
    if(moveGuard(e,e.chasePoint,speed,dt))e.chasePoint=null;
   }
   e.patrolPoint=null;
  }else{
   const flank={x:world.x+(e.wx<world.x?-200:200),y:world.y};
   const withinPost=!e.resourceTier||Math.hypot(world.x-plan.wx,world.y-plan.wy)<390;
   const liningUp=!e.commander&&direct&&withinPost&&e.age%6<2.8&&distance>115&&
    Math.hypot(flank.x-e.wx,flank.y-e.wy)>18&&guardPathClear(e.wx,e.wy,flank.x,flank.y);
   if(liningUp){
    moveGuard(e,flank,speed,dt);
    e.patrolPoint=null;
   }else{
    e.patrolPoint??=patrolWaypoint(e,plan);
    if(moveGuard(e,e.patrolPoint,speed,dt))e.patrolPoint=null;
   }
  }
  e.x=e.wx-camera.x;e.y=e.wy-camera.y;
  e.face=world.x<e.wx?-1:1;
  e.shot-=dt;
  if(e.x<20||e.x>W-20||e.y<30||e.y>H-30){
   e.burstLeft=0;e.laserTarget=null;return;
  }
  const p=api.player(),muzzleX=e.x+e.face*13;
  if(e.commander){
   if(e.huntPlan){updateHuntAttack(e,tuning);return;}
   e.aiming=!!e.laserTarget;
   if(e.shot>0)return;
   if(e.laserTarget){
    const target={x:e.laserTarget.x-camera.x,y:e.laserTarget.y-camera.y};
    laserShot(muzzleX,e.y,target);
    e.laserTarget=null;e.aiming=false;e.shot=1.65-.10*tuning.rank;
   }else if(shotLineClear({x:muzzleX,y:e.y},p)){
    e.laserTarget={...world};
    e.aiming=true;e.shot=.32;
   }
  }else if(e.shot<=0&&(e.burstLeft>0||shotLineClear({x:muzzleX,y:e.y},p))){
   if(!e.resourceTier||e.resourceTier<3||!tryGuardGrenade(e,muzzleX,tuning))fireGuardBurst(e,muzzleX,tuning,p);
  }
 }
 function updateHuntAttack(e,tuning){
  if(e.shot>0)return;
  const player=api.player(),x=e.x+e.face*15,y=e.y;
  if(!shotLineClear({x,y},player)){e.huntBurst=0;return;}
  let angle=Math.atan2(player.y-y,player.x-x);
  if(!e.huntBurst){
   const speed=710+tuning.rank*22;
   api.addBullet({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
    r:4,w:38,h:7,type:'laser',charBeam:true,angle,damage:28,huntShot:true,coverOriginX:x+camera.x,coverOriginY:y+camera.y});
   e.huntBurst=6;e.shot=.23;
  }else{
   angle+=(Math.random()-.5)*.22;
   const speed=395+tuning.rank*12;
   api.addBullet({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
    r:4,damage:14,huntShot:true,coverOriginX:x+camera.x,coverOriginY:y+camera.y});
   e.huntBurst--;
   e.shot=e.huntBurst?.10:.62;
  }
 }
 function squadContainerPost(e){
  for(const plan of tileCoverPlans){
   const [box]=coverBoxes(plan);
   if(Math.hypot(box.x-e.wx,box.y-e.wy)>170)continue;
   const x=box.x+(world.x<box.x?1:-1)*(box.w/2+24),y=box.y;
   if(!guardPathClear(e.wx,e.wy,x,y)||!lineCrossesCover(x,y,world.x,world.y,box))continue;
   for(const side of [-1,1]){
    const peekY=y+side*(box.h/2+34);
    if(guardPathClear(x,y,x,peekY)&&crossfireLineClear(x,peekY,world.x,world.y)){
     return {x,y,peekY,reached:false,plan,box};
    }
   }
  }
  return null;
 }
 function updateSquadGuard(e,plan,dt){
  const {team,rank}=plan,heading=team.heading;
  const distance=Math.hypot(world.x-team.x,world.y-team.y);
  const tuning=pressure();
  const pursuitSpeed=105;
  e.shot-=dt;
  const seesPlayer=!(api.player().dying>0)&&!enemyLostPlayer(e)&&Math.hypot(world.x-e.wx,world.y-e.wy)<530&&
   crossfireLineClear(e.wx,e.wy,world.x,world.y);
  if(seesPlayer&&!e.sawPlayer)e.shot=Math.min(e.shot,.12);
  e.sawPlayer=seesPlayer;
  if(e.coverPost&&!lineCrossesCover(e.coverPost.x,e.coverPost.y,world.x,world.y,e.coverPost.box)){
   e.coverPost=null;e.hidden=false;
  }
  if(!seesPlayer&&!e.coverPost&&distance<=710){
   e.burstLeft=0;
   const post=federationPosts.find(ally=>
    Math.hypot(e.wx-ally.x,e.wy-ally.y)<460&&crossfireLineClear(e.wx,e.wy,ally.x,ally.y));
   if(post){
    e.hidden=false;e.coverPost=null;
    e.face=post.x<e.wx?-1:1;
    e.x=e.wx-camera.x;e.y=e.wy-camera.y;
    if(elapsed>=(e.crossfireShot??0)){
     fireCrossfire(e.wx+e.face*15,e.wy,post,false);
     e.crossfireFlash=elapsed+.11;e.crossfireShot=elapsed+.21+(rank%3)*.055;
    }
    return;
   }
  }
  if(seesPlayer&&rank>=2&&e.age>.85&&!e.coverPost)e.coverPost=squadContainerPost(e);
  if(!seesPlayer&&!e.coverPost){
   e.coverPost=null;e.hidden=false;e.burstLeft=0;
   moveGuard(e,{x:plan.wx,y:plan.wy},165,dt);
  }else if(e.coverPost){
   const post=e.coverPost;
   if(!post.reached)post.reached=moveGuard(e,post,175,dt);
   const phase=(e.age+(rank-2)*.8)%3.1;
   const peek=post.reached&&phase>1.35&&phase<2.65;
   const peekPoint={x:post.x,y:post.peekY};
   if(post.reached)moveGuard(e,peek?peekPoint:post,160,dt);
   e.hidden=post.reached&&!peek&&Math.hypot(post.x-e.wx,post.y-e.wy)<26;
   if(e.hidden)e.burstLeft=0;
  }else{
   const flank=rank===0?0:rank%2===1?1:-1;
   const stop=155+rank*42;
   const target={x:world.x-heading.x*stop-heading.y*flank*58,
    y:world.y-heading.y*stop+heading.x*flank*58};
   if(guardPathClear(e.wx,e.wy,target.x,target.y)){
    moveGuard(e,target,pursuitSpeed,dt);e.chasePoint=null;
   }else if(Math.hypot(world.x-e.wx,world.y-e.wy)>240){
    e.chasePoint??=chaseWaypoint(e);
    if(moveGuard(e,e.chasePoint,pursuitSpeed,dt))e.chasePoint=null;
   }
  }
  e.x=e.wx-camera.x;e.y=e.wy-camera.y;e.face=world.x<e.wx?-1:1;
  if(!seesPlayer||e.hidden||e.x<20||e.x>W-20||e.y<30||e.y>H-30||e.shot>0)return;
  const muzzleX=e.x+e.face*13,p=api.player();
  if(!e.burstLeft&&!shotLineClear({x:muzzleX,y:e.y},p))return;
  if(rank===0&&plan.resourceTier===3&&tryGuardGrenade(e,muzzleX,tuning))return;
  fireGuardBurst(e,muzzleX,tuning,p);
 }
 function fireGuardBurst(e,muzzleX,tuning,player){
  if(!e.burstLeft){
   const horizontal=Math.abs(player.y-e.y)<42&&Math.abs(player.x-muzzleX)>80;
   e.burstLeft=horizontal?(tuning.level>=4?8:6):(tuning.level>=4?3:2);
   if(e.resourceTier===3)e.burstLeft+=horizontal?2:1;
   e.burstAngle=horizontal?(e.face<0?Math.PI:0):Math.atan2(player.y-e.y,player.x-muzzleX);
   e.burstDelay=horizontal?.12:.20;
  }
  const angle=e.burstAngle;
  api.addBullet({x:muzzleX,y:e.y,vx:Math.cos(angle)*175,vy:Math.sin(angle)*175,r:4,coverOriginX:muzzleX+camera.x,coverOriginY:e.y+camera.y});
  e.burstLeft--;
  e.shot=e.burstLeft>0?e.burstDelay:tuning.guardInterval-(e.resourceTier===3?.75:0);
 }
 function updateEnemy(e,dt){if(e.stage4Kind==='duelEscort')return updateDuelEscort(e,dt);if(e.stage4Kind==='duelChar'){
  const {x,y,mode}=e;
  const result=updateDuel(e,dt);
  e.trail=(e.trail||[]).filter(segment=>e.age-segment.age<.42);
  if(['feint','evade','slash','rush'].includes(mode)&&Math.hypot(e.x-x,e.y-y)>1){
   e.trail.push({x,y,toX:e.x,toY:e.y,age:e.age});
  }
  return result;
 }if(!active&&e.stage4Kind==='soldier'){return legacy.updateEnemy(e,dt*(1+pressure().rank*.05));}if(e.stage4Kind!=='humanGuard')return active?false:legacy.updateEnemy(e,dt);e.age+=dt;
 if(e.huntPlan){
  if(e.coverExit){updateCharCoverExit(e,dt);return true;}
  if(elapsed>=e.huntUntil)startCharRetreat(e);
  if(e.retreatUntil){updateCharRetreat(e,dt);return true;}
  if(enemyLostPlayer(e)){
   e.aiming=false;e.huntBurst=0;e.coverExit=planCharCoverExit(e);
   updateCharCoverExit(e,dt);return true;
  }
  e.huntTrail.push({x:e.wx,y:e.wy});
  if(e.huntTrail.length>220)e.huntTrail.shift();
  updateFlyingGuard(e,e.huntPlan,dt);return true;
 }
 const plan=plans[e.humanPlan];plan.hp=e.hp;
 if(plan.team){
  updateSquadGuard(e,plan,dt);return true;
 }
 if(e.flying){updateFlyingGuard(e,plan,dt);return true;}
 const wave=e.age%5.5;e.aiming=wave>=1.4&&wave<2.1;if(e.aiming&&!e.wasAiming)e.aimTarget={x:api.player().x,y:api.player().y};e.wasAiming=e.aiming;const wantsHide=plan.floor!==null&&wave<1.4,side=api.player().x<plan.wx-camera.x?-1:1;const peekX=plan.peek.find(x=>Math.sign(x-plan.wx)===side)??plan.peek[0]??plan.wx;const target={x:wantsHide?plan.wx:peekX,y:plan.wy};moveGuard(e,target,160,dt);e.coverX=plan.wx-camera.x;e.coverY=(plan.floor??plan.wy)-camera.y;e.hidden=wantsHide&&Math.hypot(e.wx-plan.wx,e.wy-plan.wy)<18;e.coverPeeking=plan.floor===null||Math.hypot(e.wx-plan.wx,e.wy-plan.wy)>=38;e.x=e.wx-camera.x;e.y=e.wy-camera.y;e.face=api.player().x<e.x?-1:1;e.shot-=dt;
 if(e.hidden||e.aiming||!e.coverPeeking)e.burstLeft=0;
 if(!e.hidden&&!e.aiming&&e.coverPeeking&&e.shot<=0&&e.x>20&&e.x<W-20&&e.y>30&&e.y<H-30){
  const tuning=pressure(),muzzleX=e.x+e.face*13;
  if(e.commander){
   e.shot=tuning.charInterval;
   laserShot(muzzleX,e.y,e.aimTarget||api.player());
  }else if(!tryGuardGrenade(e,muzzleX,tuning)){
   fireGuardBurst(e,muzzleX,tuning,api.player());
  }
 }
 if(Math.hypot(api.player().x-e.x,api.player().y-e.y)<35&&!e.hidden)api.hit(15,1,e);return true;}
 function drawEnemyThrust(e){
  ctx.save();ctx.fillStyle='#52dfff';ctx.fillRect(e.x-e.face*16-2,e.y+19,5,14+Math.sin(e.age*55)*3);
  ctx.fillStyle='#defcff';ctx.fillRect(e.x-e.face*16,e.y+20,2,8);ctx.restore();
 }
 function drawEnemy(e){if(e.stage4Kind==='duelEscort')return drawDuelEscort(e);if(e.stage4Kind==='duelChar'){drawDuel();return true;}if(!active&&e.stage4Kind==='soldier'){ctx.save();ctx.translate(e.x,e.y);if(e.top)ctx.scale(1,-1);drawPerson('humanZeon'+(e.launcher?'Bazooka':'Rifle')+(e.aiming?'Ready':e.hidden?'Move':'Fire'),0,0,26,e.facing===1?-1:1);ctx.restore();if(e.red)label('P',e.x,e.y-28,12);return true;}if(e.stage4Kind!=='humanGuard')return active?false:legacy.drawEnemy(e);const exitFade=e.coverExit?.fade||0;if(e.flying&&!e.hidden&&!exitFade)drawEnemyThrust(e);const key=e.commander?'humanCharRifle':'humanZeonRifle'+(e.aiming||e.grenadePoseUntil>elapsed?'Ready':e.hidden?'Move':e.crossfireFlash>elapsed||e.shot>pressure().guardInterval-.32||e.burstLeft>0?'Fire':'Move');drawPerson(key,e.x,e.y+(e.coverPost?.reached&&e.hidden?9:0),e.coverPost?.reached&&e.hidden?45:60,e.face===1?-1:1,Math.max(0,1-exitFade/.38)*(e.hitUntil>elapsed?.55:1));if(e.coverPost&&e.hidden)drawHumanCover(e.coverPost.plan);if(!e.huntPlan)drawHumanCover(plans[e.humanPlan]);else if(e.coverExit){if(!exitFade)label('シャア離脱中',e.x,e.y-46,14);}else if(e.retreatUntil)label('シャア撤退中',e.x,e.y-46,14);else label('シャア HP '+Math.ceil(e.hp),e.x,e.y-46,14);if(e.aiming||e.grenadePoseUntil>elapsed)label('!',e.x,e.y-38,18);if(e.red&&!e.hidden)label('P',e.x,e.y-40,12);return true;}
 function damage(e,n,source){if(e.stage4Kind==='duelEscort')return duel.hp>0?n:0;if(e.retreatUntil)return 0;if(e.stage4Kind==='duelChar'){if(e.hp<=0)return 0;const d=Math.min(e.hp,duelBudget,n*(e.mode==='recover'||e.mode==='machinegun'?1:e.mode==='rush'?.12:.32));duelBudget-=d;return d;}if(e.stage4Kind!=='humanGuard')return active?n:legacy.filterDamage(e,n,source);if(e.hidden&&!(source?.r>=50))return 0;return n;}
 function killed(e){if(e.stage4Kind==='duelChar'){if(!e.paid){e.paid=true;api.score(2400);api.material(e.x,e.y,3,3);api.explode(e.x,e.y,'#ffc199',35);}return true;}if(e.stage4Kind!=='humanGuard')return active?false:legacy.onKilled(e);if(e.huntPlan){startCharRetreat(e);return true;}if(prototype){
  const plan=plans[e.humanPlan];
  if(plan.dead)return true;
  plan.dead=true;
  api.explode(e.x,e.y,'#e6bd84',8,'silent');
  if(plan.rank===0)api.capsule(e.x,e.y);
  return true;
 }if(e.paid)return true;e.paid=true;plans[e.humanPlan].dead=true;api.score(e.commander?600:150);api.explode(e.x,e.y,'#e6bd84',8,'silent');if(e.red)api.capsule(e.x,e.y);else api.material(e.x,e.y,1,1);return true;}
 function shotLineClear(a,b){
  const dx=b.x-a.x,dy=b.y-a.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/8));
  for(let i=0;i<=steps;i++){
   if(!shotPass(a.x+dx*i/steps+camera.x,a.y+dy*i/steps+camera.y))return false;
  }
  return true;
 }
 function guideBazooka(s,dt,targets,checkWalls){
  const wrap=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
  let heading=Math.atan2(s.vy,s.vx);
  s.flightAge=(s.flightAge||0)+dt;
  if(s.flightAge>.3&&s.flightAge<2.2){
   let aim=null,best=480;
   for(const enemy of targets){
    const dx=enemy.x-s.x,dy=enemy.y-s.y,distance=Math.hypot(dx,dy);
    const bearing=Math.atan2(dy,dx);
    if(distance>=best||Math.abs(wrap(bearing-heading))>Math.PI*.62||
     checkWalls&&!shotLineClear(s,enemy))continue;
    aim=bearing;best=distance;
   }
   if(aim!==null)heading+=clamp(wrap(aim-heading),-1.1*dt,1.1*dt);
  }
  const speed=185+Math.min(45,s.flightAge*20);
  s.vx=Math.cos(heading)*speed;s.vy=Math.sin(heading)*speed;
 }
 function intercept(s,previous){if(duel){s.hitTargets ||= new Set();for(const target of api.enemies())if((target===duel||target.stage4Kind==='duelEscort')&&target.hp>0&&!s.hitTargets.has(target)&&Math.abs(s.x-target.x)<s.w/2+27&&Math.abs(s.y-target.y)<s.h/2+28){if(['bazooka','cannon'].includes(s.kind)){api.detonate(s);return true;}api.damage(target,s.damage,{x:s.x,y:s.y,r:Math.max(s.w,s.h)/2});s.hitTargets.add(target);if(s.kind!=='laser'){s.life=0;return true;}}return false;}if(!active)return legacy.interceptShot(s);
 if(s.guidedBazooka&&previous&&!shotLineClear(previous,s)){
  const dx=s.x-previous.x,dy=s.y-previous.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));
  for(let i=1;i<=steps;i++){
   const x=previous.x+dx*i/steps,y=previous.y+dy*i/steps;
   if(!shotPass(x+camera.x,y+camera.y)){
    s.x=previous.x+dx*(i-1)/steps;s.y=previous.y+dy*(i-1)/steps;
    break;
   }
  }
  api.detonate(s);
  return true;
 }
 if(!shotPass(s.x+camera.x,s.y+camera.y)){if(['bazooka','cannon'].includes(s.kind))api.detonate(s);else s.life=0;return true;}s.hitTargets ||= new Set();for(const e of api.enemies()){if(e.stage4Kind!=='humanGuard'||e.hp<=0||s.hitTargets.has(e))continue;if(Math.abs(s.x-e.x)>s.w/2+24||Math.abs(s.y-e.y)>s.h/2+24)continue;if(['bazooka','cannon'].includes(s.kind)){api.detonate(s);return true;}api.damage(e,s.damage,{x:s.x,y:s.y,r:Math.max(s.w,s.h)/2});s.hitTargets.add(e);if(s.kind!=='laser'){s.life=0;return true;}}return false;}
 function snapshot(){const old=legacy.snapshot();return {...old,version:'S4.5',mazeTest:prototype?{signature:prototype.signature,reached:prototypeReached,visited:visitedRooms.size}:null,pressure:pressure(),terrainEdgeCount:terrainEdges.length,completed,duelAge,duelPasses,duelBudget,duel:duel?{x:duel.x,y:duel.y,hp:duel.hp,max:duel.max,mode:duel.mode,timer:duel.timer,target:duel.target,vx:duel.vx,vy:duel.vy,downAge}:null,human:active,burner:burnerStatus(),pending,playerCover:playerCover?{...playerCover}:null,coverTargets:coverTargets(),world:{...world},camera:{...camera},boarding,boardSwitched,boardAge,carry,progress:step/(nav.route.length-1),routeStep:step,goal:boardingGoal,start:nav.start,facing,maze:{width:nav.width,height:nav.height,cell:nav.cell},guards:api.enemies().filter(e=>e.stage4Kind==='humanGuard').map(e=>({id:e.humanPlan,x:e.x,y:e.y,wx:e.wx,wy:e.wy,hidden:e.hidden,hp:e.hp,red:e.red,commander:e.commander})),harborRects:duel?[]:old.harborRects,scene:active?'human-maze':duel?completed?'stage-complete':duel.hp<=0?'duel-victory':'char-duel':old.failed?'escape-failed':old.phase===3?'departure':old.started?'magellan-blockade':33+boardAge>=80?'dock-exit':'gundam-scroll'};}
 return {...legacy,meleeLineClear:shotLineClear,guideBazooka,updateGuardGrenade,drawGuardGrenade,reset,activateBurner,burnerStatus,canToggleCover,toggleCover,coverBlocks,get playerHidden(){return !!playerCover&&coverAvailable();},get walkingMode(){return walkingMode();},update:tick,advanceBoarding,drawOverlay:drawFade,constrain,drawBackdrop:backdrop,drawEnemy,updateEnemy,filterDamage:damage,onKilled:killed,interceptShot:intercept,drawPlayer,drawHumanOption:drawOption,drawHumanHammer:drawHammer,snapshot,boundary:(wx,top)=>(active||duel)?(top?0:H):legacy.boundary(wx,top),drawBoss:()=>{if(duel)drawDuelBar();else if(!active)legacy.drawBoss();},get inBoarding(){return boarding>0;},get inBlockadeIntro(){return !active&&!duel&&legacy.inBlockadeIntro;},get magellanBgmFade(){return !active&&!duel&&legacy.magellanBgmFade;},get humanActive(){return active;},get usesTileMaze(){return !!prototype;},get facing(){return facing;},get pending(){return pending;},get routeScroll(){return active?0:legacyScroll;},get harborActive(){return (active||duel)?false:legacy.harborActive;},get zone(){return prototype&&active?(api.explorationTest?'ルナ2内部 / 探索試作':'ルナ2内部 / ガンダム搭乗へ'):active?'アムロ潜入 / 搭乗地点へ':duel?'ルナ2外 / シャアザク決闘':legacy.zone;},restoreHuman:()=>{if(active){resetBurner();const p=api.player();p.x=safe.x-camera.x;p.y=safe.y-camera.y;api.stopTarget(p);}},blocksEnemyBullet:(b,previous)=>{if(active)return (previous?!shotLineClear(previous,b):!shotPass(b.x+camera.x,b.y+camera.y))||tileCoverStopsBullet(previous,b)||(coverBlocks(b)&&Math.abs(b.x-api.player().x)<(b.w||0)/2+(b.r||0)+(api.hitRadius?.()||15)+20&&Math.abs(b.y-api.player().y)<(b.h||0)/2+(b.r||0)+(api.hitRadius?.()||15)+20);if(duel)return false;return b.y<=legacy.boundary(legacyScroll+b.x,true)||b.y>=legacy.boundary(legacyScroll+b.x,false)||legacy.snapshot().harborRects.some(r=>r.kind==='platform'&&b.x>r.x+12&&b.x<r.x+r.w-12&&b.y>r.y+8&&b.y<r.y+r.h-8);},passable:pass};
};})();
