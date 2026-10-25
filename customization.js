/* v140: economy and explicit purchases, independent of flight controls. */
(function(root){
'use strict';
const order=['speed','spread','bazooka','rifle','hammer','javelin','option','barrier','evolve'];
const labels={speed:'SPEED',spread:'拡散バルカン',bazooka:'バズーカ',rifle:'ビームライフル',hammer:'ハンマー',javelin:'ジャベリン',option:'OPTION',barrier:'バリア',evolve:'進化'};
const defs={
 hp:{name:'最大HP',cost:[3,5,8],effect:'1段階につき最大HP＋10（コスト・上限は仮）'},
 vulcanMix:{name:'バルカン併用解放',cost:[8],effect:'バズーカ・ビームとバルカンを併用'},
 spread:{name:'拡散弾数',cost:[5,8],effect:'3方向 → 5方向 → 7方向'},
 bazookaRapid:{name:'バズーカ連射／2丁持ち',cost:[8],effect:'発射間隔0.7 → 0.35秒（数値・コスト仮）'},
 riflePower:{name:'ライフル威力',cost:[4,7,10],effect:'1段階につき＋20％（効果量仮）'},
 rifleWidth:{name:'ライフルの太さ',cost:[3,5,8],effect:'1段階につき＋4px（仮）'},
 hammerLength:{name:'ハンマー長さ解放',cost:[3,5,8],effect:'半径60／85／110／135pxから選択（仮）'},
 hammerSpeed:{name:'ハンマー回転速度',cost:[4,7,10],effect:'毎秒2.5／3.25／4／4.75radから選択（仮）'},
 hammerPower:{name:'ハンマー威力',cost:[4,7,10],effect:'威力1／1.5／2／2.5から選択（仮）'},
 hammerErase:{name:'ハンマー敵弾消去',cost:[8,12,18],effect:'通常弾 → ミサイルも → レーザーも'},
 javelinLength:{name:'ジャベリン長さ',cost:[3,5,8],effect:'射程150＋1段階35px（仮）'},
 javelinPower:{name:'ジャベリン威力',cost:[4,7,10],effect:'威力3＋1段階1（仮）'},
 javelinRate:{name:'ジャベリン攻撃間隔',cost:[4,7,10],effect:'0.9秒から1段階0.12秒短縮（仮）'},
 gmPower:{name:'ジム系射撃威力',cost:[4,7,10],effect:'進化後も継承。1段階＋20％（仮）'},
 ballPower:{name:'ボール系砲撃威力',cost:[4,7,10],effect:'進化後も継承。1段階＋20％（仮）'},
 ballBlast:{name:'ボール系爆風',cost:[3,5,8],effect:'進化後も継承。1段階＋15px（仮）'},
 gmMelee:{name:'ジム近接支援',cost:[8],effect:'ジムのみ自動サーベル。ガンキャノンには適用なし'}
};
// v157 trial: upgrades cost three times v156; repair remains 1pt per HP.
for(const d of Object.values(defs))d.cost=d.cost.map(n=>n*6);
function create(storage){
 const key='colony-customization-v1';let saved={version:1,bank:0,levels:{},order:[...order]},temporary={},temporaryOrder=null,settings={},pending=0,settled=false,saveError='';
 const validOrder=x=>Array.isArray(x)&&x.length===order.length&&new Set(x).size===order.length&&x.every(k=>order.includes(k));
 try{const s=JSON.parse(storage.getItem(key));if(s?.version===1){saved.bank=Number.isSafeInteger(s.bank)&&s.bank>=0?s.bank:0;for(const [k,d]of Object.entries(defs))saved.levels[k]=Number.isInteger(s.levels?.[k])?Math.max(0,Math.min(d.cost.length,s.levels[k])):0;if(validOrder(s.order))saved.order=s.order;}}catch{}
 const persist=()=>{try{storage.setItem(key,JSON.stringify(saved));saveError='';return true;}catch{saveError='保存できません。ブラウザの保存許可を確認してください。';return false;}};
 const level=k=>Math.max(saved.levels[k]||0,temporary[k]||0);
 return {defs,labels,defaultOrder:order,level,selected(k){return Math.min(settings[k]??level(k),level(k));},select(k,n){if(!defs[k]||!Number.isInteger(n)||n<0||n>level(k))return false;settings[k]=n;return true;},
 get bank(){return saved.bank;},get pending(){return pending;},get saveError(){return saveError;},get order(){return [...(temporaryOrder||saved.order)];},get settled(){return settled;},
 info(k,mode){const n=mode==='permanent'?(saved.levels[k]||0):level(k),d=defs[k];return {level:n,effective:level(k),max:d.cost.length,cost:n<d.cost.length?d.cost[n]*(mode==='permanent'?3:1):null};},
 collect(n){if(!settled&&Number.isSafeInteger(n)&&n>0)pending+=n;},
 clear(){if(settled)return 0;const n=pending;saved.bank+=n;pending=0;settled=true;persist();return n;},
 startStage(){pending=0;settled=false;},
 resetRun(){temporary={};temporaryOrder=null;settings={};pending=0;settled=false;},
 fail(){temporary={};temporaryOrder=null;settings={};pending=0;settled=false;},
 buy(k,mode,confirmed=false){if(!settled||!defs[k]||!['run','permanent'].includes(mode))return false;if(mode==='permanent'&&!confirmed)return false;const item=this.info(k,mode);if(item.cost===null||saved.bank<item.cost)return false;const before=JSON.stringify(saved);saved.bank-=item.cost;if(mode==='permanent')saved.levels[k]=item.level+1;else temporary[k]=item.level+1;if(!persist()){saved=JSON.parse(before);if(mode==='run')temporary[k]=item.level;return false;}return true;},
 spend(points){if(!settled||!Number.isSafeInteger(points)||points<1||saved.bank<points)return false;saved.bank-=points;if(!persist()){saved.bank+=points;return false;}return true;},
 repair(points=1){return this.spend(points);},
 reorder(next,mode,confirmed=false){if(!settled||!validOrder(next)||!['run','permanent'].includes(mode)||mode==='permanent'&&!confirmed)return false;const base=mode==='permanent'?saved.order:this.order;if(next.every((k,i)=>k===base[i]))return true;const cost=mode==='permanent'?12:4;if(saved.bank<cost)return false;const before=JSON.stringify(saved);saved.bank-=cost;if(mode==='permanent')saved.order=[...next];if(!persist()){saved=JSON.parse(before);return false;}if(mode==='run')temporaryOrder=[...next];return true;},
 snapshot(){return {bank:saved.bank,pending,permanent:{...saved.levels},temporary:{...temporary},order:this.order,settled};}
 };
}
root.createCustomization=create;if(typeof module!=='undefined')module.exports={create,defs,order,labels};
})(typeof window==='undefined'?globalThis:window);
