import {drawCharacter} from './upper-body.mjs';
import {loadDhanukaViews} from './dhanuka-views.mjs';
import {blinkAmount} from './blink.mjs';
import {laughAmount,poseAmount,FACE_ACTIONS} from './actions.mjs';
import {motionAt} from './core.mjs';
const $=id=>document.getElementById(id);
try{
 const views=await loadDhanukaViews((image,[x,y,w,h])=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(image,x,y,w,h,0,0,w,h);return c;});
 const g=$('preview').getContext('2d'),actor={charId:'dhanuka',clips:[{type:'blink',start:0,duration:1.6}]};let t=0,playing=true,last=performance.now();
 function draw(){
 const view=$('view').value,mouth=$('mouth').value,entry=views[view],sprite=entry[mouth]||entry.closed;$('mouthLabel').hidden=view==='back';
 g.globalAlpha=1;g.fillStyle='white';g.fillRect(0,0,800,820);const h=760,w=h*sprite.width/sprite.height,x=(800-w)/2;
 const motion=view!=='back'?motionAt(actor,t):{dy:0,angle:0};g.save();g.translate(400,780+motion.dy*820);g.rotate(motion.angle*Math.PI/180);g.translate(-400,-780);const upper=view!=='back'?laughAmount(actor,t):0;drawCharacter(g,sprite,x,20,w,h,upper,t);
 for(const [suffix,amount]of [['Blink',blinkAmount(actor,t)],...Object.entries(FACE_ACTIONS).map(([type,suffix])=>[suffix,poseAmount(actor,type,t)])]){const pose=entry[mouth+suffix];if(pose&&amount>0){g.globalAlpha=amount;drawCharacter(g,pose,x,20,w,h,upper,t);g.globalAlpha=1;}}
 g.restore();$('time').textContent=t.toFixed(2)+'s';$('moment').value=t;
 }
 $('action').onchange=()=>{actor.clips[0].type=$('action').value;t=0;draw();};for(const id of ['view','mouth'])$(id).onchange=draw;
 $('moment').oninput=()=>{playing=false;$('play').textContent='Play';t=Number($('moment').value);draw();};$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'Pause':'Play';last=performance.now();};
 function frame(now){if(playing){t=(t+(now-last)/1000*.6)%1.6;draw();}last=now;requestAnimationFrame(frame);}draw();requestAnimationFrame(frame);
}catch(e){$('error').textContent='Open using Start TND Studio.cmd. '+e.message;}
