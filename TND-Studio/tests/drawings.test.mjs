import test from 'node:test';
import assert from 'node:assert/strict';
import {drawingBounds,hitDrawing,validateDrawings} from '../drawings.mjs';
import {freshProject,validateProject} from '../core.mjs';
const shape=(id,type,layer,points)=>({id,type,layer,points,color:'#ff0000',fill:type==='pen'||type==='line'?null:'#00ff00',width:.005});
test('drawing objects survive project roundtrip without changing characters',()=>{const p=freshProject();p.drawings=[shape('box','rect','back',[[.1,.2],[.3,.4]]),shape('oval','ellipse','front',[[.5,.2],[.7,.4]]),shape('ink','pen','front',[[.1,.1],[.2,.2],[.3,.2]])];assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))),p);assert.deepEqual(drawingBounds(p.drawings[0]),{x:.1,y:.2,right:.3,bottom:.4});});
test('selection respects front/back layer and freehand line proximity',()=>{const back=shape('b','rect','back',[[0,0],[1,1]]),front=shape('f','ellipse','front',[[.2,.2],[.5,.5]]),line=shape('l','pen','front',[[.1,.8],[.6,.8]]);assert.equal(hitDrawing([front,back],[.3,.3]).id,'f');assert.equal(hitDrawing([back,line],[.4,.8]).id,'l');assert.equal(hitDrawing([line],[.4,.2]),null);});
test('malformed or oversized drawing data is rejected; old projects remain valid',()=>{assert.doesNotThrow(()=>validateDrawings(undefined));const a=shape('a','rect','front',[[.1,.1],[.2,.2]]);assert.throws(()=>validateDrawings([a,a]));assert.throws(()=>validateDrawings([{...a,color:'red'}]));assert.throws(()=>validateDrawings([{...a,points:[[NaN,0],[1,1]]}]));assert.throws(()=>validateDrawings([{...a,width:Infinity}]));});
