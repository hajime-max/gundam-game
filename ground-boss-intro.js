'use strict';
// Stage-one camera sequence. Combat coordinates and input sensitivity stay unchanged.
window.createGroundBossIntro = function({canvas,ctx,width:W,height:H,images,background}) {
  const voice=new Audio();
  voice.preload='none';voice.src='game-assets/audio/ground-boss-dialogue.wav?v=133';voice.volume=1;
  const shot=document.createElement('canvas');shot.width=W;shot.height=H;
  let active=false,done=false,phase='in',age=0,talk=0,pending=false,retry=0,epoch=0;
  const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function pause(){epoch++;pending=false;voice.pause();}
  function reset(){pause();try{voice.currentTime=0;}catch{}active=false;done=false;age=talk=retry=0;phase='in';}
  function prime(){const token=epoch;voice.muted=true;voice.volume=0;try{Promise.resolve(voice.play()).then(()=>{if(token!==epoch||active)return;voice.pause();try{voice.currentTime=0;}catch{}voice.muted=false;voice.volume=1;}).catch(()=>{if(token===epoch&&!active){voice.muted=false;voice.volume=1;}});}catch{voice.muted=false;voice.volume=1;}}
  function start(){voice.muted=false;shot.getContext('2d').drawImage(canvas,0,0);active=true;phase='in';age=talk=0;}
  function play(){if(pending||!voice.paused||retry>0)return;pending=true;const token=epoch;voice.volume=1;let playback;try{playback=voice.play();}catch{pending=false;retry=.5;return;}Promise.resolve(playback).then(()=>{if(token===epoch)pending=false;}).catch(()=>{if(token===epoch){pending=false;retry=.5;}});}
  function update(dt,muted){retry=Math.max(0,retry-dt);if(phase==='in'){age+=dt;if(age>=1.5){phase='talk';age=0;}return;}if(phase==='talk'){if(muted){pause();talk+=dt;}else if(voice.error){talk+=dt;}else{if(Math.abs(voice.currentTime-talk)>.2){try{voice.currentTime=talk;}catch{}}play();talk=voice.currentTime;}if(talk>=34.4-.03||voice.ended){pause();phase='out';age=0;}return;}age+=dt;if(age>=1.5){active=false;done=true;}}
  function suit(key,x,y,height){const a=images[key];if(!a)return;const w=height*a.sw/a.sh;ctx.imageSmoothingEnabled=false;ctx.drawImage(a.im,a.sx,a.sy,a.sw,a.sh,x-w/2,y-height/2,w,height);}
  function person(x,y,speaker,gesture,boarding=0,facing=1){if(boarding>=1)return;ctx.save();ctx.translate(x,y);ctx.scale(facing*.88,.88);ctx.globalAlpha=boarding>.82?(1-boarding)/.18:1;ctx.lineJoin='round';
    const shape=(points,fill)=>{ctx.beginPath();ctx.moveTo(...points[0]);for(const point of points.slice(1))ctx.lineTo(...point);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#19272a';ctx.lineWidth=1.2;ctx.stroke();};
    ctx.fillStyle='#14201e66';ctx.beginPath();ctx.ellipse(0,23,13,3,0,0,Math.PI*2);ctx.fill();
    shape([[-6,5],[0,5],[-2,16],[-5,20],[-9,20],[-8,16]],'#62755f');shape([[0,4],[6,5],[8,17],[8,22],[3,22],[1,17]],'#98a17c');
    shape([[-10,16],[-3,16],[-3,22],[-12,22],[-12,20]],'#293c3c');shape([[3,16],[10,16],[13,20],[13,22],[3,22]],'#293c3c');
    shape([[-8,-11],[3,-14],[9,-9],[7,8],[-6,8]],'#929b78');shape([[-7,-10],[-3,-12],[-2,2],[-6,3]],'#526c5d');shape([[0,-11],[6,-10],[6,1],[0,2]],'#788c6a');
    ctx.fillStyle='#d8d5b2';ctx.fillRect(3,-10,2,13);ctx.fillStyle='#b9bb94';ctx.fillRect(-8,2,16,3);ctx.fillStyle='#ddc58b';ctx.fillRect(-2,2,4,4);ctx.fillStyle='#536457';ctx.fillRect(-5,-1,3,3);ctx.fillRect(1,-1,4,3);
    const lift=gesture?-10:0;shape([[-8,-11],[-12,-8],[-12,3],[-8,6],[-5,-3]],'#5c7564');shape([[5,-12],[11,-9],[13,1+lift],[9,5+lift],[3,-4]],'#a7af88');
    ctx.fillStyle='#384d46';ctx.fillRect(-12,2,4,5);ctx.fillRect(9,1+lift,5,5);
    shape([[-5,-17],[5,-17],[6,-10],[0,-7],[-6,-10]],'#822f43');
    // Three-quarter profile: rounded rear helmet, offset visor and projecting face.
    ctx.fillStyle='#d7d9b9';ctx.beginPath();ctx.ellipse(-1,-23,10,12,-.12,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#273b3b';ctx.lineWidth=1.4;ctx.stroke();
    shape([[-9,-26],[-5,-30],[-3,-21],[-5,-15],[-9,-16]],'#a2b39a');
    shape([[0,-25],[9,-25],[10,-19],[6,-15],[0,-16]],'#343344');ctx.fillStyle='#c99aa5';ctx.fillRect(3,-22,6,3);
    shape([[8,-19],[12,-17],[9,-15],[9,-12],[4,-13],[3,-16]],'#e5c5a4');
    shape([[1,-33],[3,-37],[5,-32],[4,-26],[1,-26]],'#c64648');ctx.fillStyle='#f4e6c3';ctx.fillRect(2,-32,2,4);
    ctx.fillStyle='#b9c5a4';ctx.fillRect(-11,-24,3,9);ctx.strokeStyle='#c7d0ad';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,-16);ctx.lineTo(-2,-11);ctx.lineTo(6,-11);ctx.lineTo(10,-15);ctx.stroke();
    if(speaker){ctx.strokeStyle='#ffe3a1';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,25,15,3,0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
  function scenery(key,x,y,height,alpha=1){const a=images[key];if(!a)return;ctx.save();ctx.globalAlpha=alpha;const width=height*a.sw/a.sh;ctx.drawImage(a.im,a.sx,a.sy,a.sw,a.sh,x-width/2,y-height,width,height);ctx.restore();}
  function boardingPilot(x,floor,start,speaker,facing=1){const progress=ease((talk-start)/2.5),walk=ease(progress*3),rise=ease((progress-.25)/.75);person(x+32*(1-walk),floor+7-rise*97,speaker,speaker&&progress===0&&Math.sin(talk*5)>.1,progress,facing);if(progress>0&&progress<1){ctx.save();ctx.strokeStyle='#c2b990';ctx.lineWidth=2;ctx.strokeRect(x-9,floor-112,18,15);ctx.restore();}}
  function draw(){const pan=phase==='in'?ease(age/1.5):phase==='out'?1-ease(age/1.5):1;ctx.save();ctx.fillStyle='#18251f';ctx.fillRect(0,0,W,H);ctx.drawImage(shot,-W*pan,0);ctx.translate(W*(1-pan),0);background();ctx.fillStyle='#0b17152b';ctx.fillRect(0,0,W,H);const floor=H*.74;scenery('ruinedCover2',W*.08,floor+16,200,.86);scenery('ruinedCover6',W*.93,floor-4,180,.82);scenery('ruinedCover4',W*.51,floor-78,92,.52);const shade=ctx.createRadialGradient(W*.52,H*.52,90,W*.52,H*.52,W*.7);shade.addColorStop(0,'#09191300');shade.addColorStop(1,'#09191377');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
    const firstAdvance=ease((talk-9)/2.4),secondAdvance=ease((talk-21.4)/3),geneAdvance=firstAdvance,geneX=W*(.68-.5*firstAdvance-.33*secondAdvance),geneWalking=talk>=9&&talk<11.4||talk>=21.4&&talk<24.4;const geneSuit=geneWalking?'groundZakuRun'+Math.floor(Math.max(0,talk-9)/.09)%8:'groundZakuAction0';suit('groundZakuAction3',W*.35,floor-84,174);suit(geneSuit,geneX,floor-84+(geneWalking?Math.sin((talk-6)*20)*2:0)+geneAdvance*10,174);
    // The accepted clips are Gene (11.4s), Denim (8s), Gene (15s).
    const gene=phase==='talk'&&(talk<11.4||talk>=19.4),denim=phase==='talk'&&!gene;
    boardingPilot(W*.35,floor,8,denim);boardingPilot(geneX,floor,3.5,gene,-1);
    ctx.textAlign='center';ctx.font='bold 15px sans-serif';ctx.fillStyle='#e7e4ca';ctx.fillText('デニム',W*.35+38,floor+54);ctx.fillStyle='#f4d28f';if(geneX>0)ctx.fillText('ジーン',geneX-43,floor+54);
    ctx.fillStyle='#02090dbb';ctx.fillRect(0,0,W,48);ctx.fillRect(0,H-48,W,48);ctx.fillStyle='#e3e8da';ctx.font='16px sans-serif';ctx.fillText('敵モビルスーツ部隊',W/2,31);if(phase==='talk'&&voice.paused&&!voice.error)ctx.fillText('音声を再開するには画面をタップ',W/2,H-19);ctx.restore();}
  return {get active(){return active;},get done(){return done;},get talking(){return active&&phase==='talk';},start,update,draw,pause,reset,prime};
};
