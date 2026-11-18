import {rigView,viewConfig,viewArms,viewLegs,makeViewHead,viewFoot} from './view-rigs.mjs';
const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
export function bellyState(progress){const p=Math.max(0,Math.min(1,progress));return {reach:smooth(.04,.28,p)*(1-smooth(.78,.98,p)),laugh:smooth(.22,.34,p)*(1-smooth(.74,.86,p))};}
export function solveArm(shoulder,hand,upper=58,lower=55,bend=1){
 const dx=hand.x-shoulder.x,dy=hand.y-shoulder.y,d=Math.max(.001,Math.min(Math.hypot(dx,dy),upper+lower-.001)),a=(upper*upper-lower*lower+d*d)/(2*d),h=Math.sqrt(Math.max(0,upper*upper-a*a));
 const length=Math.hypot(dx,dy)||1;return {x:shoulder.x+dx/length*a-dy/length*h*bend,y:shoulder.y+dy/length*a+dx/length*h*bend};
}
const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Belly rig asset unavailable'));i.src=src;});
const norm=img=>{const c=document.createElement('canvas');c.width=1774;c.height=887;c.getContext('2d').drawImage(img,0,0,1774,887);return c;};
export async function loadBellyRig(referenceSprite){
 const original=norm(await load('assets/turnarounds/dhanuka-views-closed-v6.png')),armless=norm(await load('assets/actions/belly-laugh/armless-base-v1.png')),laugh=norm(await load('assets/turnarounds/dhanuka-front-laugh-v1.png'));
 const c=document.createElement('canvas');c.width=1774;c.height=887;const g=c.getContext('2d');g.drawImage(original,0,0);g.drawImage(armless,150,468,225,155,150,468,225,155);
 const closed=referenceSprite(c,[15,8,462,760]);g.drawImage(laugh,145,250,230,220,145,250,230,220);const happy=referenceSprite(c,[15,8,462,760]);
 const frame=document.createElement('canvas');frame.width=closed.width;frame.height=closed.height;
 return {closed,happy,frame,origin:{x:15+(closed.trimOffset?.[0]||0),y:8+(closed.trimOffset?.[1]||0)}};
}
function limb(g,a,b){g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.strokeStyle='#090908';g.lineWidth=20;g.stroke();g.strokeStyle='#ffe09a';g.lineWidth=13;g.stroke();}
function joinedArm(g,a,cap='round'){
 // Outline the complete arm first, then fill the complete arm. Outlining
 // each bone separately leaves a black cap across the elbow.
 g.lineCap=cap;g.lineJoin='round';g.beginPath();g.moveTo(a.shoulder.x,a.shoulder.y);g.lineTo(a.elbow.x,a.elbow.y);g.lineTo(a.hand.x,a.hand.y);g.strokeStyle='#090908';g.lineWidth=20;g.stroke();g.strokeStyle='#ffe09a';g.lineWidth=13;g.stroke();
}
function handAngle(a){return Math.atan2(a.hand.y-a.elbow.y,a.hand.x-a.elbow.x)-Math.PI/2;}
function palm(g,p,side,reach,angle=side*(.25+reach*.35),color='#ffe09a'){
 g.save();g.translate(p.x,p.y);g.rotate(angle);g.scale(side,1);g.fillStyle=color;g.strokeStyle='#090908';g.lineWidth=4.8;g.lineCap='round';g.lineJoin='round';
 // Open at the wrist: the forearm enters the palm without a black cuff.
 g.beginPath();g.moveTo(-7,-10);g.bezierCurveTo(-10,-6,-11,-1,-13,0);g.bezierCurveTo(-20,-5,-24,1,-21,7);g.bezierCurveTo(-18,12,-13,9,-10,7);g.lineTo(-9,15);g.bezierCurveTo(-9,23,-5,25,-3,20);g.bezierCurveTo(-3,30,3,30,4,22);g.bezierCurveTo(5,29,11,27,11,19);g.bezierCurveTo(13,24,18,21,17,14);g.lineTo(14,2);g.bezierCurveTo(13,-4,9,-7,7,-10);g.fill();g.stroke();
 g.lineWidth=1.8;g.beginPath();g.moveTo(-10,7);g.quadraticCurveTo(-3,4,2,9);g.moveTo(-3,20);g.lineTo(-4,13);g.moveTo(4,22);g.lineTo(3,14);g.moveTo(11,19);g.lineTo(9,12);g.stroke();g.restore();
}
function featherRoot(g,point,pad,radius=35){const x=point.x+pad,y=point.y+pad,gradient=g.createRadialGradient(x,y,8,x,y,radius);gradient.addColorStop(0,'rgba(0,0,0,1)');gradient.addColorStop(.4,'rgba(0,0,0,1)');gradient.addColorStop(1,'rgba(0,0,0,0)');g.globalCompositeOperation='destination-out';g.fillStyle=gradient;g.fillRect(x-radius-1,y-radius-1,radius*2+2,radius*2+2);g.globalCompositeOperation='source-over';}

