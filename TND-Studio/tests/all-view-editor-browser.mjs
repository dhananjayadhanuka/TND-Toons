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






 await evaluate(`document.querySelector('[data-character="dhanuka"]').click()`);
 for(const view of ['front','threeQuarter','side','back']){
 await evaluate(`(async()=>{const $=id=>document.getElementById(id);if($('playBtn').getAttribute('aria-label')==='Pause preview')$('playBtn').click();$('startBtn').click();for(const b of [...$('clipList').querySelectorAll('button')])b.click();const v=$('viewSelect');v.value='`+view+`';v.dispatchEvent(new Event('change'));$('stagePose').click();if(v.value!=='`+view+`')throw Error('Edit pose reset view');await new Promise(r=>setTimeout(r,1200));})()`);
 for(const side of ['left','rightFoot']){
 const point=await evaluate(`(async()=>{const {loadBellyRig,manualPoseControls}=await import('./belly-laugh.mjs'),{extractSprite}=await import('./sprites.mjs');const rig=await loadBellyRig(extractSprite),p=manualPoseControls({rigView:'`+view+`',leftX:0,leftY:0,rightX:0,rightY:0,leftFootX:0,leftFootY:0,rightFootX:0,rightFootY:0}).find(c=>c.side==='`+side+`').point,c=document.getElementById('stage'),r=c.getBoundingClientRect(),height=c.height*.59*.81*Number(document.getElementById('scale').value),width=height*rig.closed.width/rig.closed.height;return {x:r.left+(c.width*Number(document.getElementById('posX').value)/100-width/2+(p.x-rig.origin.x)/rig.closed.width*width)/c.width*r.width,y:r.top+(c.height*Number(document.getElementById('posY').value)/100-height+(p.y-rig.origin.y)/rig.closed.height*height)/c.height*r.height};})()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1},sessionId);await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x-8,y:point.y-10,buttons:1,button:'left'},sessionId);await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x-8,y:point.y-10,button:'left',clickCount:1},sessionId);
 }
 console.log('VIEW_UI',view,await evaluate(`(async()=>{const $=id=>document.getElementById(id);await new Promise(r=>setTimeout(r,1200));const p=await new Promise(resolve=>{const r=indexedDB.open('tnd-studio-local-v1');r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result);};});const a=p.cast.find(a=>a.charId==='dhanuka'),pose=a.keys[0].armPose;if(a.keys[0].view!=='`+view+`'||Math.abs(pose.leftX)<1||Math.abs(pose.rightFootY)<1)throw Error('View/limb drag not saved: '+JSON.stringify(a.keys[0]));document.querySelector('[data-tool="face"]').click();if('`+view+`'==='back'){if(!document.querySelector('[data-face-preset="angry"]').disabled||$('faceViewNote').hidden)throw Error('Back face policy missing');}else{const before=$('stage').toDataURL();document.querySelector('[data-face-preset="angry"]').click();if($('stage').toDataURL()===before)throw Error('Face did not change');if($('viewSelect').value!=='`+view+`')throw Error('Face changed view');}document.querySelector('[data-tool="actions"]').click();document.querySelector('[data-motion="bellyLaugh"]').click();if(!$('clipList').textContent.includes('Belly laugh'))throw Error('Belly action not added');document.querySelector('[data-walk-variant="inPlace"]').click();if($('viewSelect').value!=='`+view+`'||$('playBtn').getAttribute('aria-label')!=='Pause preview')throw Error('Walk changed view or no autoplay');await new Promise(r=>setTimeout(r,550));$('playBtn').click();return {dragSaved:true,facePolicy:true,belly:true,walk:true};})()`));

 await evaluate(`document.getElementById('startBtn').click();document.getElementById('stagePose').click()`);
 const headPoint=await evaluate(`(async()=>{const {loadBellyRig}=await import('./belly-laugh.mjs'),{extractSprite}=await import('./sprites.mjs');const rig=await loadBellyRig(extractSprite),c=document.getElementById('stage'),r=c.getBoundingClientRect(),height=c.height*.59*.81*Number(document.getElementById('scale').value),width=height*rig.closed.width/rig.closed.height;return {x:r.left+(c.width*Number(document.getElementById('posX').value)/100-width/2+(260-rig.origin.x)/rig.closed.width*width)/c.width*r.width,y:r.top+(c.height*Number(document.getElementById('posY').value)/100-height+(250-rig.origin.y)/rig.closed.height*height)/c.height*r.height};})()`);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:headPoint.x,y:headPoint.y,button:'left',clickCount:1},sessionId);await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:headPoint.x+7,y:headPoint.y,buttons:1,button:'left'},sessionId);await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:headPoint.x+7,y:headPoint.y,button:'left',clickCount:1},sessionId);
 console.log('EDIT_WITH_WALK',view,await evaluate(`(async()=>{await new Promise(r=>setTimeout(r,1200));const p=await new Promise(resolve=>{const r=indexedDB.open('tnd-studio-local-v1');r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result);};});const a=p.cast.find(a=>a.charId==='dhanuka');if(a.clips[0]?.type!=='walk'||Math.abs(a.keys[0].armPose.headTilt||0)<1)throw Error('Cannot edit with Walk clip present');document.getElementById('playBtn').click();if(document.getElementById('stagePose').getAttribute('aria-pressed')!=='false')throw Error('Play did not resume actions');document.getElementById('playBtn').click();return true;})()`));
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true},sessionId);await fs.writeFile(new URL('../rig-'+view+'-editor.png',import.meta.url),Buffer.from(shot.data,'base64'));
 }
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
