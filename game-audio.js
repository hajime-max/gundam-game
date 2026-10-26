(function(root){
'use strict';
let shared=null;const buffers=new Map();
function context(){if(!shared){const C=root.AudioContext||root.webkitAudioContext;if(!C)return null;shared=new C();}return shared;}
function decode(src){if(buffers.has(src))return buffers.get(src);const promise=(async()=>{const c=context(),response=await fetch(src);if(!response.ok)throw Error('Audio HTTP '+response.status);const bytes=await response.arrayBuffer();return await new Promise((resolve,reject)=>{const result=c.decodeAudioData(bytes,resolve,reject);result?.then?.(resolve,reject);});})();buffers.set(src,promise);promise.catch(()=>buffers.delete(src));return promise;}
class BufferedAudio{
 constructor(src=''){this.src=src;this.preload='none';this.error=null;this.ended=false;this._buffer=null;this._source=null;this._gain=null;this._offset=0;this._start=0;this._token=0;this._pending=null;this._volume=1;this._muted=false;this._loop=false;this._events=new Map();}
 addEventListener(name,fn,options){const list=this._events.get(name)||[];list.push({fn,once:!!options?.once});this._events.set(name,list);}
 removeEventListener(name,fn){this._events.set(name,(this._events.get(name)||[]).filter(e=>e.fn!==fn));}
 _emit(name){for(const e of [...(this._events.get(name)||[])]){if(e.once)this.removeEventListener(name,e.fn);e.fn.call(this,{type:name,target:this});}}
 get duration(){return this._buffer?.duration??NaN;}get paused(){return !this._source;}
 get currentTime(){const t=this._offset+(this._source?Math.max(0,context().currentTime-this._start):0);return this._buffer?(this._loop?t%this.duration:Math.min(t,this.duration)):t;}
 set currentTime(value){if(!Number.isFinite(+value)||+value<0)return;const wasPlaying=!this.paused;this.pause();this._offset=this._buffer?Math.min(+value,this.duration):+value;this.ended=false;if(wasPlaying)this.play().catch(()=>{});}
 get volume(){return this._volume;}set volume(value){this._volume=Math.max(0,Math.min(1,+value||0));this._mix();}
 get muted(){return this._muted;}set muted(value){this._muted=!!value;this._mix();}
 get loop(){return this._loop;}set loop(value){this._loop=!!value;if(this._source)this._source.loop=this._loop;}
 _mix(){if(this._gain)this._gain.gain.value=this._muted?0:this._volume;}
 load(){const src=this.src;decode(src).then(b=>{if(this.src===src){this._buffer=b;this.error=null;}}).catch(e=>{this.error=e;});}
 play(){if(this._source)return Promise.resolve();if(this._pending)return this._pending;const token=++this._token,src=this.src;this.error=null;this.ended=false;const task=(async()=>{try{const c=context();await c.resume();const b=await decode(src);if(this._token!==token||this.src!==src)return;if(c.state==='suspended')throw Object.assign(Error('Audio context suspended'),{name:'NotAllowedError'});this._buffer=b;if(this._offset>=b.duration)this._offset=0;const source=c.createBufferSource(),gain=c.createGain();source.buffer=b;source.loop=this._loop;source.connect(gain);gain.connect(c.destination);this._source=source;this._gain=gain;this._start=c.currentTime;this._mix();source.onended=()=>{if(this._source!==source)return;this._source=null;this._gain=null;this._offset=b.duration;this.ended=true;source.disconnect();gain.disconnect();this._emit('ended');};source.start(0,this._offset);}catch(e){if(this._token===token){this.error=e;this._emit('error');}throw e;}})();this._pending=task;task.then(()=>{if(this._pending===task)this._pending=null;},()=>{if(this._pending===task)this._pending=null;});return task;}
 pause(){const offset=this.currentTime;this._token++;this._pending=null;if(this._source){const source=this._source,gain=this._gain;this._source=null;this._gain=null;source.onended=null;try{source.stop();}catch{}source.disconnect();gain?.disconnect();}this._offset=offset;}
}
root.GameSound={context,unlock(){const c=context();return c?c.resume():Promise.resolve();},create(src){return root.AudioContext||root.webkitAudioContext?new BufferedAudio(src):new root.Audio(src);}};
})(window);
