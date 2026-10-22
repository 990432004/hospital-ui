// Read-only import from the original prototype; no patient data leaves this machine.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=path.resolve(__dirname,'../../decision-app');
const memory=new Map(); const ctx={console:{log(){}},localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)}};
ctx.window=ctx; vm.createContext(ctx);
const files=['data.js','alert-data.js','alert-warning.js','rule-workflows.js','decision-model.js'];
for(const file of files) vm.runInContext(fs.readFileSync(path.join(source,file),'utf8'),ctx,{filename:file});
const events=ctx.generateWarningEvents('all','all',[]);
const rules=ctx.SURGICAL_RISK_RULES.map(r=>({id:r.id,goal:r.workflow.goal,mode:r.workflow.mode,phase:r.workflow.phase,threshold:r.threshold,advice:r.advice}));
const surgeries=ctx.mockData.surgeries.map(({vitalSigns,...s})=>({...s,vitalSignsCount:vitalSigns?.length||0}));
const output={meta:{...ctx.mockData.meta,importedFrom:files,simulation:true},events,surgeries,roles:ctx.RuleWorkflows.roles,rules};
fs.writeFileSync(path.resolve(__dirname,'../src/data/seed.json'),JSON.stringify(output,null,2));
console.log(`Imported ${events.length} alerts, ${surgeries.length} surgeries; scenario ${output.meta.date}`);
