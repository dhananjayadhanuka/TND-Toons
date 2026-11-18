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






 console.log('CONTINUOUS_WALK',await evaluate(`(async()=>{const $=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms)),read=()=>new Promise(resolve=>{const r=indexedDB.open('tnd-studio-local-v1');r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result);};}),p=await fetch('library/dhanuka-front-walk.tnd.json').then(r=>r.json());p.duration=7;p.cast[0].keys=[{...p.cast[0].keys[0],time:0,x:20,view:'side',scale:.6}];p.cast[0].clips=[];const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(p)],'longwalk.tnd.json',{type:'application/json'}));$('projectInput').files=dt.files;$('projectInput').dispatchEvent(new Event('change'));await sleep(800);document.querySelector('[data-tool="actions"]').click();document.querySelector('[data-walk-variant="forward"]').click();$('playBtn').click();$('duration').value=20;$('duration').dispatchEvent(new Event('change'));await sleep(450);let data=await read(),a=data.cast[0];if(a.clips[0].duration!==20)throw Error('Walk not extended with timeline');$('walkLength').value=30;$('walkLength').dispatchEvent(new Event('change'));await sleep(450);data=await read();a=data.cast[0];if(data.duration!==30||a.clips[0].duration!==30)throw Error('Walk seconds did not extend range');$('walkSpeed').value=2;$('walkSpeed').dispatchEvent(new Event('change'));await sleep(450);data=await read();a=data.cast[0];if(a.clips[0].walkSpeed!==2||a.keys[0].scale!==.6)throw Error('Speed changed size or did not save');const {walkPose,walkApproach}=await import('./walk.mjs');if(!walkPose(a,22,{rigView:'side'}).walking||walkApproach(a,22).dx<=walkApproach(a,7).dx)throw Error('Walking stops after original seven seconds');$('walkToEnd').click();await sleep(200);if($('playBtn').getAttribute('aria-label')!=='Pause preview')throw Error('Continue button did not play');$('playBtn').click();const {validateProject}=await import('./core.mjs');validateProject(data);return {durationExtendsAction:true,walkSecondsExtendsClip:true,speedSaved:true,sizeUnchanged:true,walksPastSevenSeconds:true,continuesForward:true,continueButtonPlays:true};})()`));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
