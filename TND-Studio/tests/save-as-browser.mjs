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






 console.log('SAVE_AS',await evaluate(`(async()=>{const $=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms));$('title').value='My chosen clip';$('title').dispatchEvent(new Event('input'));let calls=0,options,written,closed=false;window.showSaveFilePicker=async opts=>{calls++;options=opts;return {createWritable:async()=>({write:async blob=>{written=JSON.parse(await blob.text());},close:async()=>{await sleep(40);closed=true;},abort:async()=>{}})};};$('stageNewClip').click();$('nextClipTitle').value='Next blank clip';$('clipSaveNew').click();await sleep(800);if(calls!==1||options.suggestedName!=='My chosen clip.tnd.json'||written.title!=='My chosen clip'||!closed||$('title').value!=='Next blank clip')throw Error('Save As did not finish before switching');return {destinationPicker:true,editableProjectWritten:true,waitedForFileClose:true,newClipAfterSave:true};})()`));
 console.log('CANCEL_AND_FAILURE',await evaluate(`(async()=>{const $=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms));$('title').value='Keep this draft';$('title').dispatchEvent(new Event('input'));$('stageNewClip').click();$('nextClipTitle').value='Must not start';window.showSaveFilePicker=async()=>{throw new DOMException('User cancelled','AbortError');};$('clipSaveNew').click();await sleep(300);if(!$('clipDecision').open||$('title').value!=='Keep this draft'||!$('clipDecisionError').textContent.includes('cancelled'))throw Error('Cancel lost current clip');let aborted=false;window.showSaveFilePicker=async()=>({createWritable:async()=>({write:async()=>{throw Error('Disk full');},close:async()=>{},abort:async()=>{aborted=true;}})});$('clipSaveNew').click();await sleep(300);if(!aborted||!$('clipDecision').open||$('title').value!=='Keep this draft'||!$('clipDecisionError').textContent.includes('failed'))throw Error('Failed write lost clip');$('clipCancelNew').click();let saved=0;window.showSaveFilePicker=async()=>({createWritable:async()=>({write:async()=>{saved++;},close:async()=>{},abort:async()=>{}})});$('stageSaveClip').click();await sleep(500);if(saved!==1||$('title').value!=='Keep this draft')throw Error('Standalone save changed clip');return {pickerCancelKeepsWork:true,writeFailureKeepsWork:true,failedWriteAborted:true,standaloneSaveUsesPicker:true};})()`));
 await send('Browser.close');
}catch(e){console.error(e);process.exitCode=1;}finally{ws?.close();proc.kill();}
