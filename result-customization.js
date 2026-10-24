/* Shared result/customization presentation. Re-renders never restart counters. */
(function(root){
'use strict';
root.createResultCustomizationUI=function({panel,counterSound}){
 const counters={};let sounding=false;
 const format=n=>Math.max(0,Math.round(n)).toLocaleString('ja-JP');
 const value=k=>counters[k]?.value||0;
 function target(k,to,from=value(k),duration=1.5){if(counters[k]?.to===to)return;counters[k]={from,to,value:from,age:0,duration};}
 function start({score,bank,earned}){for(const k of Object.keys(counters))delete counters[k];target('score',score,0,2.3);target('earned',earned,0,1.8);target('bank',bank,bank-earned,1.8);}
 function update(dt,active){let counting=false;if(active)for(const [key,c]of Object.entries(counters)){c.age=Math.min(c.duration,c.age+dt);const t=c.duration?c.age/c.duration:1;c.value=c.from+(c.to-c.from)*(1-Math.pow(1-t,3));if(t<1&&c.from!==c.to)counting=true;const el=panel.querySelector?.('[data-result-count="'+key+'"]');if(el)el.textContent=format(c.value);}if(counting!==sounding){sounding=counting;counterSound(counting);}}
 function summary({stage,title,score,bonus,elapsed,record,hp,maxHp,lives=0,bank,earned,actions=''}){target('bank',bank,value('bank'),.55);return '<aside class="result-summary"><div class="result-kicker">E.F.S.F. / MISSION REPORT</div><div class="result-stage">STAGE '+String(stage).padStart(2,'0')+' <em>CLEAR</em></div><p class="result-subtitle">'+title+'</p><div class="result-portrait"><img src="assets/result-gundam.webp?v=144" alt="RX-78-2 ガンダム"><span>RX-78-2<br><b>GUNDAM</b></span></div><div class="result-numbers"><div class="result-score"><small>TOTAL SCORE</small><strong data-result-count="score">'+format(value('score'))+'</strong>'+(record?'<span class="result-record">NEW RECORD</span>':'')+'</div><dl class="result-details"><div><dt>撃破スコア</dt><dd>'+format(Math.max(0,score-bonus))+'</dd></div><div><dt>クリアボーナス</dt><dd>'+format(bonus)+'</dd></div><div><dt>クリアタイム</dt><dd>'+elapsed+'</dd></div></dl><div class="result-materials"><div><small>今回獲得</small><b>＋<span data-result-count="earned">'+format(value('earned'))+'</span><i> pt</i></b></div><div><small>所持素材</small><b><span data-result-count="bank">'+format(value('bank'))+'</span><i> pt</i></b></div></div><div class="result-hp"><span>機体HP</span><meter min="0" max="'+maxHp+'" value="'+hp+'"></meter><b>'+Math.ceil(hp)+' / '+maxHp+'</b></div><div class="result-lives"><span>残機</span><b>× '+lives+'</b></div>'+actions+'</div></aside>';}
 return {start,update,summary,value};
};
})(window);
