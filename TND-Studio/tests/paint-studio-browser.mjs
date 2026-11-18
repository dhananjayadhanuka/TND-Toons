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






 console.log('PAINT_PIXEL_CHECKS',await evaluate(`(async()=>{const {drawObjects,validateDrawings}=await import('./drawings.mjs');const c=document.createElement('canvas');c.width=800;c.height=500;const g=c.getContext('2d');const object=(id,type,points,extra={})=>({id,type,points,color:'#ff0000',fill:null,width:.04,layer:'front',...extra});const rect=object('box','rect',[[.1,.1],[.9,.9]],{fill:'#ff0000'}),eraser=object('erase','eraser',[[.5,.3],[.5,.7]],{width:.1});g.fillStyle='#00ff00';g.fillRect(0,0,800,500);drawObjects(g,[rect,eraser],'front');const erased=[...g.getImageData(400,250,1,1).data];if(erased[0]!==0||erased[1]!==255)throw Error('Eraser damaged background or did not erase');const types=['pen','brush','marker','spray','line','curve','ellipse','triangle','diamond','star','text'];for(const type of types){const o=object(type,type,[[.2,.2],[.8,.7]],{text:'Hello'});if(type==='curve')o.points.push([.5,.05]);validateDrawings([o]);g.clearRect(0,0,800,500);drawObjects(g,[o],'front');const data=g.getImageData(0,0,800,500).data;let ink=0;for(let i=3;i<data.length;i+=4)if(data[i])ink++;if(ink<10)throw Error(type+' did not render');}return {eraserPreservesBackground:true,rendered:types};})()`));
 console.log('LOAD',await evaluate(`(async()=>{const $=id=>document.getElementById(id),p=await fetch('library/dhanuka-front-walk.tnd.json').then(r=>r.json());p.duration=1;p.drawings=[];p.cast[0].clips=[];p.cast[0].keys=[p.cast[0].keys[0]];const dt=new DataTransfer();dt.items.add(new File([JSON.stringify(p)],'paint.tnd.json',{type:'application/json'}));$('projectInput').files=dt.files;$('projectInput').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,1000));$('stageDraw').click();if(document.querySelectorAll('[data-draw-tool]').length!==16||$('paintRibbon').hidden)throw Error('Paint toolbar missing');return true;})()`));
 const rect=await evaluate(`(()=>{const r=document.getElementById('stage').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};})()`);
 const mouse=async(type,u,v,extra={})=>send('Input.dispatchMouseEvent',{type,x:rect.x+rect.w*u,y:rect.y+rect.h*v,...extra},sessionId);
 const stroke=async(tool,points)=>{await evaluate('document.querySelector(\'[data-draw-tool="'+tool+'"]\').click()');await mouse('mousePressed',...points[0],{button:'left',clickCount:1});for(const p of points.slice(1))await mouse('mouseMoved',...p,{button:'left',buttons:1});await mouse('mouseReleased',...points.at(-1),{button:'left',clickCount:1});};
 await stroke('curve',[[.1,.1],[.4,.3]]);await mouse('mousePressed',.25,.05,{button:'left',clickCount:1});await mouse('mouseMoved',.27,.08,{button:'left',buttons:1});await mouse('mouseReleased',.27,.08,{button:'left',clickCount:1});
 await stroke('brush',[[.1,.6],[.2,.5],[.25,.6]]);await stroke('eraser',[[.2,.5],[.2,.65]]);await stroke('triangle',[[.6,.1],[.8,.35]]);
 await evaluate(`document.querySelector('[data-draw-tool="fill"]').click();document.getElementById('drawFill').value='#42a5f5'`);await mouse('mousePressed',.7,.25,{button:'left',clickCount:1});await mouse('mouseReleased',.7,.25,{button:'left',clickCount:1});
 await evaluate(`document.querySelector('[data-draw-tool="select"]').click()`);await mouse('mousePressed',.7,.25,{button:'left',clickCount:1});await mouse('mouseReleased',.7,.25,{button:'left',clickCount:1});await evaluate(`document.getElementById('drawDuplicate').click();document.getElementById('drawLarger').click();document.getElementById('drawFlip').click();document.getElementById('drawFocus').click()`);
 console.log('PAINT_UI',await evaluate(`(async()=>{await new Promise(r=>setTimeout(r,1000));const p=await new Promise(resolve=>{const r=indexedDB.open('tnd-studio-local-v1');r.onsuccess=()=>{const q=r.result.transaction('projects').objectStore('projects').get('current');q.onsuccess=()=>resolve(q.result);};});const {validateProject}=await import('./core.mjs');validateProject(p);if(p.drawings.length!==5||p.drawings[0].points.length!==3||Math.abs(p.drawings[0].points[2][1]-.08)>.01||p.drawings[3].fill!=='#42a5f5')throw Error('Curve/fill/duplicate persistence failed');if(p.cast[0].keys.length!==1)throw Error('Character changed');if(Number(document.querySelector('.canvas-frame').dataset.previewZoom)<=1)throw Error('Focus did not zoom');document.getElementById('fitStage').click();return {curveBend:true,brush:true,eraser:true,fill:true,duplicate:true,resize:true,flip:true,focus:true,saved:true};})()`));
 const shot=await send('Page.captureScreenshot',{format:'png'},sessionId);await fs.writeFile(new URL('../paint-studio-preview.png',import.meta.url),Buffer.from(shot.data,'base64'));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
