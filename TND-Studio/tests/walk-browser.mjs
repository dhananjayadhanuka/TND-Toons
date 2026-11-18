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






 console.log('WALK_UI',await evaluate(`(async()=>{const $=id=>document.getElementById(id);document.querySelector('[data-character="dhanuka"]').click();document.getElementById('viewSelect').value='front';document.getElementById('viewSelect').dispatchEvent(new Event('change'));$('startBtn').click();document.querySelector('[data-tool="actions"]').click();$('clipDuration').value=4;document.querySelector('[data-motion="walk"]').click();if($('viewSelect').value!=='front'||!$('clipList').textContent.includes('Walk'))throw Error('Walk did not enable Front rig');if($('playBtn').getAttribute('aria-label')!=='Pause preview')throw Error('Walk did not autoplay');const before=$('stage').toDataURL();await new Promise(r=>setTimeout(r,700));const first=$('stage').toDataURL();await new Promise(r=>setTimeout(r,230));const second=$('stage').toDataURL();$('playBtn').click();if(before===first||first===second)throw Error('Walk playback did not animate');await new Promise(r=>setTimeout(r,1000));const saved=await new Promise(resolve=>{const r=indexedDB.open('tnd-studio-local-v1');r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result);};});const a=saved.cast.find(a=>a.charId==='dhanuka');if(a.clips.length!==1||a.clips[0].type!=='walk'||a.clips[0].duration!==saved.duration||a.keys.length!==1||!saved.previewLoop)throw Error('Walk-only cleanup/loop did not persist');return {animated:true,front:true,saved:true};})()`));
 const sheet=await evaluate(`(async()=>{const {loadBellyRig,drawManualPose}=await import('./belly-laugh.mjs'),{walkPose}=await import('./walk.mjs'),{extractSprite}=await import('./sprites.mjs');const rig=await loadBellyRig(extractSprite),c=document.createElement('canvas');c.width=1440;c.height=600;const g=c.getContext('2d');g.fillStyle='#efe8da';g.fillRect(0,0,c.width,c.height);const a={charId:'dhanuka',clips:[{type:'walk',start:0,duration:4}]};for(let i=0;i<4;i++){g.save();g.translate(i*360+60,50);g.scale(.62,.62);drawManualPose(g,rig,walkPose(a,.6+i*.24,{}));g.restore();g.fillStyle='#263423';g.font='18px Segoe UI';g.fillText((.6+i*.24).toFixed(2)+'s',i*360+150,560);}return c.toDataURL().split(',')[1];})()`);await fs.writeFile(new URL('../walk-review.png',import.meta.url),Buffer.from(sheet,'base64'));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
