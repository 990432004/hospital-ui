// Pure subject definitions and simulation logic adapted from decision-app-1.
export function createMetricSubjects(domain) {
const mockData=domain.scenario, INDICATOR_DEFS=domain.metrics, window={};
let MetricSubjects,MetricSubjectDemo;
const buildIndicators=domain.buildIndicators;
function determineStatus(def,v){const saved=domain.config.get('metric',def.id)?.thresholds;const thresholds=def.thresholds?.map((t,i)=>({...t,value:saved?.[i]??t.value}));for(const level of ['danger','warning']){const t=thresholds?.find(t=>t.level===level);if(t&&(t.direction==='below'?v<=t.value:v>=t.value))return level}return 'normal'}
const subjects={hospital:{name:'全院管理',note:'全院综合治理指标，不按单一医疗组或资源归属'},team:{name:'医疗组',note:'以手术病例及其医疗组归属统计，保留原有病例筛选'},nursing:{name:'护理人员',note:'按实际护理参与记录与人员编码统计；参与台次去重，人次按护士与手术去重，不以手术时长代替护理工时'},room:{name:'手术室',note:'按手术间统计；接台关系在完整手术序列中识别'},pacu:{name:'复苏室',note:'按复苏室与床位统计，停留时长仅纳入已离室记录'},equipment:{name:'设备',note:'按设备类型及实例统计，实际利用率需要可用时段台账'},supply:{name:'器械供应',note:'按器械包统计，周转需要回收与灭菌完成时间'}};
const owners={'or-utilization':'room','first-case-punctuality':'room','turnover-time':'room','instruments-turnover':'supply','resource-conflict-index':'hospital','surgery-catalog-coverage':'hospital','mdt-participation-rate':'hospital'};
const extra=[{id:'pacu-stay',subject:'pacu',name:'平均复苏停留时长',unit:'min',desc:'已离室患者的复苏停留总时长 / 已离室人数'},{id:'pacu-utilization',subject:'pacu',name:'复苏床位利用率',unit:'%',desc:'实际床位占用时长 / 床位可用时长'},{id:'equipment-use',subject:'equipment',name:'设备实际利用率',unit:'%',desc:'实际占用时长 / 设备可用时长'},{id:'equipment-idle',subject:'equipment',name:'设备闲置率',unit:'%',desc:'可用且空闲时长 / 设备可用时长，故障及维护不计为闲置'},{id:'equipment-turnover',subject:'equipment',name:'设备周转频次',unit:'台/设备日',desc:'完成使用台次 / 可用设备日'}];
extra.push(
 {id:'nursing-cases',subject:'nursing',name:'护理参与手术台次',unit:'台',desc:'所选护理人员已记录的实际参与手术去重数；多人参与同台只计一台'},
 {id:'nursing-participations',subject:'nursing',name:'护理参与人次',unit:'人次',desc:'按护士编码＋手术编码去重；同人同台多岗位或多次交接不重复计人次'},
 {id:'nursing-hours',subject:'nursing',name:'实际护理参与时长',unit:'h',desc:'按护士合并实际入离室时间区间后求和；进行中截断至统计时点，不使用手术时长代替'},
 {id:'nursing-handovers',subject:'nursing',name:'护理交接次数',unit:'次',desc:'按交接记录ID去重，仅统计交接双方可通过人员编码确认的护理记录'},
 {id:'nursing-checks',subject:'nursing',name:'本人核查签署完成率',unit:'%',desc:'本人已完成签署任务数 / 本人应签署任务数，需责任人编码与任务清单'},
 {id:'nursing-counts',subject:'nursing',name:'器械清点一致率',unit:'%',desc:'所选护士已执行且结果一致的清点记录数 / 所选护士有结果的清点记录数；未执行任务不进入分母'},
 {id:'nursing-pacu',subject:'nursing',name:'复苏护理人次',unit:'人次',desc:'按责任护士编码＋复苏记录ID去重，需复苏护理责任分配记录'}
);
function nurses(){
 const map=new Map();
 for(const [rows,role] of [[mockData.circulatingNurses,'巡回护士'],[mockData.scrubNurses,'器械护士']])for(const n of rows||[])map.set(n.id,{id:n.id,name:n.name+' · '+n.id,category:role,unit:n.nursingUnit||'未维护护理单元'});
 for(const n of window.ClinicalData?.rows('STAFF_DICT')||[])if(/护士|护理/.test(n.ROLE||'')&&!map.has(n.STAFF_CODE))map.set(n.STAFF_CODE,{id:n.STAFF_CODE,name:n.STAFF_NAME+' · '+n.STAFF_CODE,category:/洗手|器械/.test(n.ROLE)?'器械护士':/复苏|恢复/.test(n.ROLE)?'复苏护士':n.ROLE,unit:'未维护护理单元'});
 return window.MetricSubjectDemo?MetricSubjectDemo.nurses([...map.values()]):[...map.values()];
}
function nursingValue(id,f,chosen){
 const missing=reason=>({value:null,count:0,status:'unsupported',reason});
 if(f.shift&&f.shift!=='all')return missing('缺少护士排班与班次归属记录，不能按操作时间推定班次');
 const ids=new Set(chosen.map(n=>n.id)),roles={'巡回护士':'巡回','器械护士':'洗手'},asOf=Date.parse(mockData.meta.asOf),rows=window.ClinicalData?.rows('SURG_STAFF')||[];
 const cases=new Map((window.ClinicalData?.rows('SURG_RECORD')||[]).map(r=>[r.SURG_ID,r]));
 const records=rows.filter(r=>{const time=r.JOIN_TIME||cases.get(r.SURG_ID)?.CUT_TIME;return time&&time.slice(0,10)===f.start&&Date.parse(time)<=asOf;}).filter(r=>ids.has(r.STAFF_CODE)&&['巡回','洗手','器械','复苏','病房'].includes(r.ROLE)&&(f.category==='all'||r.ROLE===roles[f.category]||r.ROLE===f.category.replace('护士','')));
 const result=(v,count,reason)=>({value:v,count,status:'normal',reason:'演示记录 · '+reason});
 if(id==='nursing-cases'||id==='nursing-participations'){
  if(!records.length)return missing('没有可关联到所选护士的实际手术参与记录');
  const n=new Set(records.map(r=>id==='nursing-cases'?r.SURG_ID:JSON.stringify([r.STAFF_CODE,r.SURG_ID]))).size;
  return result(n,records.length,'仅统计已记录参与；台次按手术去重，人次按护士＋手术去重');
 }
 if(id==='nursing-hours'){
  if(!records.length||records.some(r=>!r.JOIN_TIME))return missing('缺少实际入室时间，不能用排程或手术时间替代护理工时');
  const intervals=new Map();
  for(const r of records){if(!r.LEAVE_TIME&&cases.get(r.SURG_ID)?.CLOSE_TIME)return missing('已结束手术缺少护士实际离室时间，不能推算护理工时');const a=Date.parse(r.JOIN_TIME),b=r.LEAVE_TIME?Date.parse(r.LEAVE_TIME):asOf;if(!Number.isFinite(a)||!Number.isFinite(b)||b<a)return missing('护理参与时间记录无效');if(a>asOf)continue;if(!intervals.has(r.STAFF_CODE))intervals.set(r.STAFF_CODE,[]);intervals.get(r.STAFF_CODE).push([a,Math.min(b,asOf)]);}
  let total=0;for(const list of intervals.values()){list.sort((a,b)=>a[0]-b[0]);let end=-Infinity;for(const [a,b] of list){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}}
  return result(Math.round(total/3600000*10)/10,records.length,'按护士合并重叠时间；进行中截至统计时点');
 }
 if(id==='nursing-counts'){
  const rows=(window.ClinicalData?.rows('INSTRUMENT_COUNT')||[]).filter(r=>ids.has(r.COUNT_STAFF)&&r.COUNT_TIME&&r.COUNT_TIME.slice(0,10)===f.start&&Date.parse(r.COUNT_TIME)<=asOf&&[0,1].includes(r.RESULT));
  if(!rows.length)return missing('缺少关联护士编码的已执行器械清点结果');
  return result(Math.round(rows.filter(r=>r.RESULT===1).length/rows.length*1000)/10,rows.length,rows.length+' 条已执行清点记录，不代表应执行任务完成率');
 }
 return missing(id==='nursing-handovers'?'交接记录只有姓名或角色，缺少双方人员编码，不能可靠归属个人':id==='nursing-checks'?'缺少本人应签署任务清单与责任护士编码':'缺少复苏护理责任护士与复苏记录的关联');
}

const owner=id=>owners[id]||extra.find(d=>d.id===id)?.subject||'team';
const definitions=key=>[...INDICATOR_DEFS,...extra].filter(d=>owner(d.id)===key);
const states=Object.fromEntries(Object.keys(subjects).map(k=>[k,{start:mockData.meta.date,end:mockData.meta.date,category:'all',entity:'all',status:'all',search:'',unit:'all',shift:'all'}]));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function entities(key){if(key==='nursing')return nurses();if(key==='hospital')return [{id:'hospital',name:'全院',category:'全院'}];return (key==='room'?mockData.operatingRooms:key==='pacu'?mockData.pacuBeds:key==='equipment'?mockData.equipment:mockData.instrumentSets).map(r=>({id:r.id,name:r.roomNo||r.fullName||r.name||r.setName||r.id,category:key==='room'?(r.roomType||r.cleanLevel||'未分类'):key==='pacu'?r.pacuRoomNo:key==='equipment'?r.type:(r.type||'器械包')}));}
function selection(key,f){return entities(key).filter(e=>(f.category==='all'||e.category===f.category)&&(f.entity==='all'||e.id===f.entity)&&(key!=='nursing'||!f.unit||f.unit==='all'||e.unit===f.unit));}
function minute(v){if(!v)return null;const match=String(v).match(/(?:T|\s|^)(\d{2}):(\d{2})/);return match?Number(match[1])*60+Number(match[2]):null;}
function value(id,f){
 const key=owner(id),chosen=selection(key,f),ids=new Set(chosen.map(e=>e.id));
 const unavailable=reason=>({value:null,reason,status:'unsupported',count:0});
 if(!chosen.length)return unavailable('当前筛选下没有主体对象');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(f.start)||!/^\d{4}-\d{2}-\d{2}$/.test(f.end))return unavailable('请选择完整的开始与结束日期');
 if(f.start>f.end)return unavailable('开始日期不能晚于结束日期');
 if(window.MetricSubjectDemo)return MetricSubjectDemo.value(id,f,chosen);
 if(f.start!==mockData.meta.date||f.end!==mockData.meta.date)return unavailable('当前资源明细仅覆盖 '+mockData.meta.date+'，所选范围数据不完整');
 if(key==='nursing')return nursingValue(id,f,chosen);
 if(key==='hospital'){const metric=buildIndicators('all',[],'custom:'+f.start+':'+f.end,{category:'all',subTypes:[]},{levels:[]}).find(d=>d.id===id);return {value:metric?.value??null,status:metric?.status||'unsupported',count:0,reason:'全院范围 · 沿用现有演示统计口径'};}
 const asOf=minute(mockData.meta.asOf),surgeries=mockData.surgeries.filter(s=>s.status!=='取消');
 let samples=[];
 if(id==='turnover-time'){
  for(const room of chosen){const sequence=surgeries.filter(s=>s.operatingRoomId===room.id&&minute(s.transferInTime)!==null&&minute(s.transferInTime)<=asOf).sort((a,b)=>minute(a.transferInTime)-minute(b.transferInTime));for(let i=1;i<sequence.length;i++){const prev=minute(sequence[i-1].transferOutTime),next=minute(sequence[i].transferInTime);if(prev!==null&&prev<=next)samples.push(next-prev);}}
 }else if(id==='first-case-punctuality'){
  for(const room of chosen){const first=surgeries.filter(s=>s.operatingRoomId===room.id).sort((a,b)=>minute(a.plannedStartTime)-minute(b.plannedStartTime))[0];if(!first)continue;const actual=minute(first.transferInTime);const planned=(mockData.timelineEvents||[]).find(e=>e.surgeryId===first.id&&e.nodeCode==='T3');const due=minute(planned?.plannedTime);if(due!==null&&due<=asOf)samples.push(actual!==null&&actual<=due?100:0);}
 }else if(id==='pacu-stay'){
  for(const s of surgeries){const start=minute(s.recoveryStartTime),end=minute(s.recoveryEndTime);const bed=(mockData.pacuBeds||[]).find(b=>b.id===s.recoveryBedId||b.fullName===s.recoveryBedNo||(b.pacuRoomNo===s.pacuRoomNo&&b.bedNo===s.recoveryBedNo));if(bed&&ids.has(bed.id)&&start!==null&&end!==null&&end<=asOf&&end>=start)samples.push(end-start);}
 }else return unavailable(id==='instruments-turnover'?'缺少器械包回收及灭菌完成时间':id==='resource-conflict-index'?'原指标混合人员、手术间与设备冲突，尚无可独立归属的设备冲突明细':id==='or-utilization'?'缺少手术间开放时段台账':id==='pacu-utilization'?'缺少床位可用时段台账':'缺少设备可用时段及完整实际使用/维护记录');
 if(!samples.length)return unavailable('当前范围没有符合计算条件的已发生记录');
 const n=Math.round(samples.reduce((a,b)=>a+b,0)/samples.length*10)/10,def=INDICATOR_DEFS.find(d=>d.id===id);
 return {value:n,count:samples.length,reason:'基于当前演示事件记录 · '+samples.length+' 条有效样本',status:def?determineStatus(def,n):'normal'};
}