function handPath(from,to,reach,side){const middle={x:from.x+side*15,y:from.y-25},u=1-reach;return {x:u*u*from.x+2*u*reach*middle.x+reach*reach*to.x,y:u*u*from.y+2*u*reach*middle.y+reach*reach*to.y};}
export function bellyArms(progress){
 const reach=bellyState(progress).reach;
 return [{shoulder:{x:224,y:488},from:{x:217,y:570},to:{x:246,y:562},side:1},{shoulder:{x:296,y:488},from:{x:303,y:570},to:{x:274,y:562},side:-1}].map(a=>{const hand=handPath(a.from,a.to,reach,a.side);return {...a,hand,elbow:solveArm(a.shoulder,hand,70,65,a.side)};});
}
export function manualArms(pose){
 return (rigView(pose.rigView)==='front'?bellyArms(0):viewArms(pose)).map((a,i)=>{const side=i===0?'left':'right',dx=pose[side+'X']??0,dy=pose[side+'Y']??0;
 const requested={x:a.from.x+dx,y:a.from.y+dy};let vx=requested.x-a.shoulder.x,vy=requested.y-a.shoulder.y,d=Math.hypot(vx,vy);if(d<.001){vx=0;vy=1;d=1;}const r=Math.max(8,Math.min(135,d));
 const hand={x:a.shoulder.x+vx/d*r,y:a.shoulder.y+vy/d*r};
 if(pose.walking){const elbow={x:a.shoulder.x+(hand.x-a.shoulder.x)*.52+a.side*-3,y:a.shoulder.y+(hand.y-a.shoulder.y)*.56};return {...a,hand,elbow};}
 const elbow=r===135?{x:a.shoulder.x+(hand.x-a.shoulder.x)*70/135,y:a.shoulder.y+(hand.y-a.shoulder.y)*70/135}:solveArm(a.shoulder,hand,70,65,rigView(pose.rigView)==='side'?1:a.side);
 return {...a,hand,elbow};});
}
function frontFoot(g,p,depth=0){
 const scale=1+depth*.12;g.save();g.translate(p.x,p.y+8);g.scale(scale,scale);g.beginPath();g.moveTo(-12,-8);g.bezierCurveTo(-21,-5,-25,5,-21,12);g.bezierCurveTo(-17,20,17,20,21,12);g.bezierCurveTo(25,5,21,-5,12,-8);g.closePath();g.fill();g.restore();
}
export function manualLegs(pose){
 return viewLegs(pose).map(a=>{a={...a,hip:poseBodyPoint(a.hip,pose)};const requested={x:a.from.x+(pose[a.name+'X']||0),y:a.from.y+(pose[a.name+'Y']||0)};let dx=requested.x-a.hip.x,dy=requested.y-a.hip.y,d=Math.hypot(dx,dy);if(d<.001){dx=0;dy=1;d=1;}const r=Math.max(8,Math.min(126,d)),hand={x:a.hip.x+dx/d*r,y:a.hip.y+dy/d*r},knee=r===126?{x:(a.hip.x+hand.x)/2,y:(a.hip.y+hand.y)/2}:solveArm(a.hip,hand,63,63,rigView(pose.rigView)==='side'?-1:a.side);return {...a,hand,knee:pose.walking&&rigView(pose.rigView)!=='side'?{x:a.hip.x+(hand.x-a.hip.x)*.5+a.side*1.5,y:a.hip.y+(hand.y-a.hip.y)*.52}:knee};});
}
function drawManualLegs(g,rig,pose){
 g.save();g.translate(-rig.origin.x,-rig.origin.y);
 for(const a of manualLegs(pose)){g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(a.hip.x,a.hip.y);g.lineTo(a.knee.x,a.knee.y);g.lineTo(a.hand.x,a.hand.y);g.strokeStyle='#090908';g.lineWidth=29;g.stroke();g.strokeStyle='#ffe09a';g.lineWidth=20;g.stroke();
 // Keep the approved foot artwork; only the connecting leg is articulated.
 const sx=a.side===1?125:275,sy=713,sw=125,sh=46;g.drawImage(rig.closed,sx-rig.origin.x,sy-rig.origin.y,sw,sh,sx+a.hand.x-a.from.x,sy+a.hand.y-a.from.y,sw,sh);
 }g.restore();
}
const WAIST={x:260,y:605},NECK={x:260,y:474};
function rotatePoint(p,pivot,degrees){const r=degrees*Math.PI/180,c=Math.cos(r),s=Math.sin(r),x=p.x-pivot.x,y=p.y-pivot.y;return {x:pivot.x+x*c-y*s,y:pivot.y+x*s+y*c};}
export function poseBodyPoint(p,pose,inverse=false){return rotatePoint(p,WAIST,(pose.bodyLean||0)*(inverse?-1:1));}
export function poseHeadPoint(p,pose){return poseBodyPoint(rotatePoint(p,NECK,pose.headTilt||0),pose);}
function pivotCanvas(g,p,degrees){g.translate(p.x,p.y);g.rotate(degrees*Math.PI/180);g.translate(-p.x,-p.y);}
function drawBodySlice(g,rig,top,bottom){const sy=top-rig.origin.y;g.drawImage(rig.closed,0,sy,rig.closed.width,bottom-top,rig.origin.x,top,rig.closed.width,bottom-top);}
export function manualPoseControls(pose){
 return [...manualArms(pose).map((a,i)=>({side:i?'right':'left',point:poseBodyPoint(a.hand,pose),color:'#c5f277'})),...manualLegs(pose).map((a,i)=>({side:i?'rightFoot':'leftFoot',point:a.hand,color:'#80d9ff'})),{side:'headTilt',point:poseHeadPoint({x:260,y:250},pose),color:'#ffc36b'},{side:'bodyLean',point:poseBodyPoint({x:260,y:535},pose),color:'#d5a0ff'}];
}
export const FACE_PRESETS=[['neutral','Neutral'],['happy','Happy'],['laugh','Laugh'],['angry','Angry'],['sleepy','Sleepy']];
export function applyFacePreset(pose,id){
 if(!FACE_PRESETS.some(p=>p[0]===id))throw Error('Unknown face preset');
 return {...pose,facePreset:id,faceStrength:id==='neutral'?0:1,eyeClose:id==='sleepy'?1:0,gazeX:0};
}
function posedHead(rig,pose){if(rigView(pose.rigView)!=='front'){const head=makeViewHead(rig,pose);if(head)return head;}
 if(!rig.poseHead){rig.poseHead=document.createElement('canvas');rig.poseHead.width=rig.closed.width;rig.poseHead.height=rig.closed.height;const h=rig.poseHead.getContext('2d');h.drawImage(rig.closed,0,0);h.clearRect(0,470-rig.origin.y,rig.closed.width,rig.closed.height);h.clearRect(241-rig.origin.x,455-rig.origin.y,46,23);}
 const key=JSON.stringify([pose.facePreset,pose.faceStrength,pose.eyeClose,pose.gazeX,pose.mouth]);if(rig.headFaceKey===key)return rig.headFace;
 if(!rig.headFace){rig.headFace=document.createElement('canvas');rig.headFace.width=rig.closed.width;rig.headFace.height=rig.closed.height;}const g=rig.headFace.getContext('2d');g.clearRect(0,0,rig.headFace.width,rig.headFace.height);g.drawImage(rig.poseHead,0,0);
 const patch=(sprite,region,alpha)=>{if(!sprite||!alpha)return;const [x,y,w,h]=region,ox=15+(sprite.trimOffset?.[0]||0),oy=8+(sprite.trimOffset?.[1]||0);g.save();g.globalAlpha=alpha;g.drawImage(sprite,x-ox,y-oy,w,h,x-rig.origin.x,y-rig.origin.y,w,h);g.restore();};
 const suffix={happy:'Smile',laugh:'Laugh',angry:'Angry'}[pose.facePreset],lib=rig.faceLibrary;
 if(pose.mouth==='open')patch(lib?.open,[177,388,160,67],1);const strength=pose.faceStrength??1;if(suffix&&strength>.01)patch(lib?.['closed'+suffix],strength>=.66?[145,250,230,205]:[145,250,220,140],1);
 const gaze=pose.gazeX||0;if(Math.abs(gaze)>.35)patch(lib?.[gaze<0?'closedLookLeft':'closedLookRight'],[145,250,220,140],1);
 patch(lib?.closedBlink,[145,250,220,140],(pose.eyeClose||0)>=.5?1:0);
 rig.headFaceKey=key;return rig.headFace;
}
function paintConnectedBody(g,rig,pose){
 // Union the torso, neck and limb silhouettes before outlining them. Separate
 // outlined cutouts create black caps and transparent cracks at every joint.
 const size=1240,pad=240,view=rigView(pose.rigView),config=viewConfig(pose);
 if(!rig.bodyMask){rig.bodyMask=document.createElement('canvas');rig.bodyMask.width=rig.bodyMask.height=size;rig.bodySkin=document.createElement('canvas');rig.bodySkin.width=rig.bodySkin.height=size;}
 const m=rig.bodyMask.getContext('2d');m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,size,size);m.save();m.translate(pad,pad);
 // A cropped raster strip can leave a straight cut across the pelvis and
 // carry enclosed background pixels into the silhouette. Use a closed,
 // curved torso contour with both hip anchors inside it instead.
 m.save();pivotCanvas(m,WAIST,pose.bodyLean||0);m.translate(260,0);m.scale(config.width,1);m.translate(-260,0);m.fillStyle='#000';m.beginPath();m.moveTo(246,482);m.quadraticCurveTo(260,477,277,482);m.bezierCurveTo(285,485,298,490,306,519);m.bezierCurveTo(319,555,310,590,292,607);m.bezierCurveTo(279,621,244,626,227,611);m.bezierCurveTo(203,595,194,565,201,533);m.bezierCurveTo(207,500,225,489,246,482);m.closePath();m.fill();m.restore();
 // The neck tapers into the shoulders with curved sides. A round capsule
 // plus a fixed upright torso stump leaves a corner when the head tilts.
 const hl=poseHeadPoint({x:246,y:454},pose),hr=poseHeadPoint({x:274,y:454},pose),bl=poseBodyPoint({x:240,y:498},pose),br=poseBodyPoint({x:282,y:498},pose),hcl=poseHeadPoint({x:246,y:474},pose),hcr=poseHeadPoint({x:274,y:474},pose),bcl=poseBodyPoint({x:240,y:480},pose),bcr=poseBodyPoint({x:282,y:480},pose);
 m.beginPath();m.moveTo(hl.x,hl.y);m.lineTo(hr.x,hr.y);m.bezierCurveTo(hcr.x,hcr.y,bcr.x,bcr.y,br.x,br.y);m.lineTo(bl.x,bl.y);m.bezierCurveTo(bcl.x,bcl.y,hcl.x,hcl.y,hl.x,hl.y);m.closePath();m.fill();m.lineCap='round';m.lineJoin='round';m.strokeStyle='#000';
 m.save();pivotCanvas(m,WAIST,pose.bodyLean||0);m.lineWidth=16;m.beginPath();m.moveTo(config.shoulders[0],488);m.quadraticCurveTo(260,482,config.shoulders[1],488);m.stroke();m.restore();
 for(const [i,a] of manualLegs(pose).entries()){if(view==='side'&&i===0)continue;m.lineWidth=23;m.beginPath();m.moveTo(a.hip.x,a.hip.y);m.lineTo(a.knee.x,a.knee.y);m.lineTo(a.hand.x,a.hand.y);m.stroke();if(view!=='front'){viewFoot(m,a.hand,pose,a.side);}else if(pose.walking){frontFoot(m,a.hand,a.side===1?pose.leftFootDepth:pose.rightFootDepth);}else{const sx=a.side===1?125:275;m.drawImage(rig.closed,sx-rig.origin.x,713-rig.origin.y,125,46,sx+a.hand.x-a.from.x,713+a.hand.y-a.from.y,125,46);}}
 m.save();pivotCanvas(m,WAIST,pose.bodyLean||0);for(const [i,a] of manualArms(pose).entries()){if(view==='side'&&i===0)continue;m.lineWidth=15;m.beginPath();m.moveTo(a.shoulder.x,a.shoulder.y);m.lineTo(a.elbow.x,a.elbow.y);m.lineTo(a.hand.x,a.hand.y);m.stroke();}m.restore();m.restore();
 m.globalCompositeOperation='source-in';m.fillStyle='#090908';m.fillRect(0,0,size,size);m.globalCompositeOperation='source-over';
 const fill=rig.bodySkin.getContext('2d');fill.clearRect(0,0,size,size);fill.drawImage(rig.bodyMask,0,0);fill.globalCompositeOperation='source-in';fill.fillStyle='#ffe09a';fill.fillRect(0,0,size,size);fill.globalCompositeOperation='source-over';
 if(view==='side'){g.save();g.translate(-rig.origin.x,-rig.origin.y);const a=manualLegs(pose)[0];g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(a.hip.x,a.hip.y);g.lineTo(a.knee.x,a.knee.y);g.lineTo(a.hand.x,a.hand.y);g.strokeStyle='#090908';g.lineWidth=28;g.stroke();g.strokeStyle='#f1cc88';g.lineWidth=22;g.stroke();g.fillStyle='#f1cc88';viewFoot(g,a.hand,pose,a.side,true);g.restore();}if(view==='side'||pose.handsBehind){g.save();g.translate(-rig.origin.x,-rig.origin.y);pivotCanvas(g,WAIST,pose.bodyLean||0);for(const far of (pose.handsBehind?manualArms(pose):[manualArms(pose)[0]])){joinedArm(g,far);palm(g,far.hand,far.side,0,handAngle(far),view==='side'?'#f1cc88':'#ffe09a');}g.restore();}g.save();g.translate(-rig.origin.x-pad,-rig.origin.y-pad);for(let i=0;i<16;i++){const r=i*Math.PI/8;g.drawImage(rig.bodyMask,Math.cos(r)*2.6,Math.sin(r)*2.6);}g.drawImage(rig.bodySkin,0,0);g.restore();
 // Foreground legs retain their outline away from the hip, blending at roots.
 if(!rig.jointLayer){rig.jointLayer=document.createElement('canvas');rig.jointLayer.width=rig.jointLayer.height=size;}const joint=rig.jointLayer.getContext('2d');
 for(const [index,a] of manualLegs(pose).entries()){if(view==='side'&&index===0)continue;joint.clearRect(0,0,size,size);joint.save();joint.translate(pad,pad);joint.lineCap='round';joint.lineJoin='round';joint.beginPath();joint.moveTo(a.hip.x,a.hip.y);joint.lineTo(a.knee.x,a.knee.y);joint.lineTo(a.hand.x,a.hand.y);joint.strokeStyle='#090908';joint.lineWidth=28;joint.stroke();joint.strokeStyle='#ffe09a';joint.lineWidth=22;joint.stroke();joint.restore();featherRoot(joint,a.hip,pad,38);g.drawImage(rig.jointLayer,-rig.origin.x-pad,-rig.origin.y-pad);}
 // Face, hair and ears keep the approved drawing, joined by the neck above.
 g.save();g.translate(-rig.origin.x,-rig.origin.y);pivotCanvas(g,WAIST,pose.bodyLean||0);pivotCanvas(g,NECK,pose.headTilt||0);const head=posedHead(rig,pose);g.drawImage(head,rig.origin.x+(head.rigOffset?.x||0),rig.origin.y+(head.rigOffset?.y||0));g.restore();
 // Every visible foreground arm blends into the shared shoulder silhouette.
 for(const [index,a] of manualArms(pose).entries()){if(pose.handsBehind||(view==='side'&&index===0))continue;joint.clearRect(0,0,size,size);joint.save();joint.translate(pad,pad);pivotCanvas(joint,WAIST,pose.bodyLean||0);joinedArm(joint,a);joint.restore();featherRoot(joint,poseBodyPoint(a.shoulder,pose),pad,35);joint.save();joint.translate(pad,pad);pivotCanvas(joint,WAIST,pose.bodyLean||0);const depth=index===0?pose.leftHandDepth:pose.rightHandDepth,scale=pose.walking?1+(depth||0)*.13:1;joint.translate(a.hand.x,a.hand.y);joint.scale(scale,scale);palm(joint,{x:0,y:0},a.side,0,handAngle(a));joint.restore();g.drawImage(rig.jointLayer,-rig.origin.x-pad,-rig.origin.y-pad);}

}
function connectedBody(g,rig,pose){
 const key=JSON.stringify(pose),pad=240;
 if(!rig.connectedSprite){rig.connectedSprite=document.createElement('canvas');rig.connectedSprite.width=rig.connectedSprite.height=1240;}
 if(rig.connectedKey!==key){const c=rig.connectedSprite.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,1240,1240);c.save();c.translate(pad+rig.origin.x,pad+rig.origin.y);paintConnectedBody(c,rig,pose);c.restore();rig.connectedKey=key;}
 g.drawImage(rig.connectedSprite,-pad-rig.origin.x,-pad-rig.origin.y);
}
// Draw directly into the caller's stage: the original sprite bounds must never
// clip articulated limbs. Coordinates remain relative to the trimmed body.
export function drawManualPose(g,rig,pose){
 const legs=pose.leftFootX!==undefined;
 if(legs){connectedBody(g,rig,pose);return;}
 // Preserve old poses exactly; articulated torso/head use the same approved art.
 if(!pose.bodyLean&&!pose.headTilt){g.save();if(legs){g.beginPath();g.rect(0,0,rig.closed.width,614-rig.origin.y);g.clip();}g.drawImage(rig.closed,0,0);g.restore();}
 else {g.save();g.translate(-rig.origin.x,-rig.origin.y);pivotCanvas(g,WAIST,pose.bodyLean||0);drawBodySlice(g,rig,470,legs?614:rig.origin.y+rig.closed.height);g.save();pivotCanvas(g,NECK,pose.headTilt||0);drawBodySlice(g,rig,rig.origin.y,478);g.restore();g.restore();}
 // Front-view manual posing puts the entire limb in front of the torso,
 // including upper arms/thighs when a wrist/foot crosses the belly.
 if(legs)drawManualLegs(g,rig,pose);
 g.save();g.translate(-rig.origin.x,-rig.origin.y);
 pivotCanvas(g,WAIST,pose.bodyLean||0);
 for(const a of manualArms(pose)){joinedArm(g,a);palm(g,a.hand,a.side,0);}g.restore();
}
export function manualPoseBounds(rig,pose){
 let left=0,top=0,right=rig.closed.width,bottom=rig.closed.height;
 const include=(p,pad)=>{left=Math.min(left,p.x-rig.origin.x-pad);right=Math.max(right,p.x-rig.origin.x+pad);top=Math.min(top,p.y-rig.origin.y-pad);bottom=Math.max(bottom,p.y-rig.origin.y+pad);};
 for(const a of manualArms(pose))for(const p of [a.shoulder,a.elbow,a.hand])include(p,36);
 for(const a of manualArms(pose))for(const p of [a.shoulder,a.elbow,a.hand])include(poseBodyPoint(p,pose),36);
 const config=viewConfig(pose);if(rigView(pose.rigView)!=='front')for(const x of [config.crop[0]-config.neckX+260,config.crop[0]-config.neckX+260+config.crop[2]])for(const y of [8,470])include(poseHeadPoint({x,y},pose),0);
 // Conservative transformed artwork bounds include tilted hair and ears.
 for(const x of [rig.origin.x,rig.origin.x+rig.closed.width]){for(const y of [rig.origin.y,478])include(poseHeadPoint({x,y},pose),0);for(const y of [470,614])include(poseBodyPoint({x,y},pose),0);}
 if(pose.leftFootX!==undefined)for(const a of manualLegs(pose)){for(const p of [a.hip,a.knee,a.hand])include(p,16);if(pose.walking){include({x:a.hand.x-30,y:a.hand.y-5},0);include({x:a.hand.x+30,y:a.hand.y+30},0);continue;}if(rigView(pose.rigView)!=='front'){include({x:a.hand.x-32,y:a.hand.y-8},0);include({x:a.hand.x+52,y:a.hand.y+32},0);continue;}const sx=a.side===1?125:275;include({x:sx+a.hand.x-a.from.x,y:713+a.hand.y-a.from.y},0);include({x:sx+125+a.hand.x-a.from.x,y:759+a.hand.y-a.from.y},0);}
 return {left,top,right,bottom};
}
export function renderBellyFrame(rig,progress,elapsed){
 const state=bellyState(progress),g=rig.frame.getContext('2d');g.clearRect(0,0,rig.frame.width,rig.frame.height);
 const arms=bellyArms(progress);
 g.save();g.translate(-rig.origin.x,-rig.origin.y);for(const a of arms)limb(g,a.shoulder,a.elbow);g.restore();
 g.drawImage(rig.closed,0,0);g.globalAlpha=state.laugh;g.drawImage(rig.happy,0,0);g.globalAlpha=1;
 g.save();g.translate(-rig.origin.x,-rig.origin.y);for(const a of arms){limb(g,a.elbow,a.hand);palm(g,a.hand,a.side,state.reach,handAngle(a));}g.restore();return {sprite:rig.frame,state,elapsed};
}
export function drawBellyFrame(g,frame,x,y,w,h){
 const sprite=frame.sprite,waist=Math.floor(sprite.height*.74),bands=96;
 const displacement=f=>{const t=Math.max(0,Math.min(1,(.74-f)/.3)),weight=t*t*(3-2*t),breath=Math.sin(frame.elapsed*10.7)+.2*Math.sin(frame.elapsed*17.3);return {x:h*.0014*breath*frame.state.laugh*weight,y:h*(.017+.002*breath)*frame.state.laugh*weight};};
 for(let i=0;i<bands;i++){const sy=waist*i/bands,sh=waist/bands,a=displacement(sy/sprite.height),b=displacement((sy+sh)/sprite.height),dy=sy/sprite.height*h;g.drawImage(sprite,0,sy,sprite.width,sh,x+a.x,y+dy+a.y,w,sh/sprite.height*h+b.y-a.y);}
 const lower=waist/sprite.height*h;g.drawImage(sprite,0,waist,sprite.width,sprite.height-waist,x,y+lower,w,h-lower);
}
