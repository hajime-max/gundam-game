/* Prevent browser page panning over gameplay without changing flight input. */
(function(root){'use strict';root.installGameTouchScrollGuard=function({document:doc,isActive}){
 function blocks(target){if(!isActive()||!target?.closest||!target.closest('.game-frame'))return false;if(target.closest('#title-menu,#developer-menu,#custom-panel,#intermission,[role="dialog"]'))return false;const control=target.closest('button,input,select,textarea,a');return !control||control.matches('[data-key]');}
 function stopPan(event){if(blocks(event.target)&&event.cancelable!==false)event.preventDefault();}
 doc.addEventListener('touchstart',stopPan,{capture:true,passive:false});doc.addEventListener('touchmove',stopPan,{capture:true,passive:false});return {blocks};
};})(window);
