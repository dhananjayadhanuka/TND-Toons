import {validateAppearance} from './character-appearance.mjs';
import {validateWeather} from './weather.mjs';
import {validateDrawingGroups} from './drawing-animation.mjs';
import {validateDrawings} from './drawings.mjs';
import {actionEnvelope} from './actions.mjs';
export const CHARACTERS=[
 {id:'thilini',name:'Thilini',color:'#ae81d6',height:1,crop:[12,10,566,890],description:'Eldest sister · playful and mischievous'},
 {id:'nurashi',name:'Nurashi',color:'#f789b1',height:.82,crop:[578,158,463,741],description:'Younger sister · lovely and mischievous'},
 {id:'dhanuka',name:'Dhanuka',color:'#f3bd55',height:.81,crop:[1044,170,483,730],description:'Brother · the most mischievous'}
];
export const EXPRESSIONS=[['original','Original'],['happy','Happy'],['sad','Sad'],['surprised','Surprised'],['angry','Angry'],['scared','Scared'],['crying','Crying']];
export const MOTIONS=[['idle','Still'],['walk','Walk · draft'],['bounce','Bounce'],['sway','Sway'],['shake','Shake'],['hop','Hop'],['fall','Fall'],['blink','Blink · draft'],['laugh','Laugh · draft'],['bellyLaugh','Belly laugh · draft'],['smile','Smile'],['angry','Angry · draft'],['lookLeft','Look left · draft'],['lookRight','Look right · draft']];
export function uid(){return globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2);}
export function freshProject(){return {version:1,title:'My first TND story',duration:10,format:'landscape',background:'meadow',customBackground:null,narration:null,cast:[],approvals:{}};}
export function createActor(charId,index=0){return {id:uid(),charId,keys:[{time:0,x:25+index*25,y:85,scale:1,rotation:0,flip:false,opacity:1,expression:'original',outfit:'original'}],clips:[]};}
export function sampleActor(actor,time){
 time=Math.round(time*1e6)/1e6;
 const keys=[...actor.keys].sort((a,b)=>a.time-b.time);let a=keys[0],b=a;
 for(let i=0;i<keys.length;i++){if(keys[i].time<=time)a=keys[i];else{b=keys[i];break;}b=a;}
 const f=actor.manualAnimation&&actor.poseInterpolation==='hold'?0:b.time>a.time?Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time))):0;
 const out={view:'reference',mouth:'closed',...a};for(const k of ['x','y','scale','rotation','opacity'])out[k]=a[k]+(b[k]-a[k])*f;
 if(a.armPose){out.armPose={...a.armPose};if(b.armPose)for(const k of ['leftX','leftY','rightX','rightY','leftFootX','leftFootY','rightFootX','rightFootY','headTilt','bodyLean','faceStrength','eyeClose','gazeX'])if(a.armPose[k]!==undefined||b.armPose[k]!==undefined)out.armPose[k]=(a.armPose[k]||0)+((b.armPose[k]||0)-(a.armPose[k]||0))*f;}
 return out;
}
export function putKey(actor,time,patch){
 time=Math.round(time*1e6)/1e6;const base=sampleActor(actor,time);const key={...base,...patch,time};
 const i=actor.keys.findIndex(k=>Math.abs(k.time-time)<.005);if(i>=0)actor.keys[i]=key;else actor.keys.push(key);
 actor.keys.sort((a,b)=>a.time-b.time);return key;
}
export function motionAt(actor,time){
 if(actor.manualAnimation)return {dx:0,dy:0,angle:0};
 const clip=[...actor.clips].reverse().find(c=>time>=c.start&&time<c.start+c.duration);
 if(!clip)return {dx:0,dy:0,angle:0};const p=(time-clip.start)/clip.duration,phase=(time-clip.start)*Math.PI*4;
 switch(clip.type){
 case 'laugh':return {dx:0,dy:0,angle:0};
 case 'bounce':return {dx:0,dy:-Math.abs(Math.sin(phase))*.035,angle:0};
 case 'sway':return {dx:0,dy:0,angle:Math.sin(phase)*6};
 case 'shake':return {dx:Math.sin(phase*4)*.008,dy:0,angle:Math.sin(phase*2)*2};
 case 'hop':return {dx:0,dy:-Math.sin(p*Math.PI)*.13,angle:Math.sin(p*Math.PI)*-7};
 case 'fall':return {dx:0,dy:0,angle:Math.min(1,p*2)*80};
 default:return {dx:0,dy:0,angle:0};}
}
export function validateProject(p){
 if(!p||p.version!==1||!Array.isArray(p.cast)||p.cast.length>50)throw Error('This is not a supported TND project.');
 if(typeof p.title!=='string'||!Number.isFinite(p.duration)||p.duration<1||p.duration>180)throw Error('Invalid title or duration (1–180 seconds).');
 validateWeather(p.weather);if(p.backgroundLibraryId!==undefined&&(typeof p.backgroundLibraryId!=='string'||!/^[-a-z0-9]{1,100}$/.test(p.backgroundLibraryId)))throw Error('Invalid background library reference');if(!['landscape','portrait','square'].includes(p.format)||!['meadow','studio','sunset','night','custom'].includes(p.background))throw Error('Invalid stage settings.');
 if(p.customBackground!=null&&(!/^data:image\/(png|jpeg|webp);base64,/.test(p.customBackground)||p.customBackground.length>16000000))throw Error('Invalid background image.');
 if(p.narration!=null&&(!/^data:audio\/[a-z0-9.+-]+;base64,/i.test(p.narration.data)||p.narration.data.length>45000000||typeof p.narration.name!=='string'))throw Error('Invalid narration.');
 if(p.frameRegion!==undefined){const r=p.frameRegion;if(!r||['x','y','width','height'].some(k=>!Number.isFinite(r[k]))||r.width<=0||r.height<=0||r.x<-.00001||r.y<-.00001||r.x+r.width>1.00001||r.y+r.height>1.00001)throw Error('Invalid frame region');}if(p.previewLoop!==undefined&&typeof p.previewLoop!=='boolean')throw Error('Invalid preview loop');const ids=new Set(),chars=new Set();
 for(const a of p.cast){
 if(!a||typeof a.id!=='string'||ids.has(a.id)||!CHARACTERS.some(c=>c.id===a.charId)||!Array.isArray(a.keys)||!a.keys.length||a.keys.length>10000||!Array.isArray(a.clips)||a.clips.length>10000)throw Error('Invalid character track.');
 validateAppearance(a.appearance);ids.add(a.id);chars.add(a.charId);if(a.editorControls!==undefined&&(!Array.isArray(a.editorControls)||a.editorControls.length>40||a.editorControls.some(c=>!c||typeof c.id!=='string'||!['move','rotate','scale','left','right','leftFoot','rightFoot','headTilt','bodyLean'].includes(c.kind)||!Number.isFinite(c.x)||!Number.isFinite(c.y)||Math.abs(c.x)>5||Math.abs(c.y)>5)))throw Error('Invalid custom character controls');
 if(a.manualAnimation!==undefined&&typeof a.manualAnimation!=='boolean')throw Error('Invalid manual animation mode');if(a.poseInterpolation!==undefined&&!['hold','smooth'].includes(a.poseInterpolation))throw Error('Invalid pose interpolation');if(a.manualFps!==undefined&&![12,24,30].includes(a.manualFps))throw Error('Invalid manual frame rate');
 for(const k of a.keys){for(const field of ['time','x','y','scale','rotation','opacity'])if(!Number.isFinite(k[field]))throw Error('Invalid keyframe.');
 if(k.armPose!==undefined&&k.armPose!==null){if(typeof k.armPose!=='object'||Array.isArray(k.armPose)||['leftX','leftY','rightX','rightY'].some(f=>!Number.isFinite(k.armPose[f])||Math.abs(k.armPose[f])>300))throw Error('Invalid arm pose');for(const field of ['leftFootX','leftFootY','rightFootX','rightFootY'])if(k.armPose[field]!==undefined&&(!Number.isFinite(k.armPose[field])||Math.abs(k.armPose[field])>200))throw Error('Invalid foot pose');for(const field of ['headTilt','bodyLean'])if(k.armPose[field]!==undefined&&(!Number.isFinite(k.armPose[field])||Math.abs(k.armPose[field])>35))throw Error('Invalid body pose');if(k.armPose.facePreset!==undefined&&!['neutral','happy','laugh','angry','sleepy'].includes(k.armPose.facePreset))throw Error('Invalid face preset');for(const field of ['faceStrength','eyeClose','gazeX'])if(k.armPose[field]!==undefined&&(!Number.isFinite(k.armPose[field])||k.armPose[field]<(field==='gazeX'?-1:0)||k.armPose[field]>1))throw Error('Invalid face control');}
 if(k.view!==undefined&&!['reference','front','threeQuarter','side','back'].includes(k.view))throw Error('Invalid view');if(k.mouth!==undefined&&!['closed','open'].includes(k.mouth))throw Error('Invalid mouth');
 if(k.time<0||k.time>180||k.x< -100||k.x>200||k.y< -100||k.y>200||k.scale<.000001||k.scale>3||Math.abs(k.rotation)>360||k.opacity<0||k.opacity>1||typeof k.flip!=='boolean'||!EXPRESSIONS.some(e=>e[0]===k.expression)||k.outfit!=='original')throw Error('Invalid keyframe values.');}
 if(!a.keys.some(k=>k.time===0))throw Error('Each character needs a starting keyframe.');
 for(const c of a.clips)if((c.walkSpeed!==undefined&&(!Number.isFinite(c.walkSpeed)||c.walkSpeed<.25||c.walkSpeed>3))||(c.walkVariant!==undefined&&!['far','near','inPlace','forward'].includes(c.walkVariant))||(c.approach!==undefined&&typeof c.approach!=='boolean')||(c.loop!==undefined&&typeof c.loop!=='boolean')||!MOTIONS.some(m=>m[0]===c.type)||!Number.isFinite(c.start)||!Number.isFinite(c.duration)||c.start<0||c.start>180||c.duration<=0||c.duration>180)throw Error('Invalid motion clip.');
 }
 validateDrawings(p.drawings);validateDrawingGroups(p.drawingGroups,p.drawings||[],p.duration);if(!p.approvals||typeof p.approvals!=='object'||Array.isArray(p.approvals))throw Error('Invalid artwork approvals.');
 return p;
}



