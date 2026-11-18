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






 console.log('TRANSFORM_SETUP',await evaluate(`(async()=>{const $=id=>document.getElementById(id),p=await fetch('library/dhanuka-front-walk.tnd.json').then(r=>r.json());p.duration=1;p.cast[0].manualAnimation=true;p.cast[0].clips=[];p.cast[0].keys=[{...p.cast[0].keys[0],time:0,x:50,y:85,scale:1,view:'front',rotation:0}];const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(p)],'rig.tnd.json',{type:'application/json'}));$('projectInput').files=dt.files;$('projectInput').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,700));document.querySelector('[data-tool="pose"]').click();return true;})()`));
 let rect=await evaluate(`(()=>{const r=document.getElementById('stage').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};})()`);
 const mouse=async(type,u,v,extra={})=>send('Input.dispatchMouseEvent',{type,x:rect.x+rect.w*u,y:rect.y+rect.h*v,...extra},sessionId);
 const stroke=async(points,modifiers=0)=>{await mouse('mousePressed',...points[0],{button:'left',clickCount:1,modifiers});for(const p of points.slice(1))await mouse('mouseMoved',...p,{button:'left',buttons:1,modifiers});await mouse('mouseReleased',...points.at(-1),{button:'left',clickCount:1,modifiers});};
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const saved=()=>evaluate(`new Promise(resolve=>{const r=indexedDB.open('tnd-studio-local-v1');r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result);};})`);
 const initial=await saved();const corner=await evaluate(`(async()=>{const p=await fetch('library/dhanuka-front-walk.tnd.json').then(r=>r.json()),{manualPoseBounds,loadBellyRig}=await import('./belly-laugh.mjs'),{extractSprite}=await import('./sprites.mjs'),rig=await loadBellyRig(extractSprite),b=manualPoseBounds(rig,p.cast[0].keys[0].armPose),h=.59*.81,w=h*document.getElementById('stage').height/document.getElementById('stage').width*rig.closed.width/rig.closed.height;return [.5-w/2+b.left/rig.closed.width*w,.85-h+b.top/rig.closed.height*h];})()`);
 console.log('CORNER',corner);await stroke([corner,[.5+(corner[0]-.5)*1.2,.85+(corner[1]-.85)*1.2]]);await sleep(500);let data=await saved();if(Math.abs(data.cast[0].keys[0].scale-1.2)>.03)throw Error('Character scale handle failed '+data.cast[0].keys[0].scale);if(JSON.stringify(data.cast[0].keys[0].armPose)!==JSON.stringify(initial.cast[0].keys[0].armPose))throw Error('Scale changed limb rig');
 await evaluate(`document.getElementById('customActorControlPanel').open=true;document.getElementById('actorControlKind').value='left';document.getElementById('placeActorControl').click()`);await stroke([[.5,.65]]);await stroke([[.5,.65],[.52,.65]]);await sleep(500);data=await saved();if(data.cast[0].editorControls?.length!==1||data.cast[0].keys[0].armPose.leftX===initial.cast[0].keys[0].armPose.leftX||data.cast[0].keys[0].armPose.rightX!==initial.cast[0].keys[0].armPose.rightX)throw Error('Linked custom control failed');
 await evaluate(`document.getElementById('stageDraw').click();document.querySelector('[data-draw-tool="ellipse"]').click()`);rect=await evaluate(`(()=>{const r=document.getElementById('stage').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};})()`);await stroke([[.1,.1],[.3,.3]]);await evaluate(`document.querySelector('[data-draw-tool="select"]').click()`);await stroke([[.3,.3],[.4,.5]],8);await sleep(450);data=await saved();let o=data.drawings.at(-1),xs=o.points.map(p=>p[0]),ys=o.points.map(p=>p[1]);if(Math.abs((Math.max(...xs)-Math.min(...xs))/(Math.max(...ys)-Math.min(...ys))-1)>.02)throw Error('Shift proportional resize failed');
 const b={x:Math.min(...xs),y:Math.min(...ys),r:Math.max(...xs),b:Math.max(...ys)},cx=(b.x+b.r)/2,cy=(b.y+b.b)/2;await stroke([[b.r,b.b],[b.r+.03,b.b+.02]],1);await sleep(450);data=await saved();o=data.drawings.at(-1);xs=o.points.map(p=>p[0]);ys=o.points.map(p=>p[1]);if(Math.abs((Math.max(...xs)+Math.min(...xs))/2-cx)>.01||Math.abs((Math.max(...ys)+Math.min(...ys))/2-cy)>.01)throw Error('Alt center resize failed');
 const {validateProject}=await import('../core.mjs');validateProject(data);console.log('TRANSFORMS',{characterScale:true,originalLimbsPreserved:true,customHandControl:true,otherHandPreserved:true,shiftResize:true,altCenterResize:true,validSavedProject:true});
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
