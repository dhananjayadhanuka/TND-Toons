import fs from 'node:fs';import {freshProject,createActor,putKey,validateProject} from '../core.mjs';
const p=freshProject();p.title='Dhanuka actions - three views';p.duration=38;p.background='studio';
const a=createActor('dhanuka');putKey(a,0,{x:50,scale:1.15,view:'front',mouth:'closed'});
for(const [i,view]of ['front','threeQuarter','side'].entries()){
 putKey(a,i*12,{view,mouth:'closed'});
 for(const [j,type]of ['blink','smile','laugh','angry','lookLeft','lookRight'].entries())a.clips.push({id:view+'-'+type,type,start:i*12+j*2,duration:2});
}
putKey(a,36,{view:'back'});p.cast=[a];validateProject(p);
fs.writeFileSync('library/dhanuka-all-actions.tnd.json',JSON.stringify(p,null,2));
