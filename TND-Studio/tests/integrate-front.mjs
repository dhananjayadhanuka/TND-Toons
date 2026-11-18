// One-time development migration, guarded so unexpected source is not overwritten.
import fs from 'node:fs';
let app=fs.readFileSync('app.mjs','utf8');
const replacements=[
 ["sampleActor(a,time).view!=='side'","!assets.dhanuka.views?.[sampleActor(a,time).view]?.closedLaugh"],
 ["!assets.dhanuka.views?.side?.closedLaugh","!assets.dhanuka.views?.[sampleActor(a,time).view]?.closedLaugh"],
 ["Laugh: select Dhanuka, Side view and Original expression.","Laugh: choose Dhanuka Front, ¾ or Side and Original expression."],
 ["!['reference','side'].includes(sampleActor(a,time).view)","!(sampleActor(a,time).view==='reference'||assets.dhanuka.views?.[sampleActor(a,time).view]?.closedBlink)"],
 ["Blink is ready for Original and Side views.","Blink is available on views with visible eyes."],
 ["s.view!=='side';","!['front','threeQuarter','side'].includes(s.view);"],
 ["a.charId==='dhanuka'&&s.view==='side'?assets.dhanuka.views?.side?.[s.mouth+'Blink']","a.charId==='dhanuka'&&s.view!=='reference'?assets.dhanuka.views?.[s.view]?.[s.mouth+'Blink']"],
 ["s.view==='side'&&s.expression==='original'?laughAmount(a,at):0","s.view!=='reference'&&s.view!=='back'&&s.expression==='original'?laughAmount(a,at):0"],
 ["assets[a.charId].views?.side?.[s.mouth+'Laugh']","assets[a.charId].views?.[s.view]?.[s.mouth+'Laugh']"]
];
for(const [from,to]of replacements){if(!app.includes(from))throw Error('Missing migration target: '+from);app=app.replace(from,to);}
fs.writeFileSync('app.mjs',app);
let preview=fs.readFileSync('dhanuka-preview.mjs','utf8');preview=preview.replace("view!=='side'","view==='back'").replace("view==='side'?motionAt(actor,t)","view!=='back'?motionAt(actor,t)");fs.writeFileSync('dhanuka-preview.mjs',preview);
