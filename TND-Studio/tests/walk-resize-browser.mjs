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






 console.log('WALK_RESIZE',await evaluate(`(async()=>{const $=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms)),read=()=>new Promise(resolve=>{const r=indexedDB.open('tnd-studio-local-v1');r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result);};}),p=await fetch('library/dhanuka-front-walk.tnd.json').then(r=>r.json());p.duration=4;p.cast[0].keys=[{...p.cast[0].keys[0],time:0,scale:1.4,view:'side',x:30}];p.cast[0].clips=[];const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(p)],'resizewalk.tnd.json',{type:'application/json'}));$('projectInput').files=dt.files;$('projectInput').dispatchEvent(new Event('change'));await sleep(700);document.querySelector('[data-tool="actions"]').click();document.querySelector('[data-walk-variant="inPlace"]').click();await sleep(250);$('scale').value=.7;$('scale').dispatchEvent(new Event('input'));$('scale').dispatchEvent(new Event('change'));await sleep(500);let saved=await read(),a=saved.cast[0];if(a.manualAnimation||a.clips[0].type!=='walk'||a.keys.some(k=>Math.abs(k.scale-.7)>.001))throw Error('Resize disabled walk or altered size');if($('playBtn').getAttribute('aria-label')!=='Pause preview')throw Error('Playback did not resume after resize');document.querySelector('[data-walk-variant="forward"]').click();await sleep(500);saved=await read();a=saved.cast[0];if(Math.abs(a.keys[0].scale-.7)>.001||a.clips[0].walkVariant!=='forward')throw Error('Action reset size');$('drawingFrame').value=49;$('drawingFrame').dispatchEvent(new Event('change'));const {walkApproach,walkPose}=await import('./walk.mjs'),before=structuredClone(a),oldX=before.keys[0].x/100+walkApproach(before,2,$('stage').width/$('stage').height).dx;$('scale').value=1.1;$('scale').dispatchEvent(new Event('input'));$('scale').dispatchEvent(new Event('change'));await sleep(500);saved=await read();a=saved.cast[0];const newX=a.keys[0].x/100+walkApproach(a,2,$('stage').width/$('stage').height).dx;if(Math.abs(oldX-newX)>1e-6||a.keys.length!==before.keys.length||a.keys.some(k=>Math.abs(k.scale-1.1)>.001)||JSON.stringify(a.clips)!==JSON.stringify(before.clips))throw Error('Resize moved current position or changed action');for(const variant of ['far','near','inPlace','forward']){document.querySelector('[data-walk-variant="'+variant+'"]').click();await sleep(450);saved=await read();a=saved.cast[0];if(Math.abs(a.keys[0].scale-1.1)>.001)throw Error(variant+' resized on application');for(const time of [0,1,2,3.9])if(walkApproach(a,time).scale!==1)throw Error(variant+' has automatic scaling');const first=walkPose(a,.15,{rigView:'side'}),second=walkPose(a,.5,{rigView:'side'});if(first.leftFootX===second.leftFootX)throw Error('Walk stopped after resize');$('playBtn').click();}return {resizeKeepsWalk:true,resizeResumesPlayback:true,actionKeepsSelectedSize:true,currentPositionPreserved:true,noAutomaticGrowth:true,allFourVariants:true};})()`));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