MetricSubjects={subjects,owner,definitions,states,entities,selection,value};
MetricSubjectDemo=(()=>{
const hash=s=>{let n=2166136261;for(const c of s)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
function nurses(rows){const result=rows.map((r,i)=>({...r,unit:r.category==='器械护士'?'手术器械护理单元':'手术巡回护理单元'}));for(const [role,prefix,unit] of [['复苏护士','REC','复苏护理单元'],['病房护士','WARD','病房护理单元']])for(let i=1;i<=12;i++)result.push({id:'DEMO-'+prefix+i,name:'模拟'+role+String(i).padStart(2,'0'),category:role,unit});return result;}
const dayStamp=d=>Date.parse(d+'T00:00:00Z');
function value(id,f,chosen){
 const no=reason=>({value:null,count:0,status:'unsupported',reason});
 const start=dayStamp(f.start),end=dayStamp(f.end),today=dayStamp(mockData.meta.date);
 if(!Number.isFinite(start)||!Number.isFinite(end)||start>end)return no('请选择有效日期范围');
 if(end>today||end-start>730*86400000)return no('模拟数据支持截至演示当日、最长731天的查询');
 const key=MetricSubjects.owner(id),caseIds=new Set();let numerator=0,denominator=0,samples=0;
 const shifts=key==='nursing'?(f.shift==='all'||!f.shift?['day','evening','night']:[f.shift]):['day'];
 for(let day=start;day<=end;day+=86400000)for(const e of chosen)for(const shift of shifts){
  if(key==='nursing'&&shift!==['day','evening','night'][hash(e.id+'|'+day+'|roster')%3])continue;
  const seed=hash(e.id+'|'+day+'|'+shift),n=2+seed%5,available=480+(seed%4)*60,used=Math.round(available*(.48+(seed%40)/100));
  let a=0,b=1;
  if(key==='nursing'){
   const role=e.category,operative=['巡回护士','器械护士'].includes(role),pacu=role==='复苏护士';
   if(id==='nursing-cases'||id==='nursing-participations'){
    if(!operative)continue;
    for(let j=0;j<n;j++)caseIds.add((id==='nursing-cases'?'PAIR-'+Math.floor(hash(e.id)%40):e.id)+'|'+day+'|'+shift+'|'+j);samples+=n;continue;
   }
   if(id==='nursing-hours'){a=3+(seed%45)/10;b=0;}
   if(id==='nursing-handovers'){a=n+seed%3;b=0;}
   if(id==='nursing-checks'){b=n*3;a=b-(seed%5===0?1:0);}
   if(id==='nursing-counts'){if(!operative)continue;b=n*4;a=b-(seed%9===0?1:0);}
   if(id==='nursing-pacu'){if(!pacu)continue;a=n;b=0;}
  }else if(['or-utilization','equipment-use','pacu-utilization'].includes(id)){a=used;b=available;}
  else if(id==='equipment-idle'){a=available-used;b=available;}
  else if(id==='equipment-turnover'){a=n;b=1;}
  else if(id==='first-case-punctuality'){a=seed%7===0?0:1;b=1;}
  else if(id==='turnover-time'){b=n-1;a=b*(18+seed%30);}
  else if(id==='pacu-stay'){b=n;a=b*(45+seed%70);}
  else if(id==='instruments-turnover'){b=n;a=b*(140+seed%160);}
  else if(id==='resource-conflict-index'){b=100;a=seed%10;}
  else if(id==='surgery-catalog-coverage'){b=180;a=166+seed%15;}
  else if(id==='mdt-participation-rate'){b=20;a=16+seed%5;}
  numerator+=a;denominator+=b;samples+=n;
 }
 let v;
 if(id==='nursing-cases'||id==='nursing-participations'){if(!samples)return no('所选岗位或班次无适用的模拟参与记录');v=caseIds.size;}
 else if(!samples)return no('当前岗位不适用该指标');
 else v=denominator?numerator/denominator:numerator;
 const def=MetricSubjects.definitions(key).find(d=>d.id===id);
 if(def.unit==='%')v*=100;
 v=Math.round(v*10)/10;
 const status=def.thresholds?determineStatus(def,v):'normal';
 return {value:v,count:samples,status,demo:true,reason:'模拟统计事实 · '+samples+' 条样本 · 按对象、日期与班次生成；仅供演示，不写入临床记录',numerator,denominator};
}

return {nurses,value};})();
window.MetricSubjectDemo=MetricSubjectDemo;
return MetricSubjects;
}
