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


 console.log('LIMB_RENDER',await evaluate(`(async()=>{const {loadBellyRig,drawManualPose,manualPoseBounds,manualArms,manualLegs}=await import('./belly-laugh.mjs');const {extractSprite}=await import('./sprites.mjs');const rig=await loadBellyRig(extractSprite),pose={leftX:-50,leftY:-30,rightX:50,rightY:-30,leftFootX:-200,leftFootY:-120,rightFootX:200,rightFootY:-120};const bounds=manualPoseBounds(rig,pose),c=document.createElement('canvas');c.width=1000;c.height=1100;const g=c.getContext('2d');g.translate(250,100);drawManualPose(g,rig,pose);const pixels=g.getImageData(0,0,c.width,c.height).data;let outside=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if((x<250||x>=250+rig.closed.width||y<100||y>=100+rig.closed.height)&&pixels[(y*c.width+x)*4+3]>0)outside++;if(!outside)throw Error('No visible limbs outside old sprite');if(bounds.right<=rig.closed.width&&bounds.left>=0)throw Error('Selection bounds did not expand');
 for(const a of manualLegs(pose))if(Math.abs(a.knee.y-a.hip.y)>.001||Math.abs(a.hand.x-a.hip.x)!==126)throw Error('Leg not fully straight');let elbowSamples=0;for(const a of manualArms(pose)){const x=250+a.elbow.x-rig.origin.x,y=100+a.elbow.y-rig.origin.y;for(let dx=-4;dx<=4;dx++)for(let dy=-4;dy<=4;dy++){if(dx*dx+dy*dy>16)continue;const pixel=g.getImageData(Math.round(x+dx),Math.round(y+dy),1,1).data;if(pixel[0]<245||pixel[1]<210||pixel[2]<140)throw Error('Black elbow seam: '+Array.from(pixel));elbowSamples++;}}
 const p=await fetch('library/dhanuka-belly-laugh.tnd.json').then(r=>r.json());p.cast[0].clips=[];p.cast[0].keys=[{...p.cast[0].keys[0],time:0,x:50,y:85,scale:1.4,view:'front',expression:'original',armPose:pose}];const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(p)],'limbs.tnd.json',{type:'application/json'}));const input=document.getElementById('projectInput');input.files=dt.files;input.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,500));document.getElementById('stagePose').click();return {outsidePixels:outside,elbowSamples,straightLegs:true,bodyWidth:rig.closed.width,bounds};})()`));
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);await fs.writeFile(new URL('../limb-layer-preview.png',import.meta.url),Buffer.from(shot.data,'base64'));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
