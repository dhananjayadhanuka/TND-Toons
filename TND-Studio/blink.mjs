// Eye-only draft patch in the original 1536 × 1024 reference coordinate system.
export const BLINK_REGIONS=[[1196,400,236,144]];
export function blinkAmount(actor,time){
 if(actor.charId!=='dhanuka')return 0;
 const clip=actor.clips.find(c=>c.type==='blink'&&time>=c.start&&time<c.start+c.duration);
 if(!clip)return 0;
 const local=(time-clip.start)%1.6;
 if(local<.35||local>=.69)return 0;
 if(local<.47)return (local-.35)/.12;
 if(local<.55)return 1;
 return 1-(local-.55)/.14;
}
export function composeBlinkReference(original,closed){
 const c=document.createElement('canvas');c.width=original.width;c.height=original.height;
 const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(original,0,0);
 const patch=document.createElement('canvas');patch.width=c.width;patch.height=c.height;
 const p=patch.getContext('2d');p.drawImage(closed,0,0,c.width,c.height);
 const data=p.getImageData(0,0,c.width,c.height),mask=g.getImageData(0,0,c.width,c.height);
 for(const [x,y,w,h] of BLINK_REGIONS)for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){
 const i=(yy*c.width+xx)*4,edge=Math.min(xx-x,y+h-1-yy,yy-y,x+w-1-xx),alpha=Math.min(1,edge/10);
 for(let k=0;k<3;k++)mask.data[i+k]=Math.round(mask.data[i+k]*(1-alpha)+data.data[i+k]*alpha);
 }
 // Dirty rectangles avoid re-premultiplying untouched semi-transparent pixels.
 for(const [x,y,w,h] of BLINK_REGIONS)g.putImageData(mask,0,0,x,y,w,h);
 return c;
}

