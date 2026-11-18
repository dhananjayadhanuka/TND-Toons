// Continuous upper-body bend. Waist and everything below it stay fixed.
export const WAIST_FRACTION=.74;
export function upperBodyOffset(fraction,height,amount,time){
 if(fraction>=WAIST_FRACTION||amount<=0)return 0;
 const t=Math.max(0,Math.min(1,(WAIST_FRACTION-fraction)/.26));
 const weight=t*t*(3-2*t);
 return Math.sin(time*Math.PI*3.6)*height*.0035*amount*weight;
}
export function drawCharacter(g,sprite,x,y,w,h,amount=0,time=0){
 if(amount<=0){g.drawImage(sprite,x,y,w,h);return;}
 const waist=Math.floor(sprite.height*WAIST_FRACTION),bands=80;
 // No rotation or vertical translation: feet remain at the same pixels.
 for(let i=0;i<bands;i++){
 const sy=waist*i/bands,sh=waist/bands,dy=sy/sprite.height*h,dh=sh/sprite.height*h;
 const offset=upperBodyOffset((sy+sh/2)/sprite.height,h,amount,time);
 g.drawImage(sprite,0,sy,sprite.width,sh,x+offset,y+dy,w,dh);
 }
 const lower=waist/sprite.height*h;
 g.drawImage(sprite,0,waist,sprite.width,sprite.height-waist,x,y+lower,w,h-lower);
}
