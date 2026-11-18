// Isolated development QA. Does not connect to the user's browser profile.
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const browser=process.env.TND_TEST_BROWSER||'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe';
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'tnd-studio-qa-'));
const proc=spawn(browser,['--headless=new','--disable-gpu','--disable-accelerated-video-encode','--disable-background-timer-throttling','--disable-renderer-backgrounding','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
let ws;
try{
 const address=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Browser startup timeout')),20000);proc.on('error',e=>{clearTimeout(timer);reject(e);});proc.stderr.on('data',chunk=>{text+=chunk;const m=text.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});});
 ws=new WebSocket(address);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const {resolve,reject,timer}=pending.get(m.id);clearTimeout(timer);pending.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result);}};
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},30000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 await send('Page.bringToFront',{},sessionId);
 await send('Page.navigate',{url:'http://127.0.0.1:47831'},sessionId);
 await new Promise(resolve=>setTimeout(resolve,1500));
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true},sessionId);if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 await send('Runtime.enable',{},sessionId);await send('Page.bringToFront',{},sessionId);await send('Emulation.setDeviceMetricsOverride',{width:1366,height:650,deviceScaleFactor:1,mobile:false},sessionId);
 await evaluate(`new Promise((resolve,reject)=>{const start=Date.now();const timer=setInterval(()=>{if(document.querySelectorAll('.character-card').length===3){clearInterval(timer);resolve(true);}if(Date.now()-start>20000){clearInterval(timer);reject(Error(document.body.innerText));}},100);})`);



 await evaluate(`(async()=>{const p=await fetch('library/dhanuka-belly-laugh.tnd.json').then(r=>r.json());p.cast[0].clips=[];p.cast[0].keys=[{...p.cast[0].keys[0],time:0,x:50,y:85,scale:1.8,view:'front',expression:'original',armPose:{leftX:0,leftY:0,rightX:0,rightY:0,leftFootX:0,leftFootY:0,rightFootX:0,rightFootY:0}}];const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(p)],'body.tnd.json',{type:'application/json'}));const input=document.getElementById('projectInput');input.files=dt.files;input.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,1200));document.getElementById('stagePose').click();})()`);
 const getPose=()=>evaluate(`new Promise(resolve=>{const req=indexedDB.open('tnd-studio-local-v1');req.onsuccess=()=>{const q=req.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result.cast[0].keys[0].armPose);};})`);
 for(const side of ['headTilt','bodyLean']){
 const pose=await getPose();const point=await evaluate(`(async()=>{const {loadBellyRig,manualPoseControls}=await import('./belly-laugh.mjs'),{extractSprite}=await import('./sprites.mjs');const rig=await loadBellyRig(extractSprite),p=manualPoseControls(`+JSON.stringify(pose)+`).find(c=>c.side==='`+side+`').point,c=document.getElementById('stage'),r=c.getBoundingClientRect(),height=c.height*.59*.81*1.8,width=height*rig.closed.width/rig.closed.height;return {x:r.left+(c.width*.5-width/2+(p.x-rig.origin.x)/rig.closed.width*width)/c.width*r.width,y:r.top+(c.height*.85-height+(p.y-rig.origin.y)/rig.closed.height*height)/c.height*r.height};})()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1},sessionId);await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x+12,y:point.y,buttons:1,button:'left'},sessionId);await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x+12,y:point.y,button:'left',clickCount:1},sessionId);await new Promise(r=>setTimeout(r,1200));const after=await getPose();if(!after[side])throw Error(side+' drag did not persist');for(const key of ['leftX','leftY','rightX','rightY','leftFootX','leftFootY','rightFootX','rightFootY'])if(after[key]!==0)throw Error('Existing limb target changed');console.log(side,after[side]);
 }

 console.log('JOINT_CONTINUITY',await evaluate(`(async()=>{const {loadBellyRig,drawManualPose,manualLegs,poseHeadPoint,poseBodyPoint}=await import('./belly-laugh.mjs'),{extractSprite}=await import('./sprites.mjs');const rig=await loadBellyRig(extractSprite),c=document.createElement('canvas');c.width=1100;c.height=1200;const g=c.getContext('2d');let samples=0;for(const lean of [-35,0,35])for(const tilt of [-35,0,35]){const pose={leftX:0,leftY:0,rightX:0,rightY:0,leftFootX:0,leftFootY:0,rightFootX:0,rightFootY:0,bodyLean:lean,headTilt:tilt};g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);g.translate(240+rig.origin.x,100+rig.origin.y);drawManualPose(g,rig,pose);const n=poseHeadPoint({x:260,y:463},pose),b=poseBodyPoint({x:260,y:492},pose);const points=manualLegs(pose).map(a=>a.hip);for(let t=0;t<=1;t+=.1)points.push({x:n.x+(b.x-n.x)*t,y:n.y+(b.y-n.y)*t});for(const p of points){const d=g.getImageData(Math.round(240+p.x),Math.round(100+p.y),1,1).data;if(d[3]<240)throw Error('Transparent joint at '+JSON.stringify({lean,tilt,p,alpha:d[3]}));samples++;}}return {poses:9,opaqueJointSamples:samples};})()`));
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);await fs.writeFile(new URL('../head-body-preview.png',import.meta.url),Buffer.from(shot.data,'base64'));
 console.log('LAYOUT',await evaluate(`({pageOverflow:document.documentElement.scrollHeight>innerHeight,controlsVisible:!document.getElementById('bodyControls').hidden})`));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
