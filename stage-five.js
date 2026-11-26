(function(root){
'use strict';
root.StageFiveArt={
 shipRecover:['assets/white-base-cooling-to-normal-12frames.png',3,4],
 suitRecover:['assets/sd-gundam-cooling-to-normal-12frames.png',4,3],
 shipCooling:['assets/white-base-bottom-up-cooling-12frames.png',3,4],
 moon:['assets/white-daytime-moon-lower-left-phase-v3.png',1,1],
 earth:['assets/earth-lower-screen-horizon-v2.png',1,1],
 landingSuit:['assets/sd-gundam-cooling-film-4frames.png',2,2],
 komusai:['assets/komusai-atmospheric-reentry-right.png',1,1],
 entryNew:['assets/sd-gundam-blue-film-continuation-12frames.png',4,3],
 coolingNew:['assets/sd-gundam-flame-orange-to-blue-12frames.png',4,3],
 hotRocks:['assets/reentry-hot-rocks-six-small-v2.png',3,2],
 entryGundam:['assets/gundam-atmospheric-reentry-heated-4frames-v2.png',2,2],
 entryZaku:['assets/zaku-atmospheric-reentry-heated-4frames-v2.png',2,2],
 burningZaku:['assets/zaku-reentry-disintegration-upper-left-12frames.png',4,3],
 entryWhiteBase:['assets/white-base-reentry-4frames.png',2,2],
 bazookaChar:['assets/sd-char-zaku-bazooka-actions-12.png',4,3],
 lingeringBlast:['assets/bazooka-airburst-lingering-12frames.png',4,3],
 landingDeck:['assets/white-base-rear-landing-deck-v2.png',1,1]
};
root.createStageFive=function(api){
 const {W,H,ctx,images,sprite}=api;
 const HOT_ZONE_HEIGHT=125;
 const DESCENT_SECONDS=30,COOLING_SECONDS=6,COOLING_START=15,COOLING_TRANSITION=15,COOLING_VOICE_CUE=11;
 const bodyFrames={
 suitRecover:[[223.5,171,253],[223.5,171,253],[223.5,171,253],[223.5,171,253],[223.5,171,253],[223.5,171,253],[223.5,171,253],[223.5,171,253],[223.5,171,253],[223.5,171,253],[223.5,171,253],[223.5,171,253]],
 landingSuit:[[389,335,260],[338,335,260],[389,315,260],[338,315,260]],
 entryNew:[[225.5,166.5,244],[218.5,166,243],[213,166,243],[210,165.5,242],[222,179,237],[218.5,178.5,238],[214,179,237],[211,179,237],[222.5,173.5,248],[218.5,173.5,248],[215,173.5,248],[210.5,173.5,248]],
 coolingNew:[[224.5,165.5,242],[219,166,243],[215,168.5,248],[217.5,170.5,252],[223.5,171,253],[223.5,171,253],[220.5,171,253],[219,171,253],[223.5,171,253],[223.5,171,253],[223,171,253],[222.5,171,253]],
  entryGundam:[[395.5,338,241],[328.5,340,237],[395,310.5,240],[328,312.5,240]],
  coolingCenter:[[218.5,181,251],[219,180,251],[218.5,181,251],[218.5,180,251],
   [218.5,181,251],[219,180.5,250],[218,181,251],[217,180.5,250],
   [217,180.5,250],[219,180.5,250],[217,180.5,250],[219.5,180.5,250]]
 };
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const names={escort:'カプセル護衛',waves:'ムサイ援護ミサイル',char:'シャア / バズーカ爆風',retreat:'シャア撤退',lastZaku:'突入直前 / 最後のザク',burnup:'ザク燃焼',descent:'大気圏突入',cooling:'冷却膜展開',breakthrough:'大気圏突破中',blueSky:'大気圏突破',landing:'ホワイトベースへ着艦',finish:'地球降下'};
 let phase,age,total,waveClock,missileClock,rockClock,ace,lastZaku,pod,hazards,projectiles,rocks;
 let budget,completed,notice,noticeUntil,entryAge,gritClock,coolingCue,landingY,landingDeckY,landingFuel,fuelDrops,fuelClock,earthCue,finishFade,skyShipStart,landingShipStart,skyAge,shipCoolingTime;
 function reset(bossOnly=false){
  phase=bossOnly?'char':'escort';age=total=0;waveClock=missileClock=rockClock=0;
  ace=lastZaku=null;pod={x:W+60,y:H*.56,hp:10,max:10,failed:false};
  hazards=[];projectiles=[];rocks=[];budget=4;completed=false;notice='';noticeUntil=0;entryAge=0;gritClock=.6;coolingCue={};landingY=105;landingDeckY=H*.82;landingFuel=0;fuelDrops=[];fuelClock=2;earthCue={};finishFade=0;skyShipStart={x:150,y:150};landingShipStart=H*.82+35;skyAge=0;shipCoolingTime=-1;
 }
 function say(text,duration=3){notice=text;noticeUntil=total+duration;}
 function spawn(kind,x,y,hp,extra={}){
  const e={type:'zaku',stage5Kind:kind,x,y,hp,max:hp,size:65,age:0,shot:1,paid:false,turrets:[],guards:[],...extra};api.add(e);return e;
 }
 function enter(next){
  phase=next;age=0;waveClock=missileClock=rockClock=0;api.clearThreats();
  projectiles=[];hazards=[];
  if(!['burnup','descent','cooling','breakthrough'].includes(next))rocks=[];
  api.setBoss(null);
  if(next==='char'){ace=spawn('char',W+70,H*.36,64);api.setBoss(ace);say('炸裂後も残る爆風を避けろ',4);}
  if(next==='lastZaku'){if(ace){ace.recovery={};ace.recoveryX=ace.x;ace.recoveryY=ace.y;ace.boarding=0;ace.storyStep=api.storyVoice?'bright':'char';if(api.storyVoice)api.storyVoice('stage5BrightReturn');else api.recoveryVoice?.();}lastZaku=spawn('lastZaku',W+50,H*.46,38);api.setBoss(lastZaku);say('大気圏突入 — 最後のザクとの戦闘',4);}
  if(next==='descent'){api.clearPickups?.();say('斜め右下へ降下 — 燃える隕石を回避',4);}
  if(next==='cooling'){coolingCue.afterChar={};api.storyVoice?.('stage5CharAfterCooling');say('冷却完了 — 着艦準備',5);}
  if(next==='blueSky'){skyAge=0;skyShipStart={x:150,y:150+Math.min(entryAge*1.2,H*.5-150)};api.beginReliefMusic?.();fuelClock=1.5;api.clearPickups?.();say('推進用素材を回収 — 着艦時の落下を緩和',5);}
  if(next==='finish'){earthCue={};finishFade=0;}
  if(next==='landing'){landingShipStart=H*.82+35;fuelDrops=[];const p=api.player();landingY=p.y;landingDeckY=Math.min(H-12,Math.max(H*.82,p.y+12));api.stopTarget(p);say('左右操作のみ — 後部の青い着艦エリアを狙え',5);}
 }
 function spawnWave(){
  const y=145+Math.random()*(H-310);
  for(let i=0;i<3;i++)spawn('zaku',W+50+i*66,clamp(y+(i-1)*60,100,H-90),4,{base:y+(i-1)*60,wing:i});
 }
 function fireMissile(){
  const y=100+Math.random()*(H-210),target=phase==='escort'&&!pod.failed?pod:api.player();
  const a=Math.atan2(target.y-y,target.x-(W+30));
  projectiles.push({kind:'missile',x:W+30,y,vx:Math.cos(a)*220,vy:Math.sin(a)*220,age:0,target});
 }
 function hammerStops(x,y,r,oldX,oldY){
  const defense=api.hammerDefense?.();
  if(!defense||defense.level<2)return false;
  const dx=x-oldX,dy=y-oldY;
  const along=clamp(((defense.x-oldX)*dx+(defense.y-oldY)*dy)/(dx*dx+dy*dy||1),0,1);
  if(Math.hypot(defense.x-oldX-dx*along,defense.y-oldY-dy*along)>=r+14)return false;
  api.explode(x,y,'#ffdb97',7,'silent');
  return true;
 }
 function updateProjectiles(dt){
  for(const q of projectiles){
   q.age+=dt;
   if(q.kind==='missile'&&q.age<1.3){
    const target=q.target===pod?pod:api.player(),a=Math.atan2(q.vy,q.vx),desired=Math.atan2(target.y-q.y,target.x-q.x);
    const change=Math.atan2(Math.sin(desired-a),Math.cos(desired-a)),angle=a+clamp(change,-.55*dt,.55*dt);
    q.vx=Math.cos(angle)*220;q.vy=Math.sin(angle)*220;
   }
   const ox=q.x,oy=q.y;q.x+=q.vx*dt;q.y+=q.vy*dt;
   if(hammerStops(q.x,q.y,9,ox,oy)){q.dead=true;continue;}
   if(q.kind==='bazooka'&&q.age>=q.fuse){
    q.dead=true;
    if(hazards.length<6)hazards.push({x:q.targetX,y:q.targetY,age:0,r:50});
   }
   if(q.kind==='missile'&&phase==='escort'&&!pod.failed&&Math.hypot(q.x-pod.x,q.y-pod.y)<30){
    q.dead=true;pod.hp=Math.max(0,pod.hp-1);api.explode(q.x,q.y,'#ffb97a',10,'silent');
    if(!pod.hp){pod.failed=true;say('カプセル護衛失敗 — 戦闘を継続',4);}
   }
   const p=api.player(),dx=q.x-ox,dy=q.y-oy,t=clamp(((p.x-ox)*dx+(p.y-oy)*dy)/(dx*dx+dy*dy||1),0,1);
   if(!q.dead&&Math.hypot(p.x-ox-dx*t,p.y-oy-dy*t)<9+api.hitRadius()){api.hit(18,1);q.dead=true;}
  }
  projectiles=projectiles.filter(q=>!q.dead&&q.age<7&&q.x>-80&&q.x<W+100&&q.y>-100&&q.y<H+100);
  for(const h of hazards){h.age+=dt;if(hammerStops(h.x,h.y,h.r,h.x,h.y)){h.age=5;continue;}if(h.age>.18&&h.age<4.4&&Math.hypot(api.player().x-h.x,api.player().y-h.y)<h.r+api.hitRadius())api.hit(22,1);}
  hazards=hazards.filter(h=>h.age<4.9);
 }
 function updateRocks(dt){
  const intensity=['descent','cooling','breakthrough'].includes(phase)?Math.min(8,Math.floor(entryAge/10))/8:0;
  gritClock-=dt;rockClock-=dt;
  if(gritClock<=0&&(phase!=='breakthrough'||age<7)){
   const x=W+35,y=85+Math.random()*(H-170),p=api.player();
   const angle=Math.atan2(p.y-y,p.x-x),speed=270+Math.random()*85+intensity*100;
   rocks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:7,small:true,variant:Math.floor(Math.random()*6)});
   gritClock=phase==='breakthrough'?.65*(1+age*.8):['descent','cooling'].includes(phase)?.65-intensity*.35:.85;
  }
  if(['descent','cooling','breakthrough'].includes(phase)&&rockClock<=0&&(phase!=='breakthrough'||age<5)){
   const fromBottom=Math.random()<.4;
   const x=fromBottom?120+Math.random()*(W-180):W+65;
   const y=fromBottom?H+65:70+Math.random()*(H-140);
   const p=api.player();
   const angle=Math.atan2(p.y-y,p.x-x)+(Math.random()-.5)*.75;
   const speed=440+Math.random()*240+intensity*170;
   rocks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:20+Math.random()*26});
   rockClock=(.65+Math.random()*.4)*(1-intensity*.5)*(phase==='breakthrough'?1+age*.8:1);
  }
  for(const r of rocks){
   const x=r.x,y=r.y;r.x+=r.vx*dt;r.y+=r.vy*dt;
   if(r.small&&hammerStops(r.x,r.y,r.r,x,y)){r.erased=true;continue;}
   const p=api.player(),dx=r.x-x,dy=r.y-y;
   const along=clamp(((p.x-x)*dx+(p.y-y)*dy)/(dx*dx+dy*dy||1),0,1);
   if(Math.hypot(p.x-x-dx*along,p.y-y-dy*along)<r.r*.7+api.hitRadius())api.hit(r.small?12:24,1);
  }
  rocks=rocks.filter(r=>!r.erased&&r.x>-100&&r.x<W+150&&r.y>-100&&r.y<H+150);
 }
 function update(t,dt){
  if(completed||api.player().dying>0)return;
  age+=dt;total+=dt;if(['blueSky','landing','finish'].includes(phase))skyAge+=dt;
  if(heated()&&ace&&api.storyVoice){
   if(ace.storyStep==='charGap'){ace.dialogueGap-=dt;if(ace.dialogueGap<=0){ace.storyStep='char';api.storyVoice('stage5CharRecovery');}}
   const cues={bright:'stage5BrightReturn',char:'stage5CharRecovery',amuro:'stage5TellAmuro',crown:'stage5CrownFinal',scream:'stage5CrownScream'};
   const name=cues[ace.storyStep];
   if(name&&api.storyFinished(ace.recovery,name,dt)){
    if(ace.storyStep==='bright'){ace.storyStep='charGap';ace.dialogueGap=2;}
    else if(ace.storyStep==='char'){ace.storyStep='boarding';ace.recoveryDone=true;}
    else if(ace.storyStep==='amuro'){ace.storyStep='crown';api.storyVoice('stage5CrownFinal');}
    else if(ace.storyStep==='crown'){ace.storyStep='scream';api.storyVoice('stage5CrownScream');lastZaku.hp=0;if(!lastZaku.paid){lastZaku.paid=true;api.score(1600);}enter('burnup');}
    else ace.storyStep='done';
   }
   if(ace.storyStep==='boarding'&&ace.recovered){ace.storyStep='amuro';api.storyVoice('stage5TellAmuro');}
  }
  if(heated()&&ace&&!ace.recovered){
   if(!api.storyVoice&&!ace.recoveryDone)ace.recoveryDone=api.recoveryFinished?api.recoveryFinished(ace.recovery,dt):entryAge>=11.5;
   if(ace.recoveryDone){ace.boarding=Math.min(1,ace.boarding+dt/4);const t=ace.boarding;ace.x=ace.recoveryX+(W*.82-ace.recoveryX)*t;ace.y=ace.recoveryY+(H*.76-ace.recoveryY)*t;if(t>=1)ace.recovered=true;}
  }
  if(shipCoolingTime>=0)shipCoolingTime+=dt;
  if(ace?.storyStep==='amuro'){const position=api.storyPosition?.(ace.recovery,'stage5TellAmuro')||0;if(position>=27.6)shipCoolingTime=Math.max(0,position-27.6);}
  budget=Math.min(4,budget+7*dt);updateProjectiles(dt);
  if(heated())entryAge+=dt;
  if(['lastZaku','burnup','descent','cooling','breakthrough'].includes(phase))updateRocks(dt);
  if(phase==='escort'){
   if(age<26){pod.x=Math.max(340,pod.x-100*dt);pod.y=H*.56+Math.sin(total*.8)*22;}
   waveClock-=dt;missileClock-=dt;
   if(waveClock<=0&&age<22){spawnWave();waveClock=4.8;}
   if(missileClock<=0&&age>3&&age<24){fireMissile();missileClock=2.7;}
   if(age>=26){
    if(!pod.failed){
     pod.x-=150*dt;pod.y-=55*dt;
     if(pod.x<170){api.score(1500);for(const y of [-25,0,25])api.capsule(210,H*.45+y);say('護衛成功 — カプセル着艦');phase='waves';age=0;waveClock=missileClock=1;}
    }else enter('waves');
   }
  }else if(phase==='waves'){
   waveClock-=dt;missileClock-=dt;
   if(waveClock<=0){spawnWave();waveClock=4.6;}
   if(missileClock<=0){fireMissile();missileClock=1.8;}
   if(age>=32)enter('char');
  }else if(phase==='char'){if(!ace)enter('char');}
  else if(phase==='retreat'){ace.x+=430*dt;ace.y-=65*dt;if(ace.x>W+110)enter('lastZaku');}
  else if(phase==='lastZaku'){if(entryAge>=20&&(!api.storyVoice||ace?.storyStep==='done')){if(!lastZaku.paid){lastZaku.paid=true;api.score(1600);}lastZaku.hp=0;enter('burnup');}}
  else if(phase==='burnup'){if(api.storyVoice){const position=api.storyPosition?.(ace.recovery,'stage5CrownScream')||0;if(position>=2.2&&!lastZaku.burstShown){lastZaku.burstShown=true;api.explode(lastZaku.x,lastZaku.y,'#ffb56b',80,'silent');}if(ace.storyStep==='done')enter('descent');}else if(age>=4.5)enter('descent');}
  else if(phase==='descent'){
   if(!coolingCue.started&&age>=COOLING_START){coolingCue.started=true;api.storyVoice?.('stage5AmuroCooling');say('耐熱フィルム準備 — 隕石回避を継続',4);}
   if(coolingCue.started&&!coolingCue.done)coolingCue.done=api.storyFinished?api.storyFinished(coolingCue,'stage5AmuroCooling',dt):age>=COOLING_START+28;
   if(coolingProgress()>=1&&coolingCue.done)enter('cooling');
  }
  else if(phase==='cooling'){
   if(!coolingCue.afterCharDone)coolingCue.afterCharDone=api.storyFinished?api.storyFinished(coolingCue.afterChar,'stage5CharAfterCooling',dt):true;
   if(coolingCue.afterCharDone&&!coolingCue.countdown){coolingCue.countdown={};api.storyVoice?.('stage5MiraiCountdown');say('大気圏突破 — 姿勢を維持',4);}
   if(coolingCue.countdown&&!coolingCue.countdownDone)coolingCue.countdownDone=api.storyFinished?api.storyFinished(coolingCue.countdown,'stage5MiraiCountdown',dt):true;
   if(age>=COOLING_SECONDS&&coolingCue.countdownDone)enter('breakthrough');
  }
  else if(phase==='breakthrough'){if(age>=24)enter('blueSky');}
  else if(phase==='blueSky'){
   fuelClock-=dt;
   if(fuelClock<=0){fuelDrops.push({x:W+25,y:clamp(api.player().y+(Math.random()-.5)*300,85,H-70),age:0});fuelClock=3.5+Math.random()*1.5;}
   for(const item of fuelDrops){item.age+=dt;item.x-=150*dt;item.y+=Math.sin(item.age*2)*8*dt;
    if(Math.hypot(item.x-api.player().x,item.y-api.player().y)<30){item.taken=true;landingFuel++;api.fuelPickup?.();say('推進用素材 +1 — 落下速度 '+Math.round(100/(1+landingFuel*.12))+'%',2);}
   }
   fuelDrops=fuelDrops.filter(item=>!item.taken&&item.x>-30);

   if(age>=1&&!coolingCue.skyVoice){coolingCue.skyVoice={};api.storyVoice?.('stage5AfterReentry');}
   if(coolingCue.skyVoice&&(api.storyFinished?api.storyFinished(coolingCue.skyVoice,'stage5AfterReentry',dt):true))enter('landing');
  }
  else if(phase==='landing'){
   const p=api.player(),target=landingTarget(),previous=landingY;
   if(age>.65)landingY+=(220+(age-.65)*100)*dt/(1+landingFuel*.12);p.y=landingY;
   if(previous<=target.y&&landingY>=target.y){
    if(Math.abs(p.x-target.x)<=target.w/2){p.y=target.y;enter('finish');return;}
    completed=true;api.fail?.('着艦位置を外しました。');return;
   }
   }else if(phase==='finish'){
   if(age>=4&&!earthCue.started){earthCue.started=true;api.storyVoice?.('stage5EarthDescent');}
   if(earthCue.started&&!earthCue.done)earthCue.done=api.storyFinished?api.storyFinished(earthCue,'stage5EarthDescent',dt):age>=25.45;
   if(earthCue.done)finishFade+=dt;
   if(finishFade>=4){completed=true;api.score(3000);api.complete();}
  }
 }
 function updateEnemy(e,dt){
  if(!e.stage5Kind)return false;
  e.age+=dt;e.shot-=dt;
  if(e.stage5Kind==='char'){
   if(phase!=='char')return true;
   e.trail=(e.trail||[]).filter(segment=>total-segment.age<.55);
   if(e.attackState==='volley'){
    e.hold-=dt;
    if(e.shot<=0&&e.volley.length){
     const angle=e.volley.shift(),x=e.x,y=e.y,range=300;
     projectiles.push({kind:'bazooka',x,y,vx:Math.cos(angle)*420,vy:Math.sin(angle)*420,
      age:0,fuse:range/420,targetX:x+Math.cos(angle)*range,targetY:y+Math.sin(angle)*range});
     e.shot=.16;e.flash=.18;
    }
    if(e.hold<=0){e.attackState='move';e.goal=null;}
   }else{
    if(!e.goal){
     e.goal={x:130+Math.random()*(W-260),y:100+Math.random()*(H-240)};
     if(Math.hypot(e.goal.x-e.x,e.goal.y-e.y)<240){
      e.goal.x=e.x<W/2?W-150:150;e.goal.y=e.y<H/2?H-155:115;
     }
    }
    const dx=e.goal.x-e.x,dy=e.goal.y-e.y,distance=Math.hypot(dx,dy);
    const travel=Math.min(1,1060*dt/(distance||1)),oldX=e.x,oldY=e.y;
    e.x+=dx*travel;e.y+=dy*travel;
    if(Math.hypot(e.x-oldX,e.y-oldY)>1)e.trail.push({x:oldX,y:oldY,toX:e.x,toY:e.y,age:total});
    if(distance<=1060*dt){e.attackState='volley';e.hold=1.05;e.shot=0;planBazookaVolley(e);}
   }
   e.flash=Math.max(0,(e.flash||0)-dt);
  }else if(e.stage5Kind==='lastZaku'){
   e.x+=(W*.74-e.x)*Math.min(1,dt*2);e.y=H*.48+Math.sin(e.age*1.4)*125;
   if(e.shot<=0){api.fire(e.x-25,e.y,230,2);e.shot=1.4;}
  }else{
   e.x-=125*dt;e.y=e.base+Math.sin(e.age*1.5+e.wing)*30;
   if(e.shot<=0&&e.x<W-25){
    e.burstLeft=(e.burstLeft||3)-1;
    api.fire(e.x-25,e.y,230,2);
    e.shot=e.burstLeft>0?.2:2.7;
   }
  }
  if(Math.hypot(e.x-api.player().x,e.y-api.player().y)<30+api.hitRadius()&&!api.meleeSafe(e))api.hit(23,1,e);
  return true;
 }
 function planBazookaVolley(e){
  const p=api.player(),base=Math.atan2(p.y-e.y,p.x-e.x);
  e.volley=Array.from({length:5},(_,i)=>base+(i-2)*.43+(Math.random()-.5)*.24);

 }
 function filterDamage(e,amount){
  if(!e.stage5Kind)return amount;
  if(e.stage5Kind==='lastZaku')return 0;
  if(e.stage5Kind==='char'){
   if(!['char','lastZaku'].includes(phase))return 0;
   const n=Math.min(amount,budget);budget-=n;return n;
  }return amount;
 }
 function onKilled(e){
  if(!e.stage5Kind)return false;
  if(e.paid)return true;e.paid=true;
  if(e.stage5Kind==='char'){api.score(1800);api.material(e.x,e.y,3,2);enter('lastZaku');say('大気圏突入 — 子ムサイ接近',4);return true;}
  if(e.stage5Kind==='lastZaku'){e.hp=1;e.paid=false;return true;}
  api.explode(e.x,e.y,'#ffc48c',24,'zaku');api.score(120);
  if(e.wing===0)api.capsule(e.x,e.y);else api.material(e.x,e.y,1,1);
  return true;
 }
 function intercept(s){
  for(const q of projectiles){
   if(q.kind==='bazooka'||q.dead||Math.hypot(q.x-s.x,q.y-s.y)>18+s.w/2)continue;
   q.dead=true;if(s.kind!=='laser')s.life=0;
   api.explode(q.x,q.y,'#ffd193',8,'silent');return s.life<=0;
  }return false;
 }
 function atlas(name,index,x,y,width,angle=0,alpha=1){
  const a=images['stage5_'+name];if(!a)return;
  const [,columns,rows]=root.StageFiveArt[name];
  const sheet=columns*rows>1,sw=sheet?a.im.width/columns:a.sw,sh=sheet?a.im.height/rows:a.sh;
  const sx=sheet?Math.floor(index%columns)*sw:a.sx,sy=sheet?Math.floor(index/columns)*sh:a.sy;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(a.im,sx,sy,sw,sh,-width/2,-width*sh/sw/2,width,width*sh/sw);ctx.restore();
 }
 function label(text,x,y,size=18,color='#edf6ff'){ctx.save();ctx.fillStyle=color;ctx.font=size+'px sans-serif';ctx.textAlign='center';ctx.fillText(text,x,y);ctx.restore();}
 function heated(){return ['lastZaku','burnup','descent','cooling','breakthrough'].includes(phase);}
 function coolingClock(){
  if(phase!=='descent'||!coolingCue.started)return 0;
  const position=api.storyPosition?api.storyPosition(coolingCue,'stage5AmuroCooling'):Math.max(0,age-COOLING_START);
  return Math.max(0,position-COOLING_VOICE_CUE);
 }
 function coolingProgress(){
  if(['cooling','breakthrough'].includes(phase))return 1;
  return phase==='descent'?clamp(coolingClock()/COOLING_TRANSITION,0,1):0;
 }
 function drawRegisteredSuit(name,index,x,y,height,angle,alpha){
  const a=images['stage5_'+name];if(!a)return;
  const [,columns,rows]=root.StageFiveArt[name],sw=a.im.width/columns,sh=a.im.height/rows;
  const [cx,cy,bodyHeight]=bodyFrames[name][index],scale=height/bodyHeight;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(a.im,index%columns*sw,Math.floor(index/columns)*sh,sw,sh,-cx*scale,-cy*scale,sw*scale,sh*scale);
  ctx.restore();
 }
 function entryBlend(){const t=clamp(entryAge/10,0,1);return t*t*(3-2*t);}
 function entryMotion(){
  const countdown=phase==='cooling'&&coolingCue.countdown&&!coolingCue.countdownDone;
  const strength=heated()?entryBlend()*(countdown?4:phase==='descent'?1:.55):0;
  return {x:(Math.sin(total*63)+Math.sin(total*97)*.35)*1.8*strength,
   y:(Math.sin(total*79)+Math.sin(total*111)*.3)*2.2*strength};
 }
 function gravitySpeed(){
  if(['breakthrough','blueSky'].includes(phase))return 110;
  return {escort:78,waves:90,char:100,retreat:95,lastZaku:105,burnup:105,descent:110,cooling:110}[phase]||0;
 }
 function hotZoneStrength(){if(phase==='breakthrough')return 1-clamp(age/10,0,1);return gravitySpeed()>0&&phase!=='blueSky'?1:0;}
 function applyGravity(dt){
  const p=api.player();
  if(phase==='landing'){p.y=landingY;return;}
  if(p.dying>0)return;
  p.y=clamp(p.y+gravitySpeed()*dt,35,H-35);
  const bodyHalfHeight=images.zaku?65*images.zaku.sh/images.zaku.sw/2:25;
  if(hotZoneStrength()>0&&p.y+Math.max(api.hitRadius(),bodyHalfHeight)>=H-HOT_ZONE_HEIGHT)api.hit(18,1);
 }
 function heatStrength(){const t=phase==='breakthrough'?clamp(age/10,0,1):0,clear=t*t*(3-2*t);return heated()?entryBlend()*(.12+.34*clamp((entryAge-18)/25,0,1))*(1-clear):0;}
 function drawBackdrop(){
  const sky=['blueSky','landing','finish'].includes(phase);
  const blend=heated()?entryBlend():0;
  const fog=heated()?clamp(heatStrength()/.46,0,1):0;
  const bottom=heated()?'rgb('+Math.round(2+104*fog)+','+Math.round(8+44*fog)+','+Math.round(23+22*fog)+')':'#16475d';
  ctx.save();const gradient=ctx.createLinearGradient(0,0,0,H);gradient.addColorStop(0,sky?'#487eaf':'#020817');gradient.addColorStop(1,sky?'#c3dced':bottom);
  ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
  if(phase==='breakthrough'){ctx.save();ctx.globalAlpha=clamp(age/10,0,1)*.55;ctx.fillStyle='#d6e6ff';for(let i=0;i<38;i++)ctx.fillRect((i*137+63)%W,(i*79+45)%H,1.5,1.5);ctx.restore();}
  if(phase==='breakthrough'){const reveal=clamp((age-12)/12,0,1);if(reveal>0){const blue=ctx.createLinearGradient(0,0,0,H),edge=1-reveal;if(reveal>=.999){blue.addColorStop(0,'#487eaf');blue.addColorStop(1,'#c3dced');}else{blue.addColorStop(0,'rgba(72,126,175,0)');blue.addColorStop(Math.max(0,edge-.06),'rgba(72,126,175,0)');blue.addColorStop(Math.min(1,edge+.08),'#78a4c8');blue.addColorStop(1,'#c3dced');}ctx.fillStyle=blue;ctx.fillRect(0,0,W,H);}}
  if(sky){const t=clamp(skyAge/40,0,1),drift=t*t*(3-2*t);atlas('moon',0,W+70-(W*.22+70)*drift,H*.23,95,0,.48); }
  if(!sky&&phase!=='breakthrough'){ctx.fillStyle='#32668b';ctx.beginPath();ctx.ellipse(W*.5,H+380,W*.9,460,0,Math.PI,Math.PI*2);ctx.fill();ctx.strokeStyle='#6ea8ca';ctx.lineWidth=8;ctx.stroke();}
  if(phase==='escort'||phase==='waves')sprite('whiteBase',90,190,350,.72);
  if(['waves','char'].includes(phase))sprite('charMusaiBackground',W-180,130,270,.55);
  if(heated()){
   const approach=clamp(entryAge/9,0,1),arrival=approach*approach*(3-2*approach);
   const x=W+180-(W*.18+180)*arrival,y=H*.76+Math.sin(total*.65)*4;
   const opacity=phase==='breakthrough'?1-clamp(age/10,0,1):1;
   atlas('komusai',0,x,y,210,.12,.85*opacity);
  }
  if(heated()){
   const arrival=clamp(entryAge/9,0,1),shipX=-220+370*(arrival*arrival*(3-2*arrival));
   const shipY=150+Math.min(entryAge*1.2,H*.5-150);
   const normal=phase==='breakthrough'?clamp((age-8)/16,0,1):0,cool=shipCoolingTime>=0?clamp(shipCoolingTime/15,0,1):0;
   sprite('whiteBase',shipX,shipY,350,.7*(1-blend));
   if(phase==='breakthrough'&&age>=8)atlas('shipRecover',Math.min(11,Math.floor(normal*12)),shipX,shipY,350,.15*blend*(1-normal),.7*blend);
   else if(shipCoolingTime<0)atlas('entryWhiteBase',Math.floor(total*8)%4,shipX,shipY,350,.15*blend,.7*blend*(1-normal));
   else atlas('shipCooling',Math.min(11,Math.floor(cool*12)),shipX,shipY,350,.15*blend,.7*blend);
  }
  for(let i=0;i<14;i++){
   const speed=sky?70:14+blend*(phase==='descent'?790:420);
   const x=((i*151-total*speed)%(W+360)+W+360)%(W+360)-180;
   const y=((i*83-total*speed*.28)%(H+160)+H+160)%(H+160)-80;
   ctx.fillStyle=sky?'#ffffff35':heated()?'#441d2480':'#8aa4b566';
   if(heated()||sky){ctx.globalAlpha=sky?1:blend*(phase==='breakthrough'?1-clamp(age/10,0,1):1);ctx.beginPath();ctx.ellipse(x,y,150,12,.27,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
   else ctx.fillRect(x,100+(i*71)%(H-150),2,2);
  }
  if(heated()){
   ctx.strokeStyle='#ffcfad';ctx.lineWidth=1.2;
   for(let i=0;i<35;i++){
    const speed=650+(i%5)*145;
    const x=((i*131-total*speed)%(W+260)+W+260)%(W+260)-130;
    const y=((i*67-total*speed*.28)%(H+180)+H+180)%(H+180)-90;
    ctx.globalAlpha=blend*(.07+(i%4)*.025)*(phase==='breakthrough'?1-clamp(age/10,0,1):1);
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+55+(i%4)*15,y+18);ctx.stroke();
   }
   ctx.globalAlpha=1;
  }
  if(phase==='escort'&&!pod.failed){sprite('magellanEvacuationBoat',pod.x,pod.y,68);ctx.fillStyle='#18303d';ctx.fillRect(pod.x-30,pod.y-38,60,5);ctx.fillStyle='#7bf3b7';ctx.fillRect(pod.x-30,pod.y-38,60*pod.hp/pod.max,5);}
  if(heated()&&ace&&!ace.recovered)atlas('bazookaChar',9,ace.x,ace.y,78*(1-ace.boarding),0,1-ace.boarding);
  if(phase==='retreat'&&ace)atlas('bazookaChar',9,ace.x,ace.y,78);
  if(phase==='burnup'&&lastZaku)atlas('burningZaku',Math.min(11,Math.floor((api.storyVoice?(api.storyPosition?.(ace.recovery,'stage5CrownScream')||0)/4.85:age/4.5)*12)),lastZaku.x+Math.sin(age*80)*3,lastZaku.y,130,.2);
  if(['blueSky','landing','finish'].includes(phase)){
   if(phase==='finish'){const rise=clamp(age/12,0,1);atlas('earth',0,W/2,H+H*.48-rise*H*.55,W*1.12);}
   const ship=landingShipPose();sprite('whiteBase',ship.x,ship.y,ship.w);
   if(phase==='landing'){const t=landingTarget();ctx.save();ctx.globalAlpha=.45+.4*Math.sin(total*9)**2;ctx.fillStyle='#268fff88';ctx.shadowColor='#50cfff';ctx.shadowBlur=14;ctx.fillRect(t.x-t.w/2,t.y-t.h/2,t.w,t.h);ctx.strokeStyle='#82ddff';ctx.lineWidth=2;ctx.strokeRect(t.x-t.w/2,t.y-t.h/2,t.w,t.h);ctx.restore();label('着艦',t.x,t.y-22,16,'#8bdfff');}
  }
  if(phase==='blueSky')for(const item of fuelDrops){ctx.save();ctx.translate(item.x,item.y);ctx.fillStyle='#7af0a0';ctx.shadowColor='#91ffd8';ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(11,0);ctx.lineTo(0,11);ctx.lineTo(-11,0);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#12302a';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText('P',0,4);ctx.restore();}

  for(const r of rocks){
   if(r.small){
    ctx.save();ctx.translate(r.x,r.y);ctx.rotate(Math.atan2(r.vy,r.vx)-Math.PI);
    sprite('stage5_hotRocks'+r.variant,0,0,27);ctx.restore();continue;
   }
   atlas('lingeringBlast',4+Math.floor(total*9)%4,r.x+12,r.y+4,r.r*3.1,0,.8);
   sprite('asteroidArt'+Math.floor(r.r)%6,r.x,r.y,r.r*2);
  }
  for(const q of projectiles){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(Math.atan2(q.vy,q.vx));ctx.fillStyle='#ffaa5b';ctx.fillRect(-16,-3,27,6);ctx.fillStyle='#fff0ba';ctx.fillRect(6,-2,7,4);ctx.restore();}
  for(const h of hazards){
   const frame=h.age<.3?Math.min(3,Math.floor(h.age/.075)):h.age<4.4?4+Math.floor(h.age*10)%4:8+Math.min(3,Math.floor((h.age-4.4)/.125));
   const radius=h.age<.18?h.r*h.age/.18:h.r;atlas('lingeringBlast',frame,h.x,h.y,radius*2.35,0,h.age<4.4?1:1-(h.age-4.4)/.5);
  }ctx.restore();
 }
 function drawEnemy(e){
  if(!e.stage5Kind)return false;
  if(e.stage5Kind==='char'){
   ctx.save();ctx.strokeStyle='#ff605d';ctx.shadowColor='#ff2626';ctx.shadowBlur=9;ctx.lineWidth=2.5;
   for(const segment of e.trail||[]){
    ctx.globalAlpha=clamp(1-(total-segment.age)/.55,0,1)*.8;
    ctx.beginPath();ctx.moveTo(segment.x,segment.y);ctx.lineTo(segment.toX,segment.toY);ctx.stroke();
   }
   ctx.restore();
   const dy=api.player().y-e.y,frame=Math.abs(dy)<60?(e.flash>0?1:0):dy<0?(e.flash>0?5:4):(e.flash>0?7:6);
   ctx.save();ctx.translate(e.x,e.y);if(api.player().x>e.x)ctx.scale(-1,1);
   atlas('bazookaChar',frame,0,0,78);ctx.restore();
  }else if(e.stage5Kind==='lastZaku'){
   sprite('zaku',e.x,e.y,65,1-entryBlend());
   atlas('entryZaku',Math.floor(total*8)%4,e.x,e.y,125,0,entryBlend());
  }
  else sprite('zaku',e.x,e.y,65);
  return true;
 }
 function drawPlayer(alpha){
  if(phase==='finish'){const fade=clamp(age/1.2,0,1),ship=landingShipPose(),height=images.zaku?65*images.zaku.sh/images.zaku.sw:50;const normal=api.playerSuit?.()||'gundamUnarmed',a=images[normal];if(fade<1&&a)sprite(normal,ship.x-130*ship.w/540,ship.y-35*ship.w/540,height*a.sw/a.sh*(1-fade),alpha*(1-fade));return true;}
  if(['blueSky','landing'].includes(phase))return false;
  if(!heated())return false;
  const p=api.player(),blend=entryBlend(),normal=api.playerSuit?.()||'gundamUnarmed',a=images[normal],z=images.zaku;
  const height=z?65*z.sh/z.sw:50,angle=['descent','cooling'].includes(phase)?.28:0;
  const normalMix=phase==='breakthrough'?clamp((age-8)/16,0,1):0;
  const progress=coolingProgress(),coolAlpha=['cooling','breakthrough'].includes(phase)?1:phase==='descent'?clamp(coolingClock()/1.5,0,1):0;
  if(phase==='breakthrough'&&age>=8){drawRegisteredSuit('suitRecover',Math.min(11,Math.floor(normalMix*12)),p.x,p.y,height,0,alpha);return true;}
  if(a&&z)sprite(normal,p.x,p.y,65*z.sh/z.sw*a.sw/a.sh,alpha*(1-blend));
  drawRegisteredSuit('entryGundam',Math.floor(total*8)%4,p.x,p.y,height,angle,alpha*blend*(1-coolAlpha)*(1-normalMix));
  if(coolAlpha>0)drawRegisteredSuit('coolingNew',Math.min(11,Math.floor(progress*12)),p.x,p.y,height,angle,alpha*coolAlpha*(1-normalMix));
  return true;
 }
 function landingShipPose(){
  if(phase==='blueSky'){const t=clamp(age/12,0,1),k=t*t*(3-2*t);return {x:skyShipStart.x+(W*.68-skyShipStart.x)*k,y:skyShipStart.y+(H*.82+35-skyShipStart.y)*k,w:350+190*k};}
  if(phase==='finish'){const t=clamp(age/4,0,1),k=t*t*(3-2*t),drift=Math.max(0,(age-4)/17.45);return {x:W*.68+(W*.58-W*.68)*k+W*.07*drift,y:landingDeckY+35+(H*.4-landingDeckY-35)*k+H*.25*drift,w:Math.max(120,540-140*k-150*drift)};}
  const t=clamp(age/.65,0,1),k=t*t*(3-2*t);return {x:W*.68,y:landingShipStart+(landingDeckY+35-landingShipStart)*k,w:540};
 }
 function landingTarget(){return {x:W*.68-130,y:landingDeckY,w:56,h:22};}
 function drawOverlay(){
  ctx.save();const heat=heatStrength();
  if(heat){
   const glow=ctx.createLinearGradient(0,0,W,H);glow.addColorStop(0,'rgba(115,42,30,'+heat*.7+')');glow.addColorStop(.6,'rgba(204,72,40,'+heat+')');glow.addColorStop(1,'rgba(235,105,46,'+heat+')');
   ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  }
  if(hotZoneStrength()>0){
   ctx.save();ctx.globalAlpha=hotZoneStrength();
   const hot=ctx.createLinearGradient(0,H-HOT_ZONE_HEIGHT,0,H);
   hot.addColorStop(0,'rgba(255,45,15,0)');hot.addColorStop(.45,'rgba(245,42,16,.40)');hot.addColorStop(1,'rgba(255,60,12,.85)');
   ctx.fillStyle=hot;ctx.fillRect(0,H-HOT_ZONE_HEIGHT,W,HOT_ZONE_HEIGHT);ctx.restore();
  }
  label('第5話 大気圏突入 / '+names[phase],W/2,42,20);
  const target=phase==='char'?ace:phase==='lastZaku'?lastZaku:null;
  if(target&&target.hp>0){
   ctx.fillStyle='#182c40';ctx.fillRect(W*.3,61,W*.4,8);
   ctx.fillStyle='#ffa68b';ctx.fillRect(W*.3,61,W*.4*target.hp/target.max,8);
   label('HP '+Math.ceil(target.hp)+' / '+target.max,W/2,87,14);
  }
  if(['blueSky','landing'].includes(phase))label('推進用素材 '+landingFuel+'  /  落下速度 '+Math.round(100/(1+landingFuel*.12))+'%',W/2,76,18,'#a8ffc0');
  if(phase==='descent')label('着艦準備まで '+Math.max(0,Math.ceil(DESCENT_SECONDS-age)),W/2,76,20,'#ffdca3');
  if(noticeUntil>total)label(notice,W/2,H-90,18,'#ffdfa5');

  if(phase==='finish'){ctx.fillStyle='rgba(0,0,0,'+clamp(finishFade/4,0,1)+')';ctx.fillRect(0,0,W,H);}ctx.restore();
 }
 reset();
 return {get horizontalOnly(){return phase==='landing';},reset,update,updateEnemy,filterDamage,onKilled,intercept,drawBackdrop,drawEnemy,drawPlayer,drawOverlay,entryMotion,applyGravity,
  get playerHidden(){return phase==='finish';},
  get weaponBlocked(){return ['retreat','burnup','descent','cooling','breakthrough','blueSky','landing','finish'].includes(phase);},
  get zone(){return names[phase];},
  snapshot:()=>({phase,age,total,atmospheric:heated(),shipCoolingTime,finishFade,ship:phase==='finish'?landingShipPose():null,skyAge,landingFuel,landingSpeedFactor:1/(1+landingFuel*.12),fuelDrops:fuelDrops.map(item=>({...item})),descentSeconds:DESCENT_SECONDS,coolingSeconds:COOLING_SECONDS,coolingProgress:coolingProgress(),pod:{...pod},hazards:hazards.map(h=>({...h})),projectiles:projectiles.length,rockCount:rocks.length,rocks:rocks.map(r=>({...r})),gravity:gravitySpeed(),entryBlend:entryBlend(),heat:heatStrength(),landing:phase==='landing'?landingTarget():null,completed})};
};
})(window);
