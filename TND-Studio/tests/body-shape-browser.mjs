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




 const sheet=await evaluate(`(async()=>{const {loadBellyRig,drawManualPose}=await import('./belly-laugh.mjs'),{extractSprite}=await import('./sprites.mjs');const rig=await loadBellyRig(extractSprite);const check=document.createElement('canvas');check.width=1100;check.height=1200;const cg=check.getContext('2d');cg.translate(240+rig.origin.x,100+rig.origin.y);drawManualPose(cg,rig,{leftX:-100,leftY:-70,rightX:100,rightY:-70,leftFootX:0,leftFootY:0,rightFootX:0,rightFootY:0});const original=rig.closed.getContext('2d').getImageData(0,0,rig.closed.width,430-rig.origin.y).data,actual=cg.getImageData(240+rig.origin.x,100+rig.origin.y,rig.closed.width,430-rig.origin.y).data;let mismatch=0,checked=0;for(let i=0;i<original.length;i+=4)if(original[i+3]===255){checked++;if(Math.abs(original[i]-actual[i])>2||Math.abs(original[i+1]-actual[i+1])>2||Math.abs(original[i+2]-actual[i+2])>2)mismatch++;}if(mismatch)throw Error('Head alignment differs from approved art: '+mismatch+'/'+checked);const c=document.createElement('canvas');c.width=1500;c.height=1000;const g=c.getContext('2d');g.fillStyle='#f0e9da';g.fillRect(0,0,c.width,c.height);const poses=[{headTilt:0,bodyLean:0},{headTilt:30,bodyLean:25},{headTilt:-30,bodyLean:-25},{headTilt:30,bodyLean:-25},{headTilt:-30,bodyLean:25},{headTilt:35,bodyLean:35}];for(let i=0;i<poses.length;i++){const p={leftX:-100,leftY:-70,rightX:100,rightY:-70,leftFootX:-40,leftFootY:0,rightFootX:40,rightFootY:0,...poses[i]};g.save();g.translate(i%3*500+100,Math.floor(i/3)*500+15);g.scale(.58,.58);drawManualPose(g,rig,p);g.restore();g.fillStyle='#24301f';g.font='18px Segoe UI';g.fillText('Head '+p.headTilt+'° / Body '+p.bodyLean+'°',i%3*500+100,Math.floor(i/3)*500+480);}return {png:c.toDataURL('image/png').split(',')[1]};})()`);await fs.writeFile(new URL('../body-shape-review.png',import.meta.url),Buffer.from(sheet.png,'base64'));console.log('POSE_SHEET saved; head artwork pixel alignment passed');
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
