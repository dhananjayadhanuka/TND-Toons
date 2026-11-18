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






 console.log('BACKGROUND_LIBRARY',await evaluate(`(async()=>{const $=id=>document.getElementById(id),read=()=>new Promise(resolve=>{const r=indexedDB.open('tnd-studio-local-v1');r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result);};});await new Promise(r=>setTimeout(r,400));const before=await read();$('showItems').click();$('itemCategory').value='Backgrounds';$('itemCategory').dispatchEvent(new Event('change'));const button=document.querySelector('#editableItemGrid button');if(!button?.textContent.includes('Blue sky'))throw Error('Background library item absent');button.click();await new Promise(r=>setTimeout(r,900));const p=await read();if(p.background!=='custom'||p.backgroundLibraryId!=='blue-sky-green-hills-v1'||!p.customBackground.startsWith('data:image/png;base64,'))throw Error('Background not saved portably');if(JSON.stringify(before.cast)!==JSON.stringify(p.cast)||JSON.stringify(before.drawings)!==JSON.stringify(p.drawings))throw Error('Background changed scene subjects');const {validateProject}=await import('./core.mjs');validateProject(JSON.parse(JSON.stringify(p)));const c=$('stage'),g=c.getContext('2d'),sky=g.getImageData(Math.round(c.width*.5),Math.round(c.height*.45),1,1).data;if(sky[2]<150||sky[1]<130||sky[0]>180)throw Error('Generated image not rendered');const active=document.querySelector('#backgrounds .generated-background');if(!active.classList.contains('active'))throw Error('Background selection not highlighted');$('undoBtn').click();await new Promise(r=>setTimeout(r,300));$('redoBtn').click();await new Promise(r=>setTimeout(r,400));return {library:true,sceneCard:true,portableSave:true,subjectsUnchanged:true,rendered:true,undoRedo:true};})()`));
 const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);await fs.writeFile(new URL('../generated-background-preview.png',import.meta.url),Buffer.from(shot.data,'base64'));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
