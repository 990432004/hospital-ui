const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../../decision-app');
const context={console:{log(){}}};context.window=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),context);
require('./align-e3-scenario.cjs').alignScenario(context.mockData);
vm.runInContext(fs.readFileSync(path.join(root,'mdt-module.js'),'utf8'),context);
context.mockData.meta.mdtSummary=context.getMDTStats('today','all');
fs.mkdirSync(path.resolve(__dirname,'../public/data'),{recursive:true});
fs.writeFileSync(path.resolve(__dirname,'../public/data/scenario.json'),JSON.stringify(context.mockData));
let code='// Generated from the original pure data definitions; DOM controllers are not imported.\n// Regenerate with node scripts/import-domain.cjs. No user-supplied code is executed.\nexport function createDomain({scenario,storage,manual}) {\nconst window={mockData:scenario}; const mockData=scenario; const localStorage=storage;\nlet RuleWorkflows,DecisionConfig,riskParameter; const ManualReporting=manual;\n';
for(const name of ['alert-data.js','alert-warning.js','rule-workflows.js','decision-model.js','data-source-model.js']) {
 code+='\n// Source: decision-app/'+name+'\n'+fs.readFileSync(path.join(root,name),'utf8').replace(/^\uFEFF/,'');
 if(name==='rule-workflows.js')code+='\nRuleWorkflows=window.RuleWorkflows;\n';
 if(name==='decision-model.js')code+='\nDecisionConfig=window.DecisionConfig; riskParameter=window.riskParameter;\n';
}
code+='\nreturn {scenario,rules:SURGICAL_RISK_RULES,metrics:INDICATOR_DEFS,workflows:RuleWorkflows,config:DecisionConfig,sources:window.SourceData,departments:DEPT_GROUPS,surgeryTypes:SURGERY_TYPES,categories:INDICATOR_CATEGORY_LABELS,goals:DECISION_GOALS,goalForCategory:getDecisionGoalKey,buildIndicators,dateRange:getScenarioDateRange,generateAlerts:()=>generateWarningEvents("all","all",[]),metricCode:()=>buildIndicators.toString()};\n}\n';
fs.writeFileSync(path.resolve(__dirname,'../src/domain/prototype-engine.js'),code);
console.log('Imported complete scenario and scoped pure domain engine');
