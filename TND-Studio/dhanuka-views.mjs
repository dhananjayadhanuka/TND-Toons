export const VIEWS=[['reference','Original ¾'],['front','Front'],['threeQuarter','¾ turnaround'],['side','Side'],['back','Back']];
export const VIEW_CROPS={front:[15,8,462,760],threeQuarter:[480,8,430,760],side:[900,8,390,760],back:[1290,8,465,760]};
const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Missing view artwork: '+src));i.src=src;});
function normalized(img){const c=document.createElement('canvas');c.width=1774;c.height=887;c.getContext('2d').drawImage(img,0,0,1774,887);return c;}
export async function loadDhanukaViews(referenceSprite){
 const closed=normalized(await load('assets/turnarounds/dhanuka-views-closed-v6.png'));
 const open=normalized(await load('assets/turnarounds/dhanuka-views-v4.png'));
 const eye=normalized(await load('assets/turnarounds/dhanuka-side-blink-v1.png'));
 const result={};for(const [view,crop]of Object.entries(VIEW_CROPS))result[view]={closed:referenceSprite(closed,crop)};
 result.side.open=referenceSprite(open,VIEW_CROPS.side);
 for(const mouth of ['closed','open']){
 const base=mouth==='closed'?closed:open,c=document.createElement('canvas');c.width=1774;c.height=887;const g=c.getContext('2d');g.drawImage(base,0,0);
 // The new blink uses only the side eye region; approved tooth/mouth stay original.
 g.drawImage(eye,1106,246,125,137,1106,246,125,137);
 result.side[mouth+'Blink']=referenceSprite(c,VIEW_CROPS.side);
 }
 try{
 const laugh=normalized(await load('assets/turnarounds/dhanuka-side-laugh-v1.png'));
 for(const mouth of ['closed','open']){
 const c=document.createElement('canvas');c.width=1774;c.height=887;const g=c.getContext('2d');g.drawImage(mouth==='closed'?closed:open,0,0);
 // Limit the draft expression to face; preserve approved hair, ears and body.
 g.drawImage(laugh,1110,248,161,228,1110,248,161,228);
 result.side[mouth+'Laugh']=referenceSprite(c,VIEW_CROPS.side);
 }
 }catch{/* Existing views remain usable when the optional laugh asset is missing. */}
 const regions={front:{eye:[145,250,220,140],mouth:[177,388,160,70],face:[145,250,230,220]},threeQuarter:{eye:[625,245,208,145],mouth:[694,383,129,76],face:[620,245,240,225]}};
 const patch=(base,source,region)=>{const c=document.createElement('canvas');c.width=1774;c.height=887;const g=c.getContext('2d');g.drawImage(base,0,0);g.drawImage(source,...region,...region);return c;};
 let frontOpen,frontBlink,frontLaugh;
 try{frontOpen=normalized(await load('assets/turnarounds/dhanuka-front-open-v1.png'));}catch{}
 try{frontBlink=normalized(await load('assets/turnarounds/dhanuka-front-blink-v1.png'));}catch{}
 try{frontLaugh=normalized(await load('assets/turnarounds/dhanuka-front-laugh-v1.png'));}catch{}
 for(const [view,region]of Object.entries(regions)){
 const openBase=frontOpen?patch(closed,frontOpen,region.mouth):null;
 if(openBase)result[view].open=referenceSprite(openBase,VIEW_CROPS[view]);
 for(const mouth of ['closed','open']){
 const base=mouth==='open'?openBase:closed;if(!base)continue;
 if(frontBlink)result[view][mouth+'Blink']=referenceSprite(patch(base,frontBlink,region.eye),VIEW_CROPS[view]);
 if(frontLaugh)result[view][mouth+'Laugh']=referenceSprite(patch(base,frontLaugh,region.face),VIEW_CROPS[view]);
 }
 }
 for(const view of ['front','threeQuarter','side'])for(const mouth of ['closed','open'])if(result[view][mouth])result[view][mouth+'Smile']=result[view].closed;
 for(const [type,suffix]of [['angry','Angry'],['lookLeft','LookLeft'],['lookRight','LookRight']]){
 try{const pose=normalized(await load('assets/turnarounds/dhanuka-'+type+'-v1.png'));
 for(const view of ['front','threeQuarter','side'])for(const mouth of ['closed','open']){
 let base=closed;if(mouth==='open'){if(view==='side')base=open;else if(frontOpen)base=patch(closed,frontOpen,regions[view].mouth);else continue;}
 const region=view==='side'?(type==='angry'?[1110,248,161,228]:[1106,246,125,137]):regions[view][type==='angry'?'face':'eye'];
 result[view][mouth+suffix]=referenceSprite(patch(base,pose,region),VIEW_CROPS[view]);
 }
 }catch{/* Optional action poses do not disable approved views. */}
 }
 return result;
}
