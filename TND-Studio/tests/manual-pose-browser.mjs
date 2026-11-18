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

 console.log('MANUAL_POSE',await evaluate(`(async()=>{const $=id=>document.getElementById(id);document.querySelector('[data-character="dhanuka"]').click();document.getElementById('viewSelect').value='front';document.getElementById('viewSelect').dispatchEvent(new Event('change'));$('startBtn').click();$('stagePose').click();if($('viewSelect').value!=='front'||$('resetArms').hidden)throw Error('Pose mode did not enable');const m=await import('./app.mjs');return {enabled:true,view:$('viewSelect').value};})()`));
 const handles=await evaluate(`(async()=>{const {loadBellyRig,manualArms}=await import('./belly-laugh.mjs');const {extractSprite}=await import('./sprites.mjs');const rig=await loadBellyRig(extractSprite);const h=manualArms({})[0].hand;const c=document.getElementById('stage'),r=c.getBoundingClientRect(),height=c.height*.59*.81,width=height*rig.closed.width/rig.closed.height;return {x:r.left+(c.width*Number(document.getElementById('posX').value)/100-width/2+(h.x-rig.origin.x)/rig.frame.width*width)/c.width*r.width,y:r.top+(c.height*.85-height+(h.y-rig.origin.y)/rig.frame.height*height)/c.height*r.height};})()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:handles.x,y:handles.y,button:'left',clickCount:1},sessionId);
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:handles.x-35,y:handles.y-45,button:'left',buttons:1},sessionId);
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:handles.x-35,y:handles.y-45,button:'left',clickCount:1},sessionId);
 await new Promise(r=>setTimeout(r,700));
 console.log('SAVED_POSE',await evaluate(`new Promise((resolve,reject)=>{const req=indexedDB.open('tnd-studio-local-v1');req.onsuccess=()=>{const get=req.result.transaction('projects').objectStore('projects').get('current');get.onsuccess=()=>{const a=get.result.cast.find(a=>a.charId==='dhanuka');const pose=a.keys[0].armPose;if(!pose||Math.abs(pose.leftX)<1||Math.abs(pose.leftY)<1)reject(Error('Handle did not save movement: '+JSON.stringify(pose)));else resolve(pose);};};})`));

 const foot=await evaluate(`(async()=>{const {loadBellyRig,manualLegs}=await import('./belly-laugh.mjs'),{extractSprite}=await import('./sprites.mjs');const rig=await loadBellyRig(extractSprite),p=manualLegs({})[1].hand,c=document.getElementById('stage'),r=c.getBoundingClientRect(),height=c.height*.59*.81,width=height*rig.closed.width/rig.closed.height;return {x:r.left+(c.width*Number(document.getElementById('posX').value)/100-width/2+(p.x-rig.origin.x)/rig.frame.width*width)/c.width*r.width,y:r.top+(c.height*.85-height+(p.y-rig.origin.y)/rig.frame.height*height)/c.height*r.height};})()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:foot.x,y:foot.y,button:'left',clickCount:1},sessionId);await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:foot.x+10,y:foot.y-12,button:'left',buttons:1},sessionId);await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:foot.x+10,y:foot.y-12,button:'left',clickCount:1},sessionId);await new Promise(r=>setTimeout(r,500));
 console.log('FOOT_DRAG',await evaluate(`new Promise((resolve,reject)=>{const req=indexedDB.open('tnd-studio-local-v1');req.onsuccess=()=>{const get=req.result.transaction('projects').objectStore('projects').get('current');get.onsuccess=()=>{const pose=get.result.cast.find(a=>a.charId==='dhanuka').keys[0].armPose;if(!pose.rightFootX||!pose.rightFootY)reject(Error('Foot did not move'));else resolve({x:pose.rightFootX,y:pose.rightFootY});};};})`));
 console.log('LAYOUT',await evaluate(`(()=>{const bottom=document.querySelector('.timeline').getBoundingClientRect().bottom,button=document.getElementById('resetArms').getBoundingClientRect();if(document.documentElement.scrollHeight>innerHeight+1||bottom>innerHeight+1||button.bottom>innerHeight)throw Error('Editor needs page scrolling');for(const tool of document.querySelectorAll('.tool-tabs button')){tool.click();if(document.querySelectorAll('.tool-panel:not([hidden])').length!==1)throw Error('Tool tabs failed');}document.querySelector('[data-tool="pose"]').click();return {viewport:[innerWidth,innerHeight],timelineBottom:bottom,resetButtonBottom:button.bottom};})()`));
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);await fs.writeFile(new URL('../manual-pose-preview.png',import.meta.url),Buffer.from(shot.data,'base64'));
 await evaluate(`document.getElementById('undoBtn').click()`);await new Promise(r=>setTimeout(r,400));
 await evaluate(`document.querySelector('[data-character="dhanuka"]').click()`);
 console.log('UNDO',await evaluate(`({controls:!document.getElementById('resetArms').hidden,position:document.getElementById('posX').value})`));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
