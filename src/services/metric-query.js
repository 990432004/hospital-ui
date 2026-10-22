// Each query is bound to the monitoring page's filter snapshot.
export function createMetricQuery(domain,base){
 const cache=new Map()
 return (id,date='selection',filter={})=>{
  const {dept='all',groups=[],surgery={category:'all',subTypes:[]},levels={levels:[]},time='today'}=base
  const selectedDept=filter.dept||dept,selectedGroups=filter.group?[filter.group]:groups
  const allowedGroups=Object.entries(domain.departments).filter(([d])=>selectedDept==='all'||selectedDept===d).flatMap(([,g])=>g)
  if((dept!=='all'&&filter.dept&&dept!==filter.dept)||(groups.length&&filter.group&&!groups.includes(filter.group))||(selectedGroups.length&&!selectedGroups.some(g=>allowedGroups.includes(g))))return {value:null}
  if(filter.category&&surgery.category!=='all'&&filter.category!==surgery.category)return {value:null}
  const category=filter.category||surgery.category,categoryTypes=domain.surgeryTypes[category]||Object.values(domain.surgeryTypes).flat()
  let types=filter.type?[filter.type]:(filter.category?(surgery.subTypes?.length?surgery.subTypes.filter(t=>categoryTypes.includes(t)):categoryTypes):(surgery.subTypes||[]))
  if((filter.type&&(!categoryTypes.includes(filter.type)||(surgery.subTypes?.length&&!surgery.subTypes.includes(filter.type))))||(filter.category&&surgery.subTypes?.length&&!types.length)||(filter.level&&levels.levels.length&&!levels.levels.includes(filter.level)))return {value:null}
  const st={category,subTypes:types},lv={levels:filter.level?[filter.level]:levels.levels},key=JSON.stringify([selectedDept,selectedGroups,time,date,st,lv])
  if(!cache.has(key))cache.set(key,domain.buildIndicators(selectedDept,selectedGroups,date==='selection'?time:`custom:${date}:${date}`,st,lv))
  return cache.get(key).find(m=>m.id===id)||{value:null}
 }
}
export function trendDates(domain,base){
 const end=[domain.dateRange(base.time).end,domain.scenario.meta.date].sort()[0]
 return Array.from({length:30},(_,i)=>{const d=new Date(end+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-29+i);return d.toISOString().slice(0,10)})
}
export function collectDueMetrics(metrics,frequency,last,now){
 const due=[]
 for(const metric of metrics){
  if(!last.has(metric.id)){last.set(metric.id,now);continue}
  if(now-last.get(metric.id)>=frequency(metric.id)*60000){last.set(metric.id,now);due.push(metric.id)}
 }
 return due
}
