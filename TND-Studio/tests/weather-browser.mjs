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






 console.log('RAIN_LIBRARY',await evaluate(`(async()=>{const $=id=>document.getElementById(id),{freshProject}=await import('./core.mjs'),p=freshProject();p.duration=1;p.background='studio';const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(p)],'rain.tnd.json',{type:'application/json'}));$('projectInput').files=dt.files;$('projectInput').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,800));$('showItems').click();$('itemCategory').value='Weather';$('itemCategory').dispatchEvent(new Event('change'));const b=document.querySelector('#editableItemGrid button');if(!b?.textContent.includes('Rain'))throw Error('Rain missing from library');b.click();if($('rainSettings').hidden||$('sceneInspector').hidden||!$('emptyStage').hidden)throw Error('Rain controls/scene not shown');$('rainAmount').value=.8;$('rainAmount').dispatchEvent(new Event('change'));$('rainSpeed').value=1.5;$('rainSpeed').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,500));const saved=await new Promise(resolve=>{const r=indexedDB.open('tnd-studio-local-v1');r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result);};});const {validateProject}=await import('./core.mjs');validateProject(saved);if(saved.weather.amount!==.8||saved.weather.speed!==1.5||saved.cast.length||saved.drawings?.length)throw Error('Weather save changed scene contents');const c=$('stage'),ctx=c.getContext('2d'),first=c.toDataURL();$('playBtn').click();await new Promise(r=>setTimeout(r,300));$('playBtn').click();if(first===c.toDataURL())throw Error('Rain did not animate');return {library:true,controls:true,saved:true,rainOnlyScene:true,animated:true};})()`));
 const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);await fs.writeFile(new URL('../rain-preview.png',import.meta.url),Buffer.from(shot.data,'base64'));
 console.log('RAIN_VIDEO',await evaluate(`(async()=>{const $=id=>document.getElementById(id);$('exportBtn').click();$('recordBtn').click();await new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(!$('videoDownload').hidden){clearInterval(timer);resolve();}else if(Date.now()-start>20000){clearInterval(timer);reject(Error('Export timeout'));}},100);});const v=document.createElement('video');v.src=$('videoDownload').href;await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=reject;});const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const g=c.getContext('2d');const sample=async time=>{v.currentTime=time;await new Promise(r=>v.onseeked=r);g.drawImage(v,0,0);return g.getImageData(0,0,c.width,c.height).data;};const first=await sample(.1),second=await sample(.6);let changes=0;for(let i=0;i<first.length;i+=4)if(Math.abs(first[i]-second[i])+Math.abs(first[i+1]-second[i+1])+Math.abs(first[i+2]-second[i+2])>30)changes++;if(changes<500)throw Error('Rain animation missing from export');return {dimensions:[c.width,c.height],animatedPixels:changes,bytes:(await fetch(v.src).then(r=>r.blob())).size};})()`));
 await evaluate(`document.getElementById('exportDialog').close();document.getElementById('removeRain').click();document.getElementById('undoBtn').click()`);await new Promise(r=>setTimeout(r,300));if(!await evaluate(`!document.getElementById('rainSettings').hidden`))throw Error('Rain delete Undo failed');
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
