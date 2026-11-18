import {sampleActor,putKey} from './core.mjs';
export const frameTime=(frame,fps=24)=>Math.round((Math.max(1,Math.round(frame))-1)/fps*1e6)/1e6;
export const frameNumber=(time,fps=24)=>Math.round(time*fps)+1;
export function enableManual(actor){actor.manualAnimation=true;actor.manualFps??=24;actor.poseInterpolation??='hold';}
export function copyManualPose(actor,time){const {time:ignored,...pose}=sampleActor(actor,time);return structuredClone(pose);}
export function pasteManualPose(actor,time,pose){return putKey(actor,time,structuredClone(pose));}
export function newManualAnimation(actor,time=0){
 const state=sampleActor(actor,time);
 actor.keys=[{time:0,x:state.x,y:state.y,scale:state.scale,rotation:0,flip:state.flip,opacity:1,view:['front','threeQuarter','side','back'].includes(state.view)?state.view:'threeQuarter',mouth:'closed',expression:'original',outfit:'original',armPose:{leftX:0,leftY:0,rightX:0,rightY:0,leftFootX:0,leftFootY:0,rightFootX:0,rightFootY:0,headTilt:0,bodyLean:0}}];
 actor.clips=[];enableManual(actor);actor.poseInterpolation='hold';
}
export function retimePose(actor,key,time,duration){
 if(!actor.keys.includes(key)||key.time===0)return false;
 const target=actor.manualAnimation?frameTime(frameNumber(time,actor.manualFps||24),actor.manualFps||24):Math.round(time*1e6)/1e6;
 if(target<=0||target>duration||actor.keys.some(k=>k!==key&&Math.abs(k.time-target)<1e-6))return false;
 key.time=target;return true;
}
