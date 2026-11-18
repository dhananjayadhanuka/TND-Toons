import {rigView,viewConfig} from './view-rigs.mjs';
import {actionEnvelope} from './actions.mjs';

export const WALK_PERIOD=.96;
export const WALK_VARIANTS=[['far','දුරින් එනවා','From far'],['near','ළඟින් එනවා','From near'],['inPlace','එක තැන','In place'],['forward','ඉදිරියට ඇවිදිනවා','Walk forward']];
export const walkCyclePeriod=clip=>(clip.loop?clip.duration/Math.max(1,Math.round(clip.duration/WALK_PERIOD)):WALK_PERIOD)/(clip.walkSpeed||1);
export function resizeWalkingRange(project,duration){if(!Number.isFinite(duration)||duration<1||duration>180)throw Error('Choose 1–180 seconds');const previous=project.duration;for(const a of project.cast)for(const clip of a.clips)if(clip.type==='walk'&&clip.loop&&Math.abs(clip.start+clip.duration-previous)<.001&&clip.start<duration)clip.duration=duration-clip.start;project.duration=duration;}
const neutral={leftX:0,leftY:0,rightX:0,rightY:0,leftFootX:0,leftFootY:0,rightFootX:0,rightFootY:0};
export function walkOnly(actor,duration,id='walk-only',variant,view,placement){
 if(variant!==undefined&&!WALK_VARIANTS.some(v=>v[0]===variant))throw Error('Unknown walk variant');
 actor.manualAnimation=false;const base=placement||actor.keys.find(k=>k.time===0)||actor.keys[0];
 actor.keys=[{...base,time:0,view:rigView(view||base.view),expression:'original',mouth:'closed',armPose:{...neutral}}];
 actor.clips=[{id,type:'walk',start:0,duration,loop:true,approach:variant!=='inPlace'&&variant!=='forward',...(variant?{walkVariant:variant}:{})}];
}
export function walkStep(phase){
 const p=((phase%1)+1)%1,swing=p<.4?p/.4:null;
 const eased=swing===null?0:swing*swing*(3-2*swing),stride=swing===null?1-2*(p-.4)/.6:-1+2*eased;
 return {lift:swing===null?0:Math.sin(Math.PI*swing)**2*20,sway:0,depth:Math.cos(p*Math.PI*2),stride,planted:swing===null};
}
export function walkPose(actor,time,base={}){
 if(actor.charId!=='dhanuka')return base;
 const clip=actor.clips.find(c=>c.type==='walk'&&time>=c.start&&(c.loop?time<=c.start+c.duration:time<c.start+c.duration));
 if(!clip)return base;
 const period=walkCyclePeriod(clip);
 const weight=clip.loop?1:actionEnvelope(clip,time),phase=(time-clip.start)/period,left=walkStep(phase),right=walkStep(phase+.5),swing=Math.sin(phase*Math.PI*2);
 const target={leftX:-12,leftY:30-right.depth*14,rightX:12,rightY:30-left.depth*14,leftFootX:17,leftFootY:-left.lift+(left.depth-1)*5,rightFootX:-17,rightFootY:-right.lift+(right.depth-1)*5};
 const view=rigView(base.rigView),config=viewConfig(base);if(view==='side'||view==='threeQuarter'){const stride=view==='side'?34:18;target.leftFootX=config.hips[0]-config.feet[0]+left.stride*stride;target.rightFootX=config.hips[1]-config.feet[1]+right.stride*stride;target.leftX=config.shoulders[0]-config.hands[0]-left.stride*stride;target.rightX=config.shoulders[1]-config.hands[1]-right.stride*stride;target.leftY=30;target.rightY=30;target.leftFootY=-6-left.lift;target.rightFootY=-6-right.lift;}
 if(!weight)return base;const out={...neutral,...base};for(const key of Object.keys(neutral))out[key]=(base[key]||0)+(target[key]-(base[key]||0))*weight;
 out.bodyLean=base.bodyLean||0;out.walking=true;out.leftFootDepth=left.depth;out.rightFootDepth=right.depth;out.leftHandDepth=right.depth;out.rightHandDepth=left.depth;
 return out;
}

export function walkApproach(actor,time,aspect=16/9){if(actor.manualAnimation)return {scale:1,dy:0};
 const clip=actor.clips.find(c=>c.type==='walk'&&time>=c.start&&time<=c.start+c.duration)||actor.clips.filter(c=>c.type==='walk'&&c.walkVariant==='forward'&&time>c.start+c.duration).sort((a,b)=>b.start-a.start)[0];
 if(clip?.walkVariant==='forward'){const state=[...actor.keys||[]].sort((a,b)=>a.time-b.time).filter(k=>k.time<=time).at(-1),view=rigView(state?.view);if(view!=='side'&&view!=='threeQuarter')return {scale:1,dy:0};const period=walkCyclePeriod(clip),stride=view==='side'?34:18,elapsed=Math.max(0,Math.min(clip.duration,time-clip.start)),direction=state?.flip?-1:1;return {scale:1,dy:0,dx:direction*elapsed*2*stride/(.6*period)*.59*.81*(state?.scale||1)/746*aspect**-1};}
 if(!clip||!clip.approach||clip.walkVariant==='inPlace')return {scale:1,dy:0};
 const progress=Math.max(0,Math.min(1,(time-clip.start)/clip.duration)),state=[...actor.keys||[]].sort((a,b)=>a.time-b.time).filter(k=>k.time<=time).at(-1),view=rigView(state?.view),direction=state?.flip?-1:1,p=view==='back'?1-progress:progress;
 if(clip.walkVariant==='far'){return {scale:1,dy:-.1+.125*p,...(view==='side'||view==='threeQuarter'?{dx:direction*progress*(view==='side'?.16:.08)}:{})};}
 if(clip.walkVariant==='near'){return {scale:1,dy:-.025+.05*p,...(view==='side'||view==='threeQuarter'?{dx:direction*progress*(view==='side'?.12:.06)}:{})};}
 return {scale:1,dy:.025*p};
}
