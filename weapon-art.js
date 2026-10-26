/* Approved sprite-sheet geometry only. No damage, movement or input rules. */
(function(root){
'use strict';
root.createWeaponArt=function({images,ctx}){
 function annotateBody(prefix,count){const measured=root.GameSpriteMetadata?.bodies[prefix];if(measured){for(let i=0;i<count;i++)if(images[prefix+i])Object.assign(images[prefix+i],measured[i]);return;}const first=images[prefix+'0'];if(!first)return;const im=first.im,c=document.createElement('canvas');c.width=im.width;c.height=im.height;const q=c.getContext('2d');q.drawImage(im,0,0);const pixels=q.getImageData(0,0,c.width,c.height).data;
  for(let n=0;n<count;n++){const f=images[prefix+n];if(prefix==='javelinArt'&&n===3){const right=f.sx+f.sw;f.sx=Math.max(f.sx,Math.floor(im.width*.54));f.sw=right-f.sx;}let left=im.width,right=0,top=im.height,bottom=0;const xs=new Map(),ys=new Map();for(let y=f.sy;y<f.sy+f.sh;y++)for(let x=f.sx;x<f.sx+f.sw;x++){const i=(y*im.width+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(pixels[i+3]>200&&((r>120&&g<r*.65&&b<r*.65)||(r>130&&g>85&&b<90&&g>r*.4))){xs.set(x,(xs.get(x)||0)+1);ys.set(y,(ys.get(y)||0)+1);}}for(const [x,num]of xs)if(num>=5){left=Math.min(left,x);right=Math.max(right,x);}for(const [y,num]of ys)if(num>=5){top=Math.min(top,y);bottom=Math.max(bottom,y);}if(right>left&&bottom>top){f.bodyX=(left+right)/2;f.bodyBottom=bottom;f.bodyHeight=bottom-top+1;}}
  c.width=c.height=1;
 }
 function annotateHammers(){const im=images.hammerArt0?.im;if(!im)return;if(root.GameSpriteMetadata?.hammers){images.hammerArt=root.GameSpriteMetadata.hammers.map(f=>({im,...f}));return;}images.hammerArt=[];const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const q=c.getContext('2d');q.drawImage(im,0,0);const pixels=q.getImageData(0,0,im.width,im.height).data;
  for(let n=0;n<3;n++){const top=[0,370,695][n],bottom=[370,695,1024][n];let left=im.width,right=0;for(let x=im.width*.35|0;x<im.width;x++){let count=0;for(let y=top;y<Math.min(bottom,im.height);y++)if(pixels[(y*im.width+x)*4+3]>145)count++;if(count>100){left=Math.min(left,x);right=Math.max(right,x);}}if(right<=left){left=[650,970,1250][n];right=left+230;}let ballTop=bottom,ballBottom=top;for(let y=top;y<Math.min(bottom,im.height);y++)for(let x=left;x<=right;x++)if(pixels[(y*im.width+x)*4+3]>145){ballTop=Math.min(ballTop,y);ballBottom=Math.max(ballBottom,y);}images.hammerArt[n]={im,sx:20,sy:top,sw:right-20+18,sh:bottom-top,ballLeft:left,ballRight:right,ballY:(ballTop+ballBottom)/2,ballHeight:Math.max(1,ballBottom-ballTop+1)};}
  c.width=c.height=1;
 }
 function drawSuit(name,x,y,bodyHeight,alpha=1,reach=150){const f=images[name];if(!f)return false;const scale=bodyHeight/(f.bodyHeight||f.sh),bodyX=f.bodyX??f.sx+f.sw/2,bottom=f.bodyBottom??f.sy+f.sh,dx=x+(f.sx-bodyX)*scale,dy=y+bodyHeight/2+(f.sy-bottom)*scale;ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;
  if(name==='javelinArt1'||name==='javelinArt3'){const backward=name==='javelinArt3',cut=backward?bodyX-bodyHeight*.3:bodyX+bodyHeight*.45,clamped=Math.max(f.sx+1,Math.min(f.sx+f.sw-1,cut)),splitX=x+(clamped-bodyX)*scale;
   if(backward){ctx.drawImage(f.im,clamped,f.sy,f.sx+f.sw-clamped,f.sh,splitX,dy,(f.sx+f.sw-clamped)*scale,f.sh*scale);ctx.drawImage(f.im,f.sx,f.sy,clamped-f.sx,f.sh,x-reach,dy,splitX-(x-reach),f.sh*scale);}
   else{ctx.drawImage(f.im,f.sx,f.sy,clamped-f.sx,f.sh,dx,dy,(clamped-f.sx)*scale,f.sh*scale);ctx.drawImage(f.im,clamped,f.sy,f.sx+f.sw-clamped,f.sh,splitX,dy,x+reach-splitX,f.sh*scale);}
  }else ctx.drawImage(f.im,f.sx,f.sy,f.sw,f.sh,dx,dy,f.sw*scale,f.sh*scale);
  ctx.restore();return true;
 }
 function drawHammer(x,y,point,stage){const row=stage===0?0:stage>=3?2:1,f=images.hammerArt?.[row];if(!f)return false;const radius=Math.hypot(point.x-x,point.y-y),ballScale=26/f.ballHeight,center=(f.ballLeft+f.ballRight)/2,ballLeftX=radius+(f.ballLeft-center)*ballScale;ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(x,y);ctx.rotate(Math.atan2(point.y-y,point.x-x));ctx.drawImage(f.im,f.sx,f.sy,f.ballLeft-f.sx,f.sh,0,(f.sy-f.ballY)*ballScale,ballLeftX,f.sh*ballScale);ctx.drawImage(f.im,f.ballLeft,f.sy,f.ballRight-f.ballLeft+18,f.sh,ballLeftX,(f.sy-f.ballY)*ballScale,(f.ballRight-f.ballLeft+18)*ballScale,f.sh*ballScale);ctx.restore();return true;}
 return {annotateBody,annotateHammers,drawSuit,drawHammer};
};
})(window);
