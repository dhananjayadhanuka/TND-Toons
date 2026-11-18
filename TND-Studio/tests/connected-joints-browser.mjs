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






 console.log('CONNECTED_JOINTS',await evaluate(`(async()=>{const {loadBellyRig,drawManualPose,manualArms,manualLegs,poseBodyPoint}=await import('./belly-laugh.mjs'),{loadDhanukaViews}=await import('./dhanuka-views.mjs'),{extractSprite}=await import('./sprites.mjs');const rig=await loadBellyRig(extractSprite);rig.viewLibraries=await loadDhanukaViews(extractSprite);rig.faceLibrary=rig.viewLibraries.front;const c=document.createElement('canvas');c.width=c.height=1240;const g=c.getContext('2d');let samples=0;for(const view of ['front','threeQuarter','side','back'])for(const lean of [-30,0,30])for(const tilt of [-25,0,25]){const pose={rigView:view,leftX:-20,leftY:20,rightX:30,rightY:10,leftFootX:0,leftFootY:-40,rightFootX:0,rightFootY:-20,bodyLean:lean,headTilt:tilt};g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,1240,1240);g.translate(240+rig.origin.x,150+rig.origin.y);drawManualPose(g,rig,pose);const points=[...manualArms(pose).flatMap(a=>[poseBodyPoint(a.shoulder,pose),poseBodyPoint(a.hand,pose)]),...manualLegs(pose).map(a=>a.hip)];for(const p of points){const alpha=g.getImageData(Math.round(240+p.x),Math.round(150+p.y),1,1).data[3];if(alpha<240)throw Error('Joint gap: '+JSON.stringify({view,lean,tilt,p,alpha}));samples++;}}return {poses:36,opaqueJointSamples:samples};})()`));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
