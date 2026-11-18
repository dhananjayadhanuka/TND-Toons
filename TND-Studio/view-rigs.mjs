// Shared editor coordinates keep the approved Front controls stable. Each view
// supplies its own attachment points, proportions and approved head artwork.
export const RIG_VIEWS=['front','threeQuarter','side','back'];
export const VIEW_RIGS={
 front:{width:1,neckX:260,crop:[15,8,462,760],shoulders:[224,296],hips:[237,283],hands:[217,303],feet:[220,300],face:[145,250,230,205],eyes:[145,250,220,140]},
 threeQuarter:{width:.8,neckX:740,crop:[480,8,430,760],shoulders:[236,290],hips:[245,280],hands:[226,301],feet:[236,294],face:[620,245,240,210],eyes:[625,245,208,145]},
 side:{width:.54,neckX:1125,crop:[900,8,390,760],shoulders:[254,273],hips:[254,274],hands:[238,292],feet:[240,285],face:[1110,248,161,207],eyes:[1106,246,125,137]},
 back:{width:.95,neckX:1537,crop:[1290,8,465,760],shoulders:[225,295],hips:[238,282],hands:[216,304],feet:[220,300]}
};
export const rigView=view=>RIG_VIEWS.includes(view)?view:'front';
export const viewConfig=pose=>VIEW_RIGS[rigView(pose?.rigView)];
export function viewArms(pose){const c=viewConfig(pose);return c.shoulders.map((x,i)=>({shoulder:{x,y:488},from:{x:c.hands[i],y:570},side:i?-1:1}));}
export function viewLegs(pose){const c=viewConfig(pose);return c.hips.map((x,i)=>({hip:{x,y:605},from:{x:c.feet[i],y:rigView(pose?.rigView)==='front'?725:731},side:i?-1:1,name:i?'rightFoot':'leftFoot'}));}
export function makeViewHead(rig,pose){
 const view=rigView(pose.rigView),c=VIEW_RIGS[view],lib=rig.viewLibraries?.[view],base=lib?.closed;
 if(!base)return null;
 const key=JSON.stringify([view,pose.facePreset,pose.faceStrength,pose.eyeClose,pose.gazeX,pose.mouth]);
 rig.otherHeads??=new Map();if(rig.otherHeads.has(key))return rig.otherHeads.get(key);
 const canvas=document.createElement('canvas');canvas.width=rig.closed.width+160;canvas.height=rig.closed.height+40;canvas.rigOffset={x:-80,y:-20};const g=canvas.getContext('2d');g.translate(80,20);
 const patch=(sprite,region)=>{if(!sprite)return;const [x,y,w,h]=region,ox=c.crop[0]+(sprite.trimOffset?.[0]||0),oy=c.crop[1]+(sprite.trimOffset?.[1]||0);g.drawImage(sprite,x-ox,y-oy,w,h,x-c.neckX+260-rig.origin.x,y-rig.origin.y,w,h);};
 patch(base,[c.crop[0],c.crop[1],c.crop[2],470-c.crop[1]]);
 if(view!=='back'){
 const suffix={happy:'Smile',laugh:'Laugh',angry:'Angry'}[pose.facePreset],level=pose.faceStrength??1;
 if(pose.mouth==='open')patch(lib.open,c.face);
 if(suffix&&level>.01)patch(lib['closed'+suffix],level>=.66?c.face:c.eyes);
 if(Math.abs(pose.gazeX||0)>.35)patch(lib[pose.gazeX<0?'closedLookLeft':'closedLookRight'],c.eyes);
 if((pose.eyeClose||0)>=.5)patch(lib.closedBlink,c.eyes);
 }
 g.clearRect(241-rig.origin.x,455-rig.origin.y,46,23);
 // Bounded cache: sliders/keyframed heads must not retain every animation frame.
 if(rig.otherHeads.size>=40)rig.otherHeads.delete(rig.otherHeads.keys().next().value);
 rig.otherHeads.set(key,canvas);return canvas;
}
export function viewFoot(g,p,pose,side,outline=false){
 const view=rigView(pose.rigView),depth=side===1?pose.leftFootDepth:pose.rightFootDepth;
 if(view==='front'&&pose.walking)return false;
 g.save();g.translate(p.x,p.y+9);
 if(view==='side'){g.beginPath();g.moveTo(-12,-9);g.lineTo(8,-9);g.bezierCurveTo(17,-5,46,-8,48,5);g.bezierCurveTo(48,20,-8,19,-15,10);g.closePath();}
 else if(view==='threeQuarter'){g.scale(side===1?1:.86,1);g.beginPath();g.ellipse(10,6,32,14,-.12,0,Math.PI*2);}
 else {g.scale(1+(depth||0)*.08,1);g.beginPath();g.roundRect(-21,-8,42,28,10);}
 if(outline){g.strokeStyle='#090908';g.lineWidth=5.2;g.stroke();}g.fill();g.restore();return true;
}
