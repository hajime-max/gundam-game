(function(root){
 'use strict';
 const CELL=16, TILE_COLS=210, TILE_ROWS=262;
 const ROOM_W=TILE_COLS*CELL, ROOM_H=TILE_ROWS*CELL, cols=TILE_COLS*2, rows=TILE_ROWS*2;
 const width=cols*CELL,height=rows*CELL;
 // The background team's open PNGs share centered 144px ports.
 const definitions=[
  {id:'grid',name:'多層区画',color:'#91b9c8',ends:[170,965,1220,180]},
  {id:'ring',name:'環状回廊',color:'#83cbd0',ends:[155,970,1260,155]},
  {id:'towers',name:'左右の双塔',color:'#a5acda',ends:[315,955,1195,158]},
  {id:'hangars',name:'段違い格納庫',color:'#d1aa7e',ends:[170,970,1230,155]}
 ];
 const tileIds=definitions.map(tile=>tile.id), tiles=new Map();
 const connections=[[0,1],[0,2],[1,3],[2,3]];
 function shuffle(values,random){
  const copy=values.slice();
  for(let i=copy.length-1;i>0;i--){
   const j=Math.floor(random()*(i+1));
   [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
 }
 function prepareTile(id,pixels){
  const definition=definitions.find(tile=>tile.id===id);
  if(!definition||pixels.length!==TILE_COLS*TILE_ROWS*4)throw Error('Invalid Luna2 tile '+id);
  const raw=new Uint8Array(TILE_COLS*TILE_ROWS);
  for(let i=0;i<raw.length;i++){
   const offset=i*4,r=pixels[offset],g=pixels[offset+1],b=pixels[offset+2];
   raw[i]=r>37&&(r+g+b)/3>65?1:0;
  }
  // Close small gaps from railings and dark furniture in the painted floors.
  const expanded=raw.slice(), mask=raw.slice();
  for(let y=1;y<TILE_ROWS-1;y++)for(let x=1;x<TILE_COLS-1;x++){
   const i=y*TILE_COLS+x;
   if(raw[i-1]||raw[i+1]||raw[i-TILE_COLS]||raw[i+TILE_COLS])expanded[i]=1;
  }
  for(let y=1;y<TILE_ROWS-1;y++)for(let x=1;x<TILE_COLS-1;x++){
   const i=y*TILE_COLS+x;
   mask[i]=expanded[i]&&expanded[i-1]&&expanded[i+1]&&expanded[i-TILE_COLS]&&expanded[i+TILE_COLS]?1:0;
  }
  const [north,east,south,west]=definition.ends;
  for(let y=0;y<TILE_ROWS;y++)for(let x=0;x<TILE_COLS;x++){
   const artX=(x+.5)*1122/TILE_COLS,artY=(y+.5)*1402/TILE_ROWS;
   const vertical=Math.abs(artX-561)<72&&(artY<north+18||artY>south-18);
   const horizontal=Math.abs(artY-701)<72&&(artX<west+18||artX>east-18);
   const i=y*TILE_COLS+x;
   if(vertical||horizontal)mask[i]=1;
   else if(x<2||x>=TILE_COLS-2||y<2||y>=TILE_ROWS-2)mask[i]=0;
  }
  tiles.set(id,mask);
 }
 function walkable(shots){
  const free=new Uint8Array(shots.length);
  for(let y=2;y<rows-2;y++)for(let x=2;x<cols-2;x++){
   const i=y*cols+x;
   if(!shots[i])continue;
   let open=true;
   for(let dy=-2;open&&dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
    if(!shots[i+dy*cols+dx]){open=false;break;}
   }
   if(open)free[i]=1;
  }
  return free;
 }
 const point=i=>[(i%cols+.5)*CELL,(Math.floor(i/cols)+.5)*CELL];
 function flood(free,first){
  const parents=new Int32Array(free.length).fill(-1),queue=new Int32Array(free.length);
  let count=1;
  queue[0]=first;parents[first]=first;
  for(let i=0;i<count;i++){
   const current=queue[i];
   for(const next of [current-1,current+1,current-cols,current+cols]){
    if(free[next]&&parents[next]<0){parents[next]=current;queue[count++]=next;}
   }
  }
  return parents;
 }
 function closestCell(free,x,y){
  let best=-1,dist=Infinity;
  for(let i=0;i<free.length;i++){
   if(!free[i])continue;
   const [cx,cy]=point(i),d=(x-cx)**2+(y-cy)**2;
   if(d<dist){best=i;dist=d;}
  }
  if(best<0)throw Error('ルナ2の出入口を配置できませんでした。');
  return best;
 }
 function placeSupplies(free,rooms,start,goal,route,random){
  const result=[],lifeCandidates=[];
  const routeSamples=route.filter((_,i)=>i%8===0);
  for(const room of rooms){
   const positions=[];
   for(let y=8;y<TILE_ROWS-8;y+=5)for(let x=8;x<TILE_COLS-8;x+=5){
    const gx=room.x/CELL+x,gy=room.y/CELL+y;
    if(!free[gy*cols+gx])continue;
    const [px,py]=point(gy*cols+gx);
    if(Math.hypot(px-start[0],py-start[1])<200||Math.hypot(px-goal[0],py-goal[1])<200)continue;
    positions.push({x:px,y:py});
   }
   const chosen=[];
   for(const p of shuffle(positions,random)){
    if(chosen.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<370))continue;
    chosen.push({...p,value:chosen.length<3?3:chosen.length<8?2:1});
    if(chosen.length===14)break;
   }
   result.push(...chosen);
   let best=null,bestScore=-Infinity;
   for(const p of positions){
    if(chosen.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<100))continue;
    const distance=routeSamples.reduce((min,[x,y])=>Math.min(min,Math.hypot(x-p.x,y-p.y)),Infinity);
    if(distance<150)continue;
    const col=Math.floor(p.x/CELL),row=Math.floor(p.y/CELL);
    let walls=0;
    for(const [dx,dy] of [[-6,0],[6,0],[0,-6],[0,6],[-4,-4],[4,-4],[-4,4],[4,4]]){
     if(!free[(row+dy)*cols+col+dx])walls++;
    }
    const score=walls*250+Math.min(distance,900);
    if(score>bestScore){best={...p,kind:'life'};bestScore=score;}
   }
   if(best)lifeCandidates.push({item:best,score:bestScore});
  }
  lifeCandidates.sort((a,b)=>b.score-a.score);
  result.push(...lifeCandidates.slice(0,2).map(({item})=>item));
  return result;
 }
 function create(random=Math.random,previous=''){
  if(tiles.size!==definitions.length)throw Error('ルナ2の背景がまだ読み込まれていません。');
  const order=shuffle(definitions,random);
  const signatureOf=()=>order.map(tile=>tile.id).join(',');
  if(signatureOf()===previous)order.push(order.shift());
  const rooms=order.map((theme,id)=>({id,x:id%2*ROOM_W,y:Math.floor(id/2)*ROOM_H,theme}));
  const shots=new Uint8Array(cols*rows);
  for(const room of rooms){
   const mask=tiles.get(room.theme.id),originX=room.x/CELL,originY=room.y/CELL;
   for(let y=0;y<TILE_ROWS;y++)shots.set(mask.subarray(y*TILE_COLS,(y+1)*TILE_COLS),(originY+y)*cols+originX);
  }
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   if(x<3||x>=cols-3||y<3||y>=rows-3)shots[y*cols+x]=0;
  }
  const free=walkable(shots);
  const first=closestCell(free,ROOM_W*.26,ROOM_H*.10);
  const last=closestCell(free,ROOM_W*1.65,ROOM_H*1.91);
  const parents=flood(free,first);
  if(parents[last]<0)throw Error('ルナ2の最深部へつながる経路がありません。');
  const portCells=[
   Math.floor(TILE_ROWS/2)*cols+TILE_COLS,
   (TILE_ROWS+Math.floor(TILE_ROWS/2))*cols+TILE_COLS,
   TILE_ROWS*cols+Math.floor(TILE_COLS/2),
   TILE_ROWS*cols+TILE_COLS+Math.floor(TILE_COLS/2)
  ];
  if(portCells.some(i=>parents[i]<0))throw Error('ルナ2の区画間通路が接続されていません。');
  for(let i=0;i<free.length;i++)if(parents[i]<0)free[i]=0;
  const route=[];
  for(let i=last;;i=parents[i]){
   route.push(point(i));
   if(i===first)break;
  }
  route.reverse();
  const start=point(first),goal=point(last);
  return {nav:{cell:CELL,cols,width,height,start,goal,route,free,shots},rooms,connections,
   signature:signatureOf(),supplies:placeSupplies(free,rooms,start,goal,route,random)};
 }
 function draw(ctx,map,camera,W,H,art){
  ctx.fillStyle='#111c29';ctx.fillRect(0,0,W,H);
  for(const room of map.rooms){
   const x=room.x-camera.x,y=room.y-camera.y;
   if(x>W||x+ROOM_W<0||y>H||y+ROOM_H<0)continue;
   const image=art?.[room.theme.id];
   if(image)ctx.drawImage(image,x,y,ROOM_W,ROOM_H);
  }
  // Close only the mouths that face outside the 2×2 block.
  const horizontal=ROOM_W*144/1122,vertical=ROOM_H*144/1402;
  ctx.fillStyle='#263746';
  for(const y of [ROOM_H/2,ROOM_H*1.5]){
   ctx.fillRect(-camera.x,y-vertical/2-camera.y,48,vertical);
   ctx.fillRect(width-48-camera.x,y-vertical/2-camera.y,48,vertical);
  }
  for(const x of [ROOM_W/2,ROOM_W*1.5]){
   ctx.fillRect(x-horizontal/2-camera.x,-camera.y,horizontal,48);
   ctx.fillRect(x-horizontal/2-camera.x,height-48-camera.y,horizontal,48);
  }
 }
 root.Luna2Maze={create,draw,prepareTile,tileIds,tileCols:TILE_COLS,tileRows:TILE_ROWS,roomWidth:ROOM_W,roomHeight:ROOM_H};
})(typeof window==='undefined'?module.exports:window);
