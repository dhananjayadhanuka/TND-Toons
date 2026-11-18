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






 console.log('SIDE_WALK_UI',await evaluate(`(async()=>{const $=id=>document.getElementById(id),p=await fetch('library/dhanuka-front-walk.tnd.json').then(r=>r.json());p.duration=4;p.background='studio';p.cast[0].keys=[{...p.cast[0].keys[0],time:0,x:25,y:85,view:'side',scale:1.4,flip:false}];p.cast[0].clips=[];const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(p)],'sidewalk.tnd.json',{type:'application/json'}));$('projectInput').files=dt.files;$('projectInput').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,800));document.querySelector('[data-tool="actions"]').click();const button=document.querySelector('[data-walk-variant="forward"]');if(!button||button.disabled)throw Error('Forward choice absent for side');button.click();$('playBtn').click();await new Promise(r=>setTimeout(r,500));const saved=await new Promise(resolve=>{const r=indexedDB.open('tnd-studio-local-v1');r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result);};});const {validateProject}=await import('./core.mjs');validateProject(saved);if(saved.cast[0].clips[0].walkVariant!=='forward'||saved.cast[0].keys[0].view!=='side')throw Error('Walk selection not saved');return {sideForwardAvailable:true,saved:true};})()`));
 const sheet=await evaluate(`(()=>{const $=id=>document.getElementById(id),c=$('stage'),sheet=document.createElement('canvas');sheet.width=1440;sheet.height=500;const g=sheet.getContext('2d');g.fillStyle='#ebeee5';g.fillRect(0,0,1440,500);for(let i=0;i<6;i++){$('drawingFrame').value=1+i*4;$('drawingFrame').dispatchEvent(new Event('change'));g.drawImage(c,270,80,720,930,i*240,30,240,460);g.fillStyle='#26333d';g.font='14px sans-serif';g.fillText('Frame '+(1+i*4),i*240+12,20);}return sheet.toDataURL('image/png').split(',')[1];})()`);await fs.writeFile(new URL('../side-forward-walk-preview.png',import.meta.url),Buffer.from(sheet,'base64'));
 console.log('SIDE_WALK_EXPORT',await evaluate(`(async()=>{const $=id=>document.getElementById(id);$('exportBtn').click();$('recordBtn').click();await new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{if(!$('videoDownload').hidden){clearInterval(timer);resolve();}else if(Date.now()-start>25000){clearInterval(timer);reject(Error('Export timeout'));}},100);});const v=document.createElement('video');v.src=$('videoDownload').href;await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=reject;});const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const g=c.getContext('2d'),center=async time=>{v.currentTime=time;await new Promise(r=>v.onseeked=r);g.drawImage(v,0,0);const image=g.getImageData(0,Math.round(c.height*.2),c.width,Math.round(c.height*.7));let n=0,sum=0;for(let i=0;i<image.data.length;i+=4)if(image.data[i]<65&&image.data[i+1]<65&&image.data[i+2]<65){sum+=(i/4)%c.width;n++;}if(n<100)throw Error('Character missing');return sum/n;};const first=await center(.2),later=await center(2.2);if(later-first<80)throw Error('Video did not travel forwards: '+JSON.stringify({first,later}));return {dimensions:[v.videoWidth,v.videoHeight],forwardPixelTravel:Math.round(later-first),bytes:(await fetch(v.src).then(r=>r.blob())).size};})()`));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
