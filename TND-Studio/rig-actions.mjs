import {actionEnvelope} from './actions.mjs';
import {bellyState,manualArms} from './belly-laugh.mjs';
import {rigView} from './view-rigs.mjs';
export const neutralRigPose=()=>({leftX:0,leftY:0,rightX:0,rightY:0,leftFootX:0,leftFootY:0,rightFootX:0,rightFootY:0});
export function rigActionPose(actor,time,base,view,mouth='closed'){
 const pose={...neutralRigPose(),...base,rigView:rigView(view),mouth};
 if(actor.manualAnimation)return pose;for(const clip of actor.clips){if(time<clip.start||time>=clip.start+clip.duration)continue;
 const amount=actionEnvelope(clip,time),elapsed=time-clip.start;
 if(clip.type==='bellyLaugh'){
 if(pose.rigView==='back')pose.handsBehind=true;const state=bellyState(elapsed/clip.duration),arms=manualArms({rigView:pose.rigView});
 for(const [i,a]of arms.entries()){const side=i?'right':'left',x=pose.rigView==='side'?290:i?274:246,y=562;pose[side+'X']=(base?.[side+'X']||0)*(1-state.reach)+(x-a.from.x)*state.reach;pose[side+'Y']=(base?.[side+'Y']||0)*(1-state.reach)+(y-a.from.y)*state.reach;}
 if(state.laugh>.3){pose.facePreset='laugh';pose.faceStrength=1;}pose.bodyLean=(base?.bodyLean||0)+Math.sin(elapsed*10.7)*1.4*state.laugh;
 }
 if(clip.type==='laugh'&&amount>.2){pose.facePreset='laugh';pose.faceStrength=1;pose.bodyLean=(base?.bodyLean||0)+Math.sin(elapsed*10.7)*amount;}
 if(clip.type==='smile'&&amount>.2){pose.facePreset='happy';pose.faceStrength=1;}
 if(clip.type==='angry'&&amount>.2){pose.facePreset='angry';pose.faceStrength=1;}
 if(clip.type==='lookLeft'&&amount>.2)pose.gazeX=-1;
 if(clip.type==='lookRight'&&amount>.2)pose.gazeX=1;
 if(clip.type==='blink'){const cycle=elapsed%1.8;pose.eyeClose=cycle>.25&&cycle<.48?1:(base?.eyeClose||0);}
 }return pose;
}
