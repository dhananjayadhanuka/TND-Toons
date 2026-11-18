import {deformDrawing} from './editor-geometry.mjs';
import {drawingMatrix,transformPoint} from './drawing-animation.mjs';
import {CHARACTERS} from './core.mjs';
import {manualPoseBounds} from './belly-laugh.mjs';
export const OUTPUT_SIZES={landscape:[1920,1080],portrait:[1080,1920],square:[1080,1080]};
export function changeCanvasFormat(project,format){
 if(!OUTPUT_SIZES[format])throw Error('Invalid canvas format');if(format===project.format)return;
 if(!project.cast.length&&!project.drawings?.length&&!project.drawingGroups?.length){project.format=format;project.frameRegion={x:0,y:0,width:1,height:1};return;}
 const [ow,oh]=OUTPUT_SIZES[project.format],[nw,nh]=OUTPUT_SIZES[format],region=project.frameRegion||{x:0,y:0,width:1,height:1};
 let left=region.x*ow,top=region.y*oh,right=(region.x+region.width)*ow,bottom=(region.y+region.height)*oh;
 const include=(x,y,pad=0)=>{left=Math.min(left,x-pad);top=Math.min(top,y-pad);right=Math.max(right,x+pad);bottom=Math.max(bottom,y+pad);};
 for(const actor of project.cast){const character=CHARACTERS.find(c=>c.id===actor.charId);for(const k of actor.keys){const h=oh*.59*character.height*k.scale,w=h*(k.armPose?441/746:character.crop[2]/character.crop[3]),b=k.armPose?manualPoseBounds({origin:{x:31,y:16},closed:{width:441,height:746}},{...k.armPose,rigView:k.view}):{left:0,top:0,right:441,bottom:746},angle=k.rotation*Math.PI/180;
 for(const px of [b.left,b.right])for(const py of [b.top,b.bottom]){let x=-w/2+px/441*w;const y=-h+py/746*h;if(k.flip)x=-x;include(ow*k.x/100+x*Math.cos(angle)-y*Math.sin(angle),oh*k.y/100+x*Math.sin(angle)+y*Math.cos(angle));}}}
 const times=new Set([0,...(project.drawingGroups||[]).flatMap(g=>g.keys.map(k=>k.time)),...(project.drawings||[]).flatMap(o=>(o.controls||[]).flatMap(pin=>pin.keys.map(k=>k.time)))]);
 for(const raw of project.drawings||[]){for(const t of raw.groupId||raw.controls?.length?times:[0]){const o=deformDrawing(raw,t,ow,oh),xs=o.points.map(p=>p[0]),ys=o.points.map(p=>p[1]),m=drawingMatrix(project.drawingGroups,o.groupId,t,ow,oh);for(const x of [Math.min(...xs),Math.max(...xs)])for(const y of [Math.min(...ys),Math.max(...ys)]){const p=transformPoint(m,[x*ow,y*oh]);include(p[0],p[1],o.width*Math.min(ow,oh)*Math.hypot(m[0],m[1])*(o.type==='spray'?1.8:o.type==='brush'?1:.5));}}}
 const scale=Math.min(nw/(right-left),nh/(bottom-top)),dx=(nw-(right-left)*scale)/2,dy=(nh-(bottom-top)*scale)/2;
 for(const actor of project.cast)for(const k of actor.keys){k.x=(dx+(ow*k.x/100-left)*scale)/nw*100;k.y=(dy+(oh*k.y/100-top)*scale)/nh*100;k.scale=Math.max(.000001,k.scale*oh*scale/nh);}
 for(const o of project.drawings||[]){o.points=o.points.map(p=>[(dx+(p[0]*ow-left)*scale)/nw,(dy+(p[1]*oh-top)*scale)/nh]);o.width=Math.max(.000001,o.width*Math.min(ow,oh)*scale/Math.min(nw,nh));for(const pin of o.controls||[]){pin.x=(dx+(pin.x*ow-left)*scale)/nw;pin.y=(dy+(pin.y*oh-top)*scale)/nh;pin.radius*=ow*scale/nw;for(const key of pin.keys){key.dx*=ow*scale/nw;key.dy*=oh*scale/nh;}}}
 for(const group of project.drawingGroups||[]){group.pivot=[(dx+(group.pivot[0]*ow-left)*scale)/nw,(dy+(group.pivot[1]*oh-top)*scale)/nh];for(const key of group.keys){key.x*=ow*scale/nw;key.y*=oh*scale/nh;}}
 project.frameRegion={x:dx/nw,y:dy/nh,width:(right-left)*scale/nw,height:(bottom-top)*scale/nh};project.format=format;
}
