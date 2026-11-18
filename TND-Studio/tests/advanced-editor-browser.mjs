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






 console.log('ADVANCED_SETUP',await evaluate(`(async()=>{const $=id=>document.getElementById(id),{freshProject}=await import('./core.mjs'),p=freshProject();p.duration=1;p.background='studio';const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(p)],'empty.tnd.json',{type:'application/json'}));$('projectInput').files=dt.files;$('projectInput').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,700));$('stageDraw').click();return {tools:!!$('editSettingsTab'),library:!!$('showItems')};})()`));
 let rect=await evaluate(`(()=>{const r=document.getElementById('stage').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};})()`);
 const mouse=async(type,u,v,extra={})=>send('Input.dispatchMouseEvent',{type,x:rect.x+rect.w*u,y:rect.y+rect.h*v,...extra},sessionId);
 const stroke=async(points,modifiers=0)=>{await mouse('mousePressed',...points[0],{button:'left',clickCount:1,modifiers});for(const p of points.slice(1))await mouse('mouseMoved',...p,{button:'left',buttons:1,modifiers});await mouse('mouseReleased',...points.at(-1),{button:'left',clickCount:1,modifiers});};
 const key=async(k,ctrl=false,shift=false)=>evaluate(`document.dispatchEvent(new KeyboardEvent('keydown',{key:${JSON.stringify(k)},ctrlKey:${ctrl},shiftKey:${shift},bubbles:true,cancelable:true}))`);
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const saved=()=>evaluate(`new Promise(resolve=>{const r=indexedDB.open('tnd-studio-local-v1');r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result);};})`);
 await evaluate(`document.querySelector('[data-draw-tool="rect"]').click()`);await stroke([[.2,.2],[.4,.4]]);await evaluate(`document.querySelector('[data-draw-tool="ellipse"]').click()`);await stroke([[.6,.2],[.8,.4]]);await key('v');await key('a',true);await key('c',true);await key('v',true);await sleep(500);if((await saved()).drawings.length!==4)throw Error('Copy/Paste failed');await key('x',true);await sleep(450);if((await saved()).drawings.length!==2)throw Error('Cut failed');await key('v',true);await sleep(450);await key('z',true);await sleep(450);if((await saved()).drawings.length!==2)throw Error('Undo failed');await key('y',true);await sleep(450);if((await saved()).drawings.length!==4)throw Error('Redo failed');
 await key('a',true);await key('g',true);await sleep(450);let data=await saved();if(!data.drawingGroups?.length)throw Error('Group failed');await key('g',true,true);await sleep(450);data=await saved();if(data.drawings.some(o=>o.groupId))throw Error('Ungroup failed');
 await evaluate(`document.getElementById('editSettingsTab').click();document.getElementById('editDrawingPoints').click()`);await key('a',true);await evaluate(`document.getElementById('addBendControl').click()`);await stroke([[.3,.3]]);await evaluate(`document.getElementById('drawingFrame').value=25;document.getElementById('drawingFrame').dispatchEvent(new Event('change'))`);await stroke([[.3,.3],[.34,.35]]);await sleep(450);data=await saved();if(!data.drawings.every(o=>o.controls?.length)||!data.drawings.some(o=>o.controls[0].keys.length===2))throw Error('Bend controls did not animate');
 await evaluate(`document.getElementById('paintSettingsTab').click();document.getElementById('drawOpacity').value=40;document.getElementById('drawOpacity').dispatchEvent(new Event('change'))`);await sleep(450);data=await saved();if(data.drawings.some(o=>o.opacity!==.4))throw Error('Multi opacity failed');
 await evaluate(`document.getElementById('editSettingsTab').click();document.getElementById('saveLibraryItem').click();document.getElementById('newItemName').value='My reusable drawing';document.getElementById('confirmSaveItem').click()`);await sleep(500);await evaluate(`document.getElementById('showItems').click();document.getElementById('itemCategory').value='My items';document.getElementById('itemCategory').dispatchEvent(new Event('change'))`);if(!await evaluate(`document.getElementById('editableItemGrid').textContent.includes('My reusable drawing')`))throw Error('My item save failed');
 console.log('SHORTCUTS_CONTROLS_LIBRARY',{clipboard:true,cut:true,undoRedo:true,groupUngroup:true,bendKeys:true,multiOpacity:true,savedCustomItem:true});
 await evaluate(`document.getElementById('stageNewClip').click();document.getElementById('nextClipTitle').value='Clean new clip';document.getElementById('clipDiscardNew').click()`);await sleep(500);await key('z',true);await sleep(200);data=await saved();if(data.cast.length||data.drawings?.length||data.title!=='Clean new clip')throw Error('Old clip leaked through Undo');if(!await evaluate(`document.getElementById('undoBtn').disabled&&document.getElementById('redoBtn').disabled`))throw Error('History not reset');
 await evaluate(`document.getElementById('showItems').click();document.getElementById('itemCategory').value='Animals';document.getElementById('itemCategory').dispatchEvent(new Event('change'));[...document.querySelectorAll('#editableItemGrid button')].find(b=>b.textContent==='Cat').click()`);await sleep(500);data=await saved();const {validateProject}=await import('../core.mjs');validateProject(data);if(!data.drawings.length||data.drawingGroups.length<4)throw Error('Editable cat not inserted');await key('d',true);await sleep(500);const copy=await saved();validateProject(copy);if(copy.drawings.length!==data.drawings.length*2)throw Error('Duplicate animal failed');
 await evaluate(`document.getElementById('itemCategory').value='City';document.getElementById('itemCategory').dispatchEvent(new Event('change'))`);const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);await fs.writeFile(new URL('../advanced-editor-preview.png',import.meta.url),Buffer.from(shot.data,'base64'));
 console.log('NEW_CLIP_AND_EDITABLE_ANIMALS',{historyIsolated:true,catHasEditableParts:true,duplicatePreservesRig:true});
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
