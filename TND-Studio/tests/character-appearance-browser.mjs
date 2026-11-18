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






 console.log('APPEARANCE_UI',await evaluate(`(async()=>{const $=id=>document.getElementById(id),p=await fetch('library/dhanuka-front-walk.tnd.json').then(r=>r.json());p.duration=1;p.cast[0].keys=[{...p.cast[0].keys[0],time:0,x:50,view:'side',scale:1.4}];p.cast[0].clips=[{id:'walk',type:'walk',walkVariant:'inPlace',start:0,duration:1,loop:true}];const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(p)],'color.tnd.json',{type:'application/json'}));$('projectInput').files=dt.files;$('projectInput').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,700));const c=$('stage'),g=c.getContext('2d'),before=c.toDataURL();$('characterAppearance').open=true;$('characterSkinColor').value='#78b6df';$('characterSkinColor').dispatchEvent(new Event('change'));$('characterInkColor').value='#633326';$('characterInkColor').dispatchEvent(new Event('change'));if(c.toDataURL()===before)throw Error('Appearance not rendered');await new Promise(r=>setTimeout(r,500));const saved=await new Promise(resolve=>{const r=indexedDB.open('tnd-studio-local-v1');r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result);};});if(JSON.stringify(saved.cast[0].keys)!==JSON.stringify(p.cast[0].keys)||JSON.stringify(saved.cast[0].clips)!==JSON.stringify(p.cast[0].clips)||saved.cast[0].appearance.skin!=='#78b6df')throw Error('Color edit changed actions or did not save');const pixels=g.getImageData(0,0,c.width,c.height).data;let blue=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i+2]>pixels[i]+40&&pixels[i+1]>pixels[i]+20)blue++;if(blue<500)throw Error('Skin color missing');$('playBtn').click();await new Promise(r=>setTimeout(r,300));$('playBtn').click();$('drawingFrame').value=1;$('drawingFrame').dispatchEvent(new Event('change'));return {colorsChanged:true,keysUnchanged:true,actionsUnchanged:true,saved:true,bluePixels:blue};})()`));
 const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);await fs.writeFile(new URL('../character-colors-preview.png',import.meta.url),Buffer.from(shot.data,'base64'));
 console.log('COLORED_VIDEO',await evaluate(`(async()=>{const $=id=>document.getElementById(id);$('exportBtn').click();$('recordBtn').click();await new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(!$('videoDownload').hidden){clearInterval(timer);resolve();}else if(Date.now()-start>25000){clearInterval(timer);reject(Error('Export timeout'));}},100);});const v=document.createElement('video');v.src=$('videoDownload').href;await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=reject;});const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const g=c.getContext('2d');v.currentTime=.3;await new Promise(r=>v.onseeked=r);g.drawImage(v,0,0);const p=g.getImageData(0,0,c.width,c.height).data;let blue=0;for(let i=0;i<p.length;i+=4)if(p[i+2]>p[i]+40&&p[i+1]>p[i]+20)blue++;if(blue<500)throw Error('Colors missing from video: '+blue+' pixels, '+c.width+'x'+c.height);$('exportDialog').close();$('resetCharacterColors').click();await new Promise(r=>setTimeout(r,450));if(!$('characterAppearance').hidden&&$('characterSkinColor').value!=='#ffe09a')throw Error('Reset failed');return {dimensions:[c.width,c.height],colorsInVideo:true,resetOriginal:true};})()`));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
