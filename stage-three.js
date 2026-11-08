'use strict';
window.createStageThree=function(api){
 const {W,H,ctx,images,player,enemies,add,fire,damage,explode,material,capsule,sprite,complete}=api;
 const postCharDuration=60,postCharWaveTimes=[0,6,12,18,24,30,36,42,48];
 let charMusicAt=null,charExitTime=null,postCharWaves=0;
 let rocks=0,waves=0,bossStarted=false,ship=null,old=null,groups=[],charStarted=false,battleAge=0;
 function reset(){charMusicAt=charExitTime=null;postCharWaves=0;rocks=waves=0;bossStarted=false;ship=old=null;groups=[];charStarted=false;battleAge=0;}
 function entity(kind,x,y,hp,size,extra={}){const e={type:kind==='old'?'zaku':kind,x,y,hp,max:hp,size,age:0,shot:2,stage3Kind:kind,...extra};add(e);return e;}
 const partDefs=[
 {name:'奥側船体',normal:[8,80,974,204],damaged:[8,540,974,206],x:-14,y:-25,w:370,hp:20},
 {name:'手前側船体',normal:[8,305,762,191],damaged:[8,770,762,215],x:-8,y:25,w:365,hp:20},
 {name:'後部デッキ',normal:[1034,95,478,192],damaged:[1034,548,478,202],x:155,y:-2,w:115,hp:14},
 {name:'尾翼',normal:[778,310,180,184],damaged:[778,772,180,213],x:155,y:-65,w:48,hp:8},
 {name:'補給口',normal:[965,382,294,102],damaged:[965,857,284,108],x:15,y:65,w:82,hp:8},
 {name:'船首装甲',normal:[1272,370,252,118],damaged:[1264,829,260,145],x:-133,y:42,w:104,hp:10}];
 function buildParts(){return partDefs.map((d,i)=>({...d,index:i,max:d.hp,h:d.w*d.normal[3]/d.normal[2],brokenAt:null}));}
 function partAt(source){if(!ship?.parts||!source)return null;const r=source.r||0;return [...ship.parts].reverse().find(p=>p.hp>0&&Math.abs(source.x-ship.x-p.x)<=p.w/2+r&&Math.abs(source.y-ship.y-p.y)<=p.h/2+r);}
 function breakPart(p){p.brokenAt=battleAge;p.fallX=ship.x+p.x;p.fallY=ship.y+p.y;explode(p.fallX,p.fallY,'#ffbf6c',30,'silent');}
 function drawPart(p){const im=images.papuaParts;if(!im)return;const age=p.brokenAt===null?0:battleAge-p.brokenAt,drop=p.hp<=0?Math.max(0,age-.45):0;if(drop>3)return;const box=p.hp>0?p.normal:p.damaged;ctx.save();ctx.translate(p.hp>0?ship.x+p.x:p.fallX+drop*(p.index%2?22:-18),p.hp>0?ship.y+p.y:p.fallY+25*drop+105*drop*drop);ctx.rotate(drop*(p.index%2?-.38:.35));ctx.globalAlpha=Math.max(0,1-Math.max(0,drop-1.6)/1.4);ctx.drawImage(im.im,...box,-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}
 // Damaged structure stays attached underneath the falling outer pieces.
 function drawRemnant(p){const art=images.papuaParts;if(!art)return;ctx.save();ctx.translate(ship.x+p.x,ship.y+p.y);ctx.drawImage(art.im,...p.damaged,-p.w/2,-p.h/2,p.w,p.h);ctx.restore();}
 const bombardmentDuration=2, finalHitAt=1.35;
 const bombardmentShots=[
  {tank:false,fireAt:.22,hitAt:.55,x:-115,y:-24},
  {tank:true,fireAt:.4,hitAt:.76,x:60,y:36},
  {tank:true,fireAt:.62,hitAt:.98,x:-38,y:12},
  {tank:false,fireAt:.96,hitAt:finalHitAt,x:10,y:0}
 ];
 function updateBombardment(dt){
  const before=ship.bombardmentAge;
  ship.bombardmentAge+=dt;
  for(const shot of bombardmentShots){
   if(before<shot.hitAt&&ship.bombardmentAge>=shot.hitAt){
    const last=shot.hitAt===finalHitAt;
    explode(ship.x+shot.x,ship.y+shot.y,'#ffbf6c',last?65:28,last?'ship':'silent');
   }
  }
  if(ship.bombardmentAge>=bombardmentDuration){
   ship.sunk=true;
   api.score(2000);
   material(ship.x,ship.y,3,2);
   const musai=musaiPosition(battleAge);
   const {fighter,zaku}=distantDuelPose(battleAge);
   ship.gademScene={
    age:0,dialogueDone:false,combatLines:[],fighter:{x:musai.x+fighter.x,y:musai.y+fighter.y},
    from:{x:musai.x+zaku.x,y:musai.y+zaku.y},
    char:{x:clamp(old.x+70,65,W-45),y:clamp(old.y-28,55,H-55)},shot:1.1
   };
  }
 }
 function drawBombardment(sinking){
  const age=ship.bombardmentAge, offset=235*(1-clamp(age/.25,0,1)+sinking);
  const baseX=270-offset,tankX=330-offset,baseY=H*.23,tankY=H*.74;
  sprite('whiteBase',baseX,baseY,310,.85*(1-sinking));
  sprite('guntank',tankX,tankY,86,.95*(1-sinking));
  for(const shot of bombardmentShots){
   if(age<shot.fireAt||age>=shot.hitAt)continue;
   const progress=(age-shot.fireAt)/(shot.hitAt-shot.fireAt);
   const x=shot.tank?tankX+29:baseX+70,y=shot.tank?tankY-25:baseY-14;
   const dx=ship.x+shot.x-x,dy=ship.y+shot.y-y;
   const tail=Math.max(0,progress-(shot.tank?.08:.24));
   ctx.save();
   ctx.strokeStyle=shot.tank?'#ffb25f':'#c3f8ff';
   ctx.shadowColor=ctx.strokeStyle;
   ctx.shadowBlur=12;
   ctx.lineWidth=shot.tank?4:7;
   ctx.beginPath();
   ctx.moveTo(x+dx*tail,y+dy*tail);
   ctx.lineTo(x+dx*progress,y+dy*progress);
   ctx.stroke();
   ctx.restore();
  }
 }
 const cargoFlightTime=5.8, cargoInterval=.55;
 const transferCargo=['zaku','supplyCargo0','supplyCargo2','zaku','supplyCargo4','supplyCargo5'];
 function updateTransfer(dt){
  const transfer=ship.transfer;
  if(transfer.phase==='launch'){
   transfer.age+=dt;
   for(let i=transfer.origins.length;i<transferCargo.length&&transfer.age>=i*cargoInterval;i++){
    transfer.origins.push({x:ship.x+15,y:ship.y+28});
   }
   if(transfer.age>=cargoFlightTime+(transferCargo.length-1)*cargoInterval)transfer.phase='report';
   return;
  }
  const name=transfer.phase==='orders'?'gademSupplyOrders':'gademSupplyDelivered';
  if(!api.bossCueFinished?.(transfer,name,dt))return;
  if(transfer.phase==='orders'){
   transfer.phase='launch';
   transfer.origins=[{x:ship.x+15,y:ship.y+28}];
  }else{
   transfer.phase='done';
   ship.window=4;
   ship.damageSpent=0;
  }
 }
 function musaiPosition(t){
  const entry=clamp(t/9,0,1);
  const approach=entry*entry*(3-2*entry);
  const startX=W+330, dockX=480+Math.sin(t*.14)*12;
  return {x:startX+(dockX-startX)*approach,y:205+Math.sin(t*.23)*8};
 }
 function drawTransfer(){
  if(ship.transfer?.phase!=='launch')return;
  const musai=musaiPosition(battleAge);
  for(const [i,name] of transferCargo.entries()){
   const progress=(ship.transfer.age-i*cargoInterval)/cargoFlightTime;
   if(progress<0||progress>=1)continue;
   const {x:fromX,y:fromY}=ship.transfer.origins[i];
   const travel=progress*progress*(3-2*progress);
   const drift=Math.sin(progress*Math.PI);
   const x=fromX+(musai.x+70-fromX)*travel+drift*Math.sin(progress*5+i)*9;
   const y=fromY+(musai.y+10-fromY)*travel-drift*(35+i*7);
   const isZaku=name==='zaku';
   const depth=progress**1.65;
   const width=(isZaku?65:44)*(1-.9*depth);
   ctx.save();
   ctx.translate(x,y);
   ctx.rotate(drift*Math.sin(progress*4+i)*(isZaku?.15:.46));
   sprite(name,0,0,width,Math.min(1,(1-progress)*12));
   ctx.restore();
  }
 }
 function drawDebris(){
  if(!ship)return;
  if(ship.sunk){drawGademScene();return;}
  if(ship.hp<=0){
   const sinking=clamp((ship.bombardmentAge-finalHitAt)/(bombardmentDuration-finalHitAt),0,1);
   ctx.save();
   ctx.globalAlpha=1-sinking;
   ctx.translate(0,45*sinking);
   for(const p of ship.parts)drawRemnant(p);
   ctx.restore();
   drawBombardment(sinking);
  }
  for(const p of ship.parts)if(p.hp<=0)drawPart(p);
  drawTransfer();
 }
 // Distant flight paths are sampled from the stage clock. They never spawn gameplay entities.
 function distantDuelPose(t){
  const a=t*Math.PI/9, separation=.62+.45*Math.sin(a*2+.7);
  return {fighter:{x:148*Math.cos(a),y:26+61*Math.sin(a)},zaku:{x:148*Math.cos(a-separation),y:9+67*Math.sin(a-separation)}};
 }
 const fighterExitTime=1.35, charArrivalTime=2.45;
 function updateGademScene(dt){
  const scene=ship.gademScene;
  scene.age+=dt;
  if(scene.age<charArrivalTime)return;
  if(!scene.dialogueDone){
   if(api.bossCueFinished?.(scene,'gademChargeDialogue',dt)===false)return;
   scene.dialogueDone=true;
   old.rushIndex=-1;
   old.kickSide=player().y<H/2?-1:1;
   planRush(old);
   return;
  }
  const line=scene.combatLines[0];
  if(line&&api.bossCueFinished?.(scene,line,dt)!==false){
   scene.combatLines.shift();
   if(line==='gademDefeatDialogue'){
    scene.defeatAge=0;
    api.destroyOld(old);
    explode(old.x,old.y,'#ffd395',36,'silent');
   }
  }
  if(old.hp<=0){
   if(scene.gunfight){
    if(scene.evacuation)updateEvacuation(scene,dt);
   }else if(scene.defeatAge!==undefined){
    const before=scene.defeatAge;
    scene.defeatAge+=dt;
    for(const burst of gademBursts){
     if(before<burst.at&&scene.defeatAge>=burst.at)explode(old.x+burst.x,old.y+burst.y,'#ffb36c',burst.size,'silent');
    }
    if(scene.defeatAge>=1.35&&scene.combatLines.length===0){
     scene.gunfight=true;
     scene.char=entity('charFinal',scene.char.x,scene.char.y,30,65,{shot:.65,burstLeft:0});
    }
   }
   return;
  }
  const targetX=clamp(old.x+145,W*.65,W-48);
  const targetY=clamp(old.y-82,70,H-70);
  const dx=targetX-scene.char.x,dy=targetY-scene.char.y,distance=Math.hypot(dx,dy);
  if(distance>0){
   const step=Math.min(distance,150*dt);
   scene.char.x+=dx/distance*step;
   scene.char.y+=dy/distance*step;
  }
  scene.shot-=dt;
  if(scene.shot<=0){
   scene.shot=3.4;
   fire(scene.char.x-26,scene.char.y,220);
  }
 }
 const gademBursts=[
  {at:.24,x:-23,y:15,size:28},
  {at:.58,x:24,y:-16,size:36},
  {at:.92,x:0,y:0,size:65},
  {at:1.13,x:-34,y:-24,size:28}
 ];
 function updateEvacuation(scene,dt){
  const evac=scene.evacuation;
  evac.age+=dt;
  if(evac.phase==='bright'){
   if(api.bossCueFinished?.(evac,'brightFallBack',dt)===false)return;
   const p=player();
   const radius=58, margin=radius+32;
   let farthest=-1;
   for(let i=0;i<12;i++){
    const x=margin+Math.random()*(W-2*margin);
    const y=margin+Math.random()*(H-2*margin);
    const distance=Math.hypot(x-p.x,y-p.y);
    if(distance>farthest){
     farthest=distance;
     evac.zone={x,y,radius};
    }
   }
   evac.phase='escape';
   evac.age=0;
   return;
  }
  if(evac.phase==='escape'){
   const p=player(),zone=evac.zone;
   if(p.dying>0||Math.hypot(p.x-zone.x,p.y-zone.y)>zone.radius)return;
   evac.origin={x:p.x,y:p.y};
   evac.suit=api.playerSuit?.()||'gundam';
   evac.baseAge=evac.age;
   evac.phase='board';
   evac.age=0;
   api.beginExtraction?.();
   return;
  }
  if(evac.phase==='board'){
   if(evac.age<4.5)return;
   evac.phase='epilogue';
   evac.age=0;
   return;
  }
  if(evac.phase==='epilogue'){
   const finished=api.bossCueFinished?.(evac,'charStage3Epilogue',dt)!==false;
   const position=api.bossCuePosition?.('charStage3Epilogue')??evac.age;
   if(position>=19||finished)evac.reinforcementAge=(evac.reinforcementAge??0)+dt;
   if(finished&&evac.reinforcementAge>=1.6){
    evac.phase='fade';
    evac.age=0;
   }
   return;
  }
  if(evac.phase==='fade'&&evac.age>=1.6){
   evac.phase='done';
   complete();
  }
 }
 function epilogueBgmGain(){
  const evac=ship?.gademScene?.evacuation;
  if(evac?.phase==='epilogue')return Math.max(0,1-evac.age/1.8);
  return evac?.phase==='fade'||evac?.phase==='done'?0:1;
 }
 function playerEvacuating(){
  const phase=ship?.gademScene?.evacuation?.phase;
  return phase==='board'||phase==='epilogue'||phase==='fade'||phase==='done';
 }
 function whiteBasePosition(t){
  const approach=clamp(t/6,0,1);
  const start=-160;
  return {x:start+(W*.29-start)*approach,y:H*.23};
 }
 function drawEvacuationBackdrop(){
  const evac=ship?.gademScene?.evacuation;
  if(!evac||!['escape','board'].includes(evac.phase))return;
  const boarding=evac.phase==='board';
  const base=whiteBasePosition(boarding?evac.baseAge+evac.age:evac.age);
  const departure=boarding?clamp((evac.age-3)/1.5,0,1):0;
  sprite('whiteBase',base.x-departure*(base.x+160),base.y,250,.66);
 }
 function drawEvacuation(){
  const scene=ship?.gademScene,evac=scene?.evacuation;
  if(!evac)return;
  if(evac.phase==='escape'){
   const {x,y,radius}=evac.zone;
   ctx.save();
   ctx.fillStyle='#ffdf492d';
   ctx.strokeStyle='#ffe261';
   ctx.lineWidth=3;
   ctx.beginPath();
   ctx.arc(x,y,radius,0,Math.PI*2);
   ctx.fill();
   ctx.stroke();
   ctx.textAlign='center';
   ctx.font='bold 17px sans-serif';
   ctx.fillStyle='#ffe261';
   ctx.fillText('退避エリア',x,y-radius-10);
   ctx.restore();
  }else if(evac.phase==='board'&&evac.age<3){
   const t=clamp(evac.age/3,0,1),progress=t*t*(3-2*t);
   const base=whiteBasePosition(evac.baseAge+evac.age),start=evac.origin;
   const art=images[evac.suit],zaku=images.zaku;
   const width=art&&zaku?65*zaku.sh/zaku.sw*art.sw/art.sh:65;
   sprite(evac.suit,start.x+(base.x+50-start.x)*progress,start.y+(base.y+11-start.y)*progress,width*(1-.92*progress),Math.min(1,(1-t)*8));
  }else if(evac.reinforcementAge!==undefined){
   const t=clamp(evac.reinforcementAge/1.6,0,1);
   for(const [i,offset] of [-58,58].entries()){
    const targetX=scene.char.x+offset,targetY=scene.char.y+50;
    sprite('zaku',W+55+i*58+(targetX-W-55-i*58)*t,targetY+85*(1-t),58);
   }
  }
 }
 function drawFade(){
  const evac=ship?.gademScene?.evacuation;
  if(evac?.phase!=='fade'&&evac?.phase!=='done')return;
  ctx.save();
  ctx.globalAlpha=clamp(evac.age/1.6,0,1);
  ctx.fillStyle='#000';
  ctx.fillRect(-20,-20,W+40,H+40);
  ctx.restore();
 }
 function updateFinalChar(e,dt){
  const targetX=W*.76+W*.115*Math.sin(e.age*1.45),targetY=H*(.5+.35*Math.sin(e.age*1.9));
  const dx=targetX-e.x,dy=targetY-e.y,distance=Math.hypot(dx,dy);
  if(distance>0){
   const step=Math.min(distance,300*dt);
   e.x+=dx/distance*step;
   e.y+=dy/distance*step;
  }
  e.shot-=dt;
  if(e.shot>0)return;
  if(!e.burstLeft)e.burstLeft=3;
  fire(e.x-27,e.y,250,3);
  e.burstLeft--;
  e.shot=e.burstLeft>0?.17:1.9;
 }
 function drawGademScene(){
  const scene=ship?.gademScene;
  if(!scene)return;
  if(scene.gunfight){drawEvacuation();return;}
  if(old.hp<=0&&scene.defeatAge===undefined){
   drawEnemy(old);
   api.drawDamageSparks?.(old.x,old.y,old.size*images.zaku.sh/images.zaku.sw,41,scene.age-scene.defeatedAt);
  }
  const retreat=scene.age/fighterExitTime;
  if(retreat<1){
   const {x,y}=scene.fighter;
   const drift=retreat*retreat;
   ctx.save();
   ctx.translate(x+(-48-x)*drift,y-54*drift);
   ctx.rotate(.12*drift);
   ctx.scale(-1,1);
   sprite('coreFighter',0,0,30,.82);
   ctx.restore();
  }
  const progress=clamp((scene.age-fighterExitTime)/(charArrivalTime-fighterExitTime),0,1);
  const {from,char}=scene;
  const approach=progress*progress*(3-2*progress);
  const x=from.x+(char.x-from.x)*approach;
  const y=from.y+(char.y-from.y)*approach-26*Math.sin(progress*Math.PI);
  ctx.save();
  ctx.translate(x,y);
  if(!scene.dialogueDone&&progress<1&&char.x>from.x)ctx.scale(-1,1);
  sprite('charZaku',0,0,26+39*approach,.78+.22*approach);
  ctx.restore();
 }
 function drawDistantDuel(t,mx,my){
  const {fighter:f,zaku:z}=distantDuelPose(t), next=distantDuelPose(t+.025), dx=f.x-z.x,dy=f.y-z.y;
  const kick=Math.hypot(dx,dy)<46 && Math.sin(t*Math.PI*2/9+.7)<-.8;
  ctx.save();ctx.translate(mx,my);ctx.globalAlpha=.76;
  // Small, short tracer bursts only; their aim is sampled when fired.
  for(let i=0;i<3;i++){
   const elapsed=t-.9-i*.095;if(elapsed<0)continue;
   const age=elapsed%2.25;if(age>.33)continue;
   const launchAt=t-age,from=distantDuelPose(launchAt).fighter,to=distantDuelPose(launchAt+.23).zaku;
   const vx=to.x-from.x,vy=to.y-from.y,d=Math.hypot(vx,vy)||1,travel=Math.min(d,210*age+9);
   if(travel>=d)continue;
   const x=from.x+vx/d*travel,y=from.y+vy/d*travel;
   ctx.strokeStyle='#ffc990';ctx.lineWidth=1.15;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-vx/d*7,y-vy/d*7);ctx.stroke();
  }
  const fighterVX=next.fighter.x-f.x, fighterVY=next.fighter.y-f.y;
  ctx.save();
  ctx.translate(f.x,f.y);
  ctx.rotate(Math.atan2(fighterVY,fighterVX));
  if(fighterVX<0)ctx.scale(1,-1);
  sprite('coreFighter',0,0,30,.82);
  ctx.restore();
  const zakuVX=next.zaku.x-z.x, zakuVY=next.zaku.y-z.y;
  ctx.translate(z.x,z.y);ctx.scale((kick?dx:zakuVX)>0?-1:1,1);
  ctx.rotate(Math.atan2(zakuVY,Math.abs(zakuVX))*.15);
  sprite(kick&&images.charKick1?'charKick1':'charZaku',0,0,kick?30:26,.78);
  ctx.restore();
 }
 function drawBackdrop(){if(!bossStarted)return;const t=battleAge,{x:mx,y:my}=musaiPosition(t);ctx.save();sprite('charMusaiBackground',mx,my,290,.48);if(!ship.sunk)drawDistantDuel(t,mx,my);drawEvacuationBackdrop();for(let i=0;i<12;i++){const a=images['supplyCargo'+i%6];if(!a)continue;ctx.save();ctx.translate(290+(i%6)*105+Math.sin(t*.21+i)*22,160+Math.floor(i/6)*115+Math.cos(t*.27+i*1.6)*20);ctx.rotate(Math.sin(t*.17+i)*.3);sprite('supplyCargo'+i%6,0,0,22+(i%3)*5,.55);ctx.restore();}ctx.restore();}
 function gattleWidth(){const z=images.zaku||{sw:65,sh:65},g=images.gattle||{sw:2,sh:1};return 65*z.sh/z.sw/2*g.sw/g.sh;}

 function level(){return Math.max(1,Math.min(5,api.level?.()||1));}
 function launchMissiles(e){const angle=Math.atan2(player().y-e.y,player().x-e.x);for(let i=0;i<4;i++){const a=angle+(i-1.5)*.48;api.addBullet({x:e.x-10,y:e.y+(i-1.5)*7,vx:Math.cos(a)*185,vy:Math.sin(a)*185,angle:a,r:6,type:'missile',gattleHoming:true,age:0,trail:[]});}}
 function updateMissile(b,dt){b.age+=dt;b.trail.push({x:b.x,y:b.y});if(b.trail.length>16)b.trail.shift();if(b.age>.3&&b.age<2.2){const target=Math.atan2(player().y-b.y,player().x-b.x),delta=Math.atan2(Math.sin(target-b.angle),Math.cos(target-b.angle));b.angle+=Math.max(-1.1*dt,Math.min(1.1*dt,delta));}const speed=185+Math.min(45,b.age*20);b.vx=Math.cos(b.angle)*speed;b.vy=Math.sin(b.angle)*speed;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.age>5)b.x=-200;}
 const rushes=['kick','straight','uppercut'];
 const charTaunts=['charTauntAmai','charTauntPilot','charTauntOsoi'];
 const guardedDamageThreshold=3;
 const counterSpeedMultiplier=1.55;
 const rushDamage={kick:35,straight:30,uppercut:38};
 const rushSpeed={kick:1240,straight:1460,uppercut:1300};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function charVulnerable(c){return c.mode==='rushRecover';}
 function kickStartY(y,dir){const preferred=y+dir*148;return preferred>=55&&preferred<=H-55?preferred:clamp(y-dir*148,55,H-55);}
 function beginRush(c,kind,target,scale=1){const dx=target.x-c.x,dy=target.y-c.y,face=Math.sign(dx)||-1,d=Math.hypot(dx,dy)||1,rank=level()-1;
  c.facing=face;c.rushKind=kind;c.rushTarget={...target};c.mode='rush';c.hitThisRush=false;c.rushAge=0;
  const x1=kind==='uppercut'?target.x+dx*.25:kind==='straight'?target.x+face*55:target.x+dx/d*50;
  const y1=kind==='kick'?target.y+dy/d*50:c.y;
  const dip=kind==='uppercut'?(target.y-c.y)/.64:0;
  c.rushPath={x0:c.x,y0:c.y,x1,y1,dip};
  const speed=rushSpeed[kind]*(1+rank*.035);
  const duration=Math.max(.28,(Math.hypot(x1-c.x,y1-c.y)+dip*1.5)/speed);
  c.rushTime=duration/scale/(c.counterActive?counterSpeedMultiplier:1);
 }
 function beginChar(c){
  c.hp=c.max=22+3*(level()-1);
  c.tauntsLeft=[...charTaunts];
  c.tauntsDone=0;
  c.guardedDamage=0;
  c.counterActive=false;
  const p=player(),target={x:p.x,y:p.y};
  c.x=W+38;
  c.kickSide=p.y<H/2?1:-1;
  c.y=kickStartY(target.y,c.kickSide);
  c.rushIndex=0;
  beginRush(c,'kick',target);
 }
 function charDamage(c,amount){
  if(!charVulnerable(c))return 0;
  const damage=Math.min(amount,c.counterDamageLeft);
  if(c.tauntsDone===charTaunts.length){
   c.counterDamageLeft-=damage;
   return damage;
  }
  const guardedDamage=Math.min(damage,guardedDamageThreshold-c.guardedDamage);
  c.counterDamageLeft-=guardedDamage;
  c.guardedDamage+=guardedDamage;
  if(c.guardedDamage>=guardedDamageThreshold){
   c.counterActive=true;
   planRush(c);
  }
  return guardedDamage;
 }

 function aimRush(c){const plan=c.rushPlan,p=player(),target={x:p.x,y:p.y};
  plan.target=target;
  plan.x=clamp(target.x+plan.side*255,35,W-35);
  plan.y=plan.kind==='uppercut'?target.y-105:plan.kind==='kick'?kickStartY(target.y,c.kickSide):target.y;
 }
 function planRush(c){
  c.rushIndex=(c.rushIndex+1)%rushes.length;
  const kind=rushes[c.rushIndex];
  if(kind==='kick')c.kickSide=-c.kickSide;
  c.rushPlan={kind,side:player().x>W*.63?-1:1};
  aimRush(c);
  c.mode='rushReposition';
  c.clock=.55;
 }
 function recoverRush(c){
  c.mode='rushRecover';
  c.clock=.66-.035*(level()-1);
  c.counterDamageLeft=7;
 }
 function finishRush(c){
  if(!c.counterActive){recoverRush(c);return;}
  const index=Math.floor(Math.random()*c.tauntsLeft.length);
  c.tauntName=c.tauntsLeft.splice(index,1)[0];
  c.mode='rushTaunt';
  c.tauntStarted=false;
 }
 function updateChar(c,dt,speedScale=1,damageScale=1){
  if(c.mode==='rushTaunt'){
   if(api.charCueFinished&&!api.charCueFinished(c,c.tauntName,dt))return;
   c.tauntsDone++;
   c.guardedDamage=0;
   c.counterActive=false;
   recoverRush(c);
   return;
  }
  if(c.mode==='rushRecover'){c.clock-=dt;if(c.clock<=0)planRush(c);return;}
  if(c.mode==='rushReposition'){
   if(c.clock>0)aimRush(c);
   c.clock-=dt;
   const plan=c.rushPlan,dx=plan.x-c.x,dy=plan.y-c.y;
   const distance=Math.hypot(dx,dy),speed=(c.counterActive?1380:920)*speedScale,move=Math.min(distance,speed*dt);
   if(distance>0){c.x+=dx/distance*move;c.y+=dy/distance*move;c.facing=Math.sign(dx)||c.facing;}
   if(move===distance)beginRush(c,plan.kind,plan.target,speedScale);
   return;
  }
  if(c.mode!=='rush'){beginChar(c);return;}
  const path=c.rushPath,from=c.rushAge/c.rushTime;c.rushAge=Math.min(c.rushTime,c.rushAge+dt);const to=c.rushAge/c.rushTime;
  const steps=Math.max(1,Math.ceil((to-from)*(Math.abs(path.x1-path.x0)+Math.abs(path.y1-path.y0)+4*path.dip)/7));
  for(let i=1;i<=steps;i++){const t=from+(to-from)*i/steps,nx=path.x0+(path.x1-path.x0)*t,ny=path.y0+(path.y1-path.y0)*t+4*path.dip*t*(1-t);
   c.x=nx;c.y=ny;const p=player();
   if(!c.hitThisRush&&Math.hypot(p.x-nx,p.y-ny)<44+(api.hitRadius?.()??13)){c.hitThisRush=true;(api.charHit||api.hit)((rushDamage[c.rushKind]+(c.counterActive?10:0))*damageScale,damageScale<1?1:2);}
  }
  if(c.rushAge>=c.rushTime)finishRush(c);
 }
 function charArt(c){return c.mode==='rush'?{kick:'charKick1',straight:'charPunch0',uppercut:'charPunch1'}[c.rushKind]:['rushRecover','rushTaunt','retreatSpeech'].includes(c.mode)?'charZaku':'charKick0';}
 function drawCharCue(){}
 function rockHeight(e){const a=images['asteroidArt'+e.seed%6];return a?e.radius*2*a.sh/Math.max(a.sw,a.sh):e.radius*2;}
 function formation(index,postChar=false){
  const group={members:[],paid:false};
  groups.push(group);
  for(let i=0;i<(postChar?5:4);i++){
   const base=postChar&&index%3===2?H*(.23+.13*i):160+(index%2)*320+i%2*26;
   const missileClock=postChar&&i%2===1?Infinity:(postChar?3.2:4)-.45*(level()-1)+i*(postChar?.65:.25);
   group.members.push(entity('gattle',W+70+i*90,base,2,gattleWidth(),{
    shot:postChar?2.4+i*.55:6+i*.5,missileClock,group,base,postChar
   }));
  }
 }
 function makeScenicRock(rock){
  rock.scenic=true;
  rock.loaded=false;
  rock.turret=null;
 }
 function asteroid(index,scenic){
  const r=54+(index%3)*13,y=index%2?H-95-r:95+r;
  const rock=entity('asteroid',W+r+20,y,28+(index%3)*6,r*2,{radius:r,seed:index,loaded:index%3!==1,turret:index%4!==3?{hp:3,max:3,clock:2.5}:null});
  if(scenic)makeScenicRock(rock);
 }
 const waveTimes=[1,7,13,27,36,46,56,66,76];
 function update(time,dt){
  if(bossStarted)battleAge+=dt;
  if(inTransfer()){updateTransfer(dt);return;}
  // Give the last armed rocks time to leave at their normal scroll speed.
  const clearingForChar=!charStarted&&(charMusicAt!==null||(time>=23.5&&time<82));
  if(time>=38&&clearingForChar&&charMusicAt===null){
   const enemiesRemain=enemies().some(e=>e.hp>0&&!(e.stage3Kind==='asteroid'&&e.scenic));
   if(!enemiesRemain&&!api.enemyShotsPresent?.()){
    charMusicAt=time;
    api.playCharPrelude?.();
   }
  }
  const preludeDuration=5;
  if(!charStarted&&charMusicAt!==null&&time-charMusicAt>=preludeDuration&&
     (api.charPreludeFinished?.(preludeDuration)!==false||time-charMusicAt>=12)){
   charStarted=true;
   api.spawnChar();
  }
  const charPresent=api.charPresent?.();
  if(charStarted&&!charPresent&&charExitTime===null)charExitTime=time;
  const resumingPatrol=charExitTime!==null&&time-charExitTime<postCharDuration;
  if(resumingPatrol&&postCharWaves<postCharWaveTimes.length&&time-charExitTime>=postCharWaveTimes[postCharWaves]){
   formation(postCharWaves++,true);
  }
  if(time<82&&waves<waveTimes.length&&time>=waveTimes[waves]){
   const wave=waves++;
   if(!clearingForChar&&!charPresent&&!resumingPatrol)formation(wave);
  }
  if((charPresent||(time<82&&rocks<32))&&time>=6+rocks*2.3){
   asteroid(rocks++,clearingForChar||charPresent);
  }
  if(time>=90&&!bossStarted&&!clearingForChar&&!charPresent&&!resumingPatrol){
   bossStarted=true;
   for(const e of enemies())if(e.stage3Kind==='asteroid'&&!e.scenic)e.hp=0;
   ship=entity('supply',W+260,H/2,80,440,{phase:'guarded',guards:[],window:0,damageSpent:0,cycle:0,parts:buildParts()});
   launchGuards();
   old=entity('old',W+100,210,24,65,{facing:-1,burstLeft:0,burstClock:0});
   api.setBoss({kind:'supplyPair',x:900,y:H/2,hp:104,max:104,units:[ship,old],guards:[],turrets:[]});
  }
  if(ship?.sunk)updateGademScene(dt);
  else if(ship?.hp<=0)updateBombardment(dt);
 }

 function inTransfer(){return !!ship?.transfer&&ship.transfer.phase!=='done';}
 function updateEnemy(e,dt){if(!e.stage3Kind)return false;e.age+=dt;if(e.stage3Kind==='charFinal'){updateFinalChar(e,dt);return true;}if(e.stage3Kind==='asteroid'){e.x-=90*dt;if(e.turret?.hp>0){e.turret.clock-=dt;if(e.turret.clock<=0&&e.x<W){e.turret.clock=6;fire(e.x,e.y+(e.y<H/2?1:-1)*(rockHeight(e)/2+7),180);}}return true;}
 if(e.stage3Kind==='gattle'){e.x-=(e.postChar?170:145)*dt;e.y=e.base+Math.sin(e.age*2)*18;e.missileClock-=dt;if(e.x<W-25&&e.x>80&&e.missileClock<=0){launchMissiles(e);e.missileClock=10-1.5*(level()-1);}}else if(e.stage3Kind==='supply'){e.x=Math.max(915,e.x-50*dt);e.y=H/2+Math.sin(e.age*.35)*45;updateSupply(dt);}else if(e.stage3Kind==='papuaGuard'){const tx=ship.x-180-e.guardSlot*58,ty=ship.y+(e.guardSlot-1)*105+Math.sin(e.age*2)*24,dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy),step=Math.min(d,300*dt);if(d){e.x+=dx/d*step;e.y+=dy/d*step;}}else{updateOld(e,dt);return true;}
 if(e.stage3Kind==='old')constrain(e,33);e.shot-=dt;if(e.shot<=0&&e.x<W-30){e.shot=e.stage3Kind==='old'?2:e.stage3Kind==='supply'?4.5:e.stage3Kind==='papuaGuard'?2.8:e.postChar?2.8:6;const mount=e.stage3Kind==='supply'?(e.parts.find(p=>p.hp>0&&p.index<3)||e.parts[2]):null;fire(mount?e.x+mount.x-mount.w*.35:e.x-30,mount?e.y+mount.y:e.y,e.postChar?225:e.stage3Kind==='old'?210:180);}const p=player();if(e.stage3Kind==='supply'){if(Math.abs(p.x-e.x)<215&&Math.abs(p.y-e.y)<55)api.hit();}else if(Math.hypot(p.x-e.x,p.y-e.y)<e.size*.4+16&&!api.meleeSafe(e))api.hit();return true;}


 function updateOld(e,dt){
  if(ship.sunk){
   if(ship.gademScene.dialogueDone)updateChar(e,dt,e.enraged?.75:.5,.5);
   return;
  }
  if(ship.hp<=0)return;
  const protecting=ship.phase==='open';
  const targetX=Math.min(W+80,ship.x-(protecting?75:155));
  const targetY=ship.y-70+Math.sin(e.age*1.5)*(protecting?32:90);
  const dx=targetX-e.x,dy=targetY-e.y,distance=Math.hypot(dx,dy);
  if(distance){
   const step=Math.min(distance,180*dt);
   e.x+=dx/distance*step;
   e.y+=dy/distance*step;
  }
  constrain(e,33);
  e.facing=player().x<e.x?-1:1;
  if(e.x>=W-30)return;
  if(e.burstLeft>0){
   e.burstClock-=dt;
   if(e.burstClock<=0){
    fire(e.x+e.facing*25,e.y,210);
    e.burstLeft--;
    e.burstClock=.18;
   }
  }else if((e.shot-=dt)<=0){
   e.shot=2.8;
   e.burstLeft=3;
   e.burstClock=0;
  }
 }
 function launchGuards(){ship.cycle++;ship.guards=[];for(let i=0;i<3;i++)ship.guards.push(entity('papuaGuard',ship.x+20+i*16,ship.y+55,6,65,{guardSlot:i,shot:1+i*.45}));}
 function updateSupply(dt){if(inTransfer())return;if(ship.phase==='guarded'&&ship.guards.every(g=>g.hp<=0)){ship.phase='open';ship.window=4;ship.damageSpent=0;}else if(ship.phase==='open'){ship.window-=dt;if(ship.window<=0||ship.damageSpent>=28){ship.phase='cooldown';ship.window=2;}}else if(ship.phase==='cooldown'){ship.window-=dt;if(ship.window<=0){ship.phase='guarded';launchGuards();}}}
 function damageGadem(e,amount){
  const scene=ship.gademScene;
  if(!scene?.dialogueDone||e.hp<=0||amount<=0)return 0;
  if(e.hp===e.max)scene.combatLines.push('charStopGadem');
  const toHalf=e.hp-e.max/2;
  if(!e.enraged&&amount>=toHalf){
   e.enraged=true;
   if(e.mode==='rush'){
    e.rushTime/=1.5;
    e.rushAge/=1.5;
   }
   scene.combatLines.push('gademTooFar');
   return toHalf;
  }
  return amount;
 }
 function filterDamage(e,amount,source){if(e.stage3Kind==='asteroid'&&e.scenic)return 0;if(e.stage3Kind==='old')return damageGadem(e,amount);
  if(e.stage3Kind==='charFinal'){
   const scene=ship.gademScene;
   if(scene.evacuation)return 0;
   if(amount>=e.hp){
    scene.evacuation={phase:'bright',age:0};
    return e.hp-1;
   }
   return amount;
  }
  if(e.stage3Kind!=='supply')return amount;if(e.hp<=0||inTransfer()||e.phase!=='open'||e.damageSpent>=28)return 0;
  const p=partAt(source);
  if(!p)return 0;
  const untilTransfer=e.transfer?Infinity:e.hp-e.max/2;
  const allowed=Math.min(amount,p.hp,28-e.damageSpent,untilTransfer);
  if(!e.transfer&&allowed===untilTransfer)e.transfer={phase:'orders',age:0};
  p.hp=Math.max(0,p.hp-allowed);e.damageSpent+=allowed;if(p.hp<=0&&p.brokenAt===null)breakPart(p);return allowed;}

 function onKilled(e){if(!e.stage3Kind)return false;if(e.stage3Rewarded)return true;e.stage3Rewarded=true;e.killed=true;
 if(e.stage3Kind==='asteroid'){explode(e.x,e.y,'#a1a8ae',28,'silent');if(e.loaded)for(let i=0;i<3;i++)add({x:e.x+(i-1)*40,y:e.y+(i-1)*55,base:e.y+(i-1)*55,hp:2,type:'zaku',size:65,age:0,shot:2+i*.7,phase:i,red:false,canRetreat:false,independent:false,retreat:0,nextRetreat:999});api.score(100);}
 else if(e.stage3Kind==='papuaGuard'){api.destroyOld(e);}
 else if(e.stage3Kind==='gattle'){explode(e.x,e.y,'#ffb36c',22);api.score(100);if(e.group.members.every(m=>m.killed)&&!e.group.paid){e.group.paid=true;capsule(e.x,e.y);}}
 else if(e.stage3Kind==='supply'){e.bombardmentAge=0;explode(e.x-38,e.y,'#ffbf6c',36,'silent');}
 else if(e.stage3Kind==='old'){
  const scene=ship.gademScene;
  scene.defeatedAt=scene.age;
  scene.combatLines.push('gademDefeatDialogue');
  api.score(1500);
  material(e.x,e.y,3,2);
 }
 return true;}
 function interceptShot(s){s.hitTargets ||= new Set();for(const e of enemies()){if(e.hp<=0||!['asteroid','supply'].includes(e.stage3Kind)||s.hitTargets.has(e))continue;const turret=e.stage3Kind==='asteroid'&&e.turret?.hp>0&&Math.hypot(s.x-e.x,s.y-(e.y+(e.y<H/2?1:-1)*(rockHeight(e)/2+7)))<22+Math.max(s.w,s.h)/2;
 const body=e.stage3Kind==='asteroid'?Math.hypot(s.x-e.x,s.y-e.y)<e.radius+Math.max(s.w,s.h)/2:!!partAt({x:s.x,y:s.y,r:Math.max(s.w,s.h)/2});if(!body&&!turret)continue;if(['bazooka','cannon'].includes(s.kind)){api.detonate(s);return true;}if(turret){e.turret.hp=Math.max(0,e.turret.hp-s.damage);if(!e.turret.hp)explode(e.x,e.y+(e.y<H/2?1:-1)*(rockHeight(e)/2+7),'#ffc56c',15);}else damage(e,s.damage,{x:s.x,y:s.y,r:Math.max(s.w,s.h)/2});s.hitTargets.add(e);if(s.kind!=='laser'){s.life=0;return true;}}return false;}
 function constrain(body,pad=28){for(let repeat=0;repeat<4;repeat++)for(const e of enemies()){if(e.hp<=0||e.stage3Kind!=='asteroid')continue;const dx=body.x-e.x,dy=body.y-e.y,d=Math.hypot(dx,dy),r=e.radius+pad;if(d<r){const a=d>.001?Math.atan2(dy,dx):(body.y<H/2?Math.PI/2:-Math.PI/2);body.x=Math.max(40,Math.min(W-45,e.x+Math.cos(a)*r));body.y=Math.max(35,Math.min(H-35,e.y+Math.sin(a)*r));api.stopTarget(body);}}}
 function drawEnemy(e){if(!e.stage3Kind)return false;if(e.stage3Kind==='charFinal'){sprite('charZaku',e.x,e.y,65);return true;}if(e.stage3Kind==='gattle'){sprite('gattle',e.x,e.y,gattleWidth());return true;}if(e.stage3Kind==='papuaGuard'){sprite('zaku',e.x,e.y,65);return true;}if(e.stage3Kind==='old'){
  ctx.save();
  ctx.translate(e.x,e.y);
  ctx.scale(e.facing>0?-1:1,1);
  if(e.mode==='rush')ctx.rotate(e.rushKind==='uppercut'?.38:e.rushKind==='kick'?-.30:-.16);
  const {zaku,oldZaku}=images;
  if(zaku&&oldZaku){
   const height=e.size*zaku.sh/zaku.sw;
   sprite('oldZaku',0,0,height*oldZaku.sw/oldZaku.sh);
  }
  ctx.restore();
  return true;
 }if(e.stage3Kind==='supply'){drawShip(e);return true;}
 const name='asteroidArt'+e.seed%6,a=images[name];if(a)sprite(name,e.x,e.y,e.radius*2*a.sw/Math.max(a.sw,a.sh));if(!e.scenic){ctx.fillStyle='#ffc385';ctx.fillRect(e.x-25,e.y-rockHeight(e)/2-14,50*e.hp/e.max,3);}if(e.turret?.hp>0)sprite('turret',e.x,e.y+(e.y<H/2?1:-1)*(rockHeight(e)/2+7),52);return true;}
 function drawShip(e){for(const p of e.parts){if(p.hp>0)drawPart(p);else drawRemnant(p);}ctx.save();ctx.font='10px monospace';ctx.textAlign='center';for(const p of e.parts){if(p.hp<=0)continue;const x=e.x+p.x,y=e.y+p.y-p.h/2-9;ctx.fillStyle='#07131dcc';ctx.fillRect(x-24,y-7,48,12);ctx.fillStyle=e.phase==='open'?'#ffe18a':'#88a7b4';ctx.fillRect(x-22,y-5,44*p.hp/p.max,3);ctx.fillText(p.name+' '+Math.ceil(p.hp),x,y-9);}ctx.fillStyle=e.phase==='open'?'#ffda6d':'#8cc8dc';ctx.font='14px sans-serif';ctx.fillText(e.phase==='open'?'部位装甲 OPEN '+Math.ceil(e.window)+'秒':e.phase==='cooldown'?'装甲閉鎖 / 次の護衛準備':'護衛を撃破して各部位を狙え',e.x,e.y+112);ctx.restore();}
 function drawBoss(){
  if(!bossStarted)return;
  ctx.save();
  ctx.font='14px monospace';
  ctx.textAlign='center';
  const finalChar=ship.gademScene?.gunfight?ship.gademScene.char:null;
  for(const [i,e]of [ship,finalChar||old].entries()){
   ctx.fillStyle='#081522dd';
   ctx.fillRect(300+i*310,22,280,42);
   ctx.fillStyle=i?'#b7e29f':'#b2cde3';
   if(i&&finalChar&&ship.gademScene.evacuation){
    ctx.fillText('シャアザク',440+i*310,40);
   }else if(!i&&inTransfer()){
    ctx.fillText('補給艦 / 物資移送中',440+i*310,40);
    ctx.fillRect(312+i*310,49,128,7);
   }else if(i&&ship.sunk&&!ship.gademScene.dialogueDone){
    ctx.fillText('ガデム / シャア合流',440+i*310,40);
   }else if(i&&!ship.sunk){
    ctx.fillText('旧ザク / 補給艦護衛',440+i*310,40);
   }else{
    const label=i?(finalChar?'シャアザク':'ガデム旧ザク'):ship.sunk?'補給艦 撃沈':ship.hp<=0?'補給艦 / 味方砲撃中':ship.phase==='open'?'補給艦 / 攻撃可':'補給艦 / 装甲閉鎖';
    ctx.fillText(label+' HP '+Math.max(0,Math.ceil(e.hp))+' / '+e.max,440+i*310,40);
    ctx.fillRect(312+i*310,49,256*Math.max(0,e.hp/e.max),7);
   }
  }
  ctx.restore();
 }
 return {drawBackdrop,drawDebris,drawFade,epilogueBgmGain,playerEvacuating,inTransfer,filterDamage,charVulnerable,charDamage,beginChar,charArt,reset,update,updateMissile,updateChar,drawCharCue,updateEnemy,onKilled,interceptShot,constrain,drawEnemy,drawBoss,get bossStarted(){return bossStarted;}};
};
