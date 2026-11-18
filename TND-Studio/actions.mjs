export function actionEnvelope(clip,time){
 if(!clip||time<=clip.start||time>=clip.start+clip.duration)return 0;
 const edge=Math.min(.25,clip.duration/4),local=time-clip.start;
 const t=Math.min(1,local/edge,(clip.duration-local)/edge);
 return t*t*(3-2*t);
}
export function laughAmount(actor,time){
 return poseAmount(actor,'laugh',time);
}
export function poseAmount(actor,type,time){
 if(actor.charId!=='dhanuka')return 0;
 const clip=actor.clips.find(c=>c.type===type&&time>=c.start&&time<c.start+c.duration);
 return actionEnvelope(clip,time);
}
export const FACE_ACTIONS={laugh:'Laugh',smile:'Smile',angry:'Angry',lookLeft:'LookLeft',lookRight:'LookRight'};
