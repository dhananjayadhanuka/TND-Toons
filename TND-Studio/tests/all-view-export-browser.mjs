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






 console.log('ALL_VIEW_EXPORT',await evaluate(`(async()=>{const $=id=>document.getElementById(id),p=await fetch('library/dhanuka-front-walk.tnd.json').then(r=>r.json()),base=p.cast[0].keys[0];p.duration=4;p.previewLoop=false;p.cast[0].keys=['front','threeQuarter','side','back'].map((view,time)=>({...base,time,view,x:50,y:85,scale:1.4,armPose:{leftX:0,leftY:0,rightX:0,rightY:0,leftFootX:0,leftFootY:0,rightFootX:0,rightFootY:0,headTilt:10,bodyLean:-8,facePreset:'happy',faceStrength:1}}));p.cast[0].clips=[{id:'walk',type:'walk',start:0,duration:4,loop:true,approach:false,walkVariant:'inPlace'}];const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(p)],'views.tnd.json',{type:'application/json'}));$('projectInput').files=dt.files;$('projectInput').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,1200));$('exportBtn').click();$('fps').value='24';$('recordBtn').click();await new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(!$('videoDownload').hidden){clearInterval(timer);resolve();}else if(Date.now()-start>20000){clearInterval(timer);reject(Error('Export timeout: '+$('toast').textContent));}},100);});const blob=await fetch($('videoDownload').href).then(r=>r.blob());if(blob.size<5000)throw Error('Empty/small video');const video=document.createElement('video');video.src=$('videoDownload').href;await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(Error('Decode failed'));});if(video.videoWidth!==1280||video.videoHeight!==720)throw Error('Wrong output dimensions');return {bytes:blob.size,type:blob.type,width:video.videoWidth,height:video.videoHeight,views:4};})()`));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
