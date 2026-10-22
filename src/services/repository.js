const KEY = 'hospital-ui:demo:v1'
const clone = value => JSON.parse(JSON.stringify(value))
export const phases = { preop: '术前准备', intraop: '术中监护', postop: '复苏及术后', followup: '出院随访' }
export const levels = { red: '红色 · 严重', orange: '橙色 · 较重', yellow: '黄色 · 关注' }
export const responses = { pending: '待响应', processing: '处置中', escalated: '已升级', resolved: '已解除' }
export const messages = { unread: '未读', read: '已读', starred: '已标记' }
export const choices = object => Object.entries(object).map(([value,title])=>({value,title}))
const blank = () => ({version:1,templates:[],reports:[],messages:{}})
// Repository is the only business persistence boundary. Replace this factory with
// an HTTP adapter implementing the same asynchronous methods when APIs are ready.
export function createRepository({storage, seed, now=()=>new Date(), scenarioLoader}) {
  let domainPromise, scenarioPromise
  function getScenario(){
    if(!scenarioPromise)scenarioPromise=Promise.resolve().then(()=>scenarioLoader ? scenarioLoader() : Promise.reject(Error('完整场景未加载'))).catch(error=>{scenarioPromise=undefined;throw error})
    return scenarioPromise
  }
  function readClinical(key){
    const raw=read().clinical?.[key];if(!raw)return null
    try{
      const value=JSON.parse(raw)
      if(key==='perioperative-config-v1'){
        if(!value||typeof value!=='object'||Array.isArray(value))throw Error()
      }else if(key==='perioperative-source-bindings-v1'){
        if(!Array.isArray(value)||value.some(b=>!b||typeof b!=='object'||!b.id||typeof b.name!=='string'||!['api','database'].includes(b.kind)||!['internal','external'].includes(b.scope)||typeof b.enabled!=='boolean'||typeof b.target!=='string'||!b.connection||typeof b.connection!=='object'||Array.isArray(b.connection)||!Array.isArray(b.mappings)||!b.mappings.length||b.mappings.some(m=>!m||typeof m.external!=='string'||typeof m.internal!=='string'||typeof m.required!=='boolean'||!['identity','string','number','boolean','datetime'].includes(m.transform))))throw Error()
      }
      return raw
    }catch{throw Error('读取业务配置失败：保存的数据格式异常。请保留浏览器数据后重试，或确认重置演示数据。')}
  }
  async function getDomain() {
    if(!domainPromise)domainPromise=Promise.all([import('../domain/prototype-engine.js'),getScenario()]).then(([module,scenario])=>{
      const domain=module.createDomain({scenario,storage:{
        getItem:readClinical,
        setItem(key,value){const d=read();d.clinical={...(d.clinical||{}),[key]:value};write(d)},
      },manual:{templates:()=>clone(read().templates),reports:()=>clone(read().reports)}})
      const saved=JSON.parse(readClinical('perioperative-config-v1')||'{}')
      for(const [key,value] of Object.entries(saved)){
        const [kind,id,...extra]=key.split(':')
        try{if(!['risk','metric'].includes(kind)||!id||extra.length||!value||typeof value!=='object'||Array.isArray(value))throw Error();domain.config.validate(kind,id,value)}
        catch{throw Error('读取运行参数失败：'+key+' 配置异常，请保留数据后重试或确认重置演示数据。')}
      }
      return domain
    }).catch(error=>{domainPromise=undefined;throw error})
    return domainPromise
  }
  async function automatic(){return scenarioLoader ? (await getDomain()).generateAlerts() : seed.events}

  const validRoles = value => Array.isArray(value) && value.length > 0 && value.every(r => seed.roles.includes(r))
  const validTemplate = t => t && typeof t.id === 'string' && typeof t.name === 'string' && t.name.trim().length > 0 && t.name.length <= 60 && Object.hasOwn(phases,t.phase) && Object.hasOwn(levels,t.level) && validRoles(t.recipients) && typeof t.description === 'string' && t.description.length <= 500 && typeof t.enabled === 'boolean'
  const validReport = r => r && typeof r.id === 'string' && typeof r.triggerTime === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(r.triggerTime) && typeof r.indicator === 'string' && Object.hasOwn(phases,r.phase) && Object.hasOwn(levels,r.level) && validRoles(r.recipients) && validTemplate(r.templateSnapshot) && typeof r.reportedAt === 'string' && Number.isFinite(Date.parse(r.reportedAt)) && r.surgeryId != null && Object.hasOwn(messages,r.messageStatus)
  function read() {
    try {
      const raw=storage.getItem(KEY); if(!raw) return blank()
      const d=JSON.parse(raw)
      if(d.version!==1 || !Array.isArray(d.templates) || !Array.isArray(d.reports) || !d.messages || typeof d.messages!=='object' || Array.isArray(d.messages) || Object.values(d.messages).some(v=>!Object.hasOwn(messages,v)) || (d.clinical!=null&&(typeof d.clinical!=='object'||Array.isArray(d.clinical)||Object.values(d.clinical).some(v=>typeof v!=='string'))) || !d.templates.every(validTemplate) || !d.reports.every(validReport)) throw Error()
      return d
    } catch { throw Error('读取演示数据失败，请保留浏览器数据后重试，或确认重置演示数据。') }
  }
  function write(d) { try { storage.setItem(KEY,JSON.stringify(d)) } catch { throw Error('保存失败：浏览器存储不可用或空间不足。填写内容已保留，请重试。') } }
  const uid=p=>`${p}-${globalThis.crypto.randomUUID()}`
  function normalize(e,d) {
    const rule=seed.rules.find(r=>r.id===e.ruleId)
    const phase=e.ruleId==='MANUAL'?e.phase:(rule?.phase||e.phase)
    const rawResponse=e.responseStatus||e.status
    const response=Object.hasOwn(responses,rawResponse)?rawResponse:({closed:'resolved',ignored:'resolved','已处理':'resolved','已闭环':'resolved','已解除':'resolved','已响应':'processing','处置中':'processing','处理中':'processing',active:'processing','已升级':'escalated','升级处置中':'escalated'}[rawResponse]||'pending')
    return {...e,phase,phaseLabel:phases[phase],responseStatus:response,messageStatus:d.messages[e.id]||e.messageStatus||'unread',decisionGoal:rule?.goal||'手术安全',sourceLabel:e.ruleId==='MANUAL'?'人工填报':({event:'事件触发',deadline:'时点检查',stream:'连续监测'}[rule?.mode]||'自动监测')}
  }
  async function all(d) { return [...await automatic(),...d.reports].map(e=>normalize(e,d)).sort((a,b)=>b.triggerTime.localeCompare(a.triggerTime)) }
  return {
    getScenario, getDomain,
    async saveConfig(kind,id,value){if(!['risk','metric'].includes(kind))throw Error('无效配置类型');const domain=await getDomain();domain.config.save(kind,id,value);return clone(domain.config.get(kind,id))},
    async saveBinding(value){return (await getDomain()).sources.save(value)},
    async getCatalog() { const d=read(); return clone({meta:seed.meta,surgeries:seed.surgeries,roles:seed.roles,rules:seed.rules,templates:d.templates,reports:d.reports}) },
    async listAlerts(filters={}) { const d=read(); return clone((await all(d)).filter(e=>Object.entries(filters).every(([key,value])=>{
      if(!value||value==='all') return true
      if(key==='search') return [e.patientName,e.surgeryName,e.surgeryNo,e.dept,e.group,e.indicator,e.triggerEvidence,e.desc,e.decisionGoal,e.phaseLabel,e.roomName].join(' ').toLowerCase().includes(String(value).trim().toLowerCase())
      if(key==='startDate') return e.triggerTime.slice(0,10)>=value
      if(key==='endDate') return e.triggerTime.slice(0,10)<=value
      return String(e[key])===String(value)
    }))) },
    async getAlert(id) { return clone((await all(read())).find(e=>e.id===id)||null) },
    async setMessageStatus(id,status) { if(!Object.hasOwn(messages,status)) throw Error('无效消息状态');const d=read();if(!(await all(d)).some(e=>e.id===id)) throw Error('告警不存在');d.messages[id]=status;write(d) },
    async saveTemplate(input) {
      const d=read(),name=String(input.name||'').trim(),description=String(input.description||'').trim()
      if(!name||name.length>60) throw Error('请填写 1–60 字的模板名称')
      if(!Object.hasOwn(phases,input.phase)||!Object.hasOwn(levels,input.level)) throw Error('请选择阶段和告警等级')
      if(!Array.isArray(input.recipients)||!input.recipients.length||input.recipients.some(r=>!seed.roles.includes(r))) throw Error('请至少选择一个有效的通知角色')
      if(description.length>500) throw Error('填报说明不能超过 500 字')
      if(d.templates.some(t=>t.name===name&&t.id!==input.id)) throw Error('模板名称已存在')
      const index=d.templates.findIndex(t=>t.id===input.id)
      if(input.id&&index<0) throw Error('模板不存在，请刷新页面')
      const t={id:input.id||uid('TPL'),name,description,phase:input.phase,level:input.level,recipients:[...new Set(input.recipients)],enabled:input.enabled!==false}
      if(index<0)d.templates.push(t);else d.templates[index]=t
      write(d);return clone(t)
    },
    async submitReport(input) {
      const d=read(),t=d.templates.find(t=>t.id===input.templateId&&t.enabled),s=seed.surgeries.find(s=>String(s.id)===String(input.surgeryId)&&s.status!=='取消')
      if(!t) throw Error('请选择已启用的事件模板')
      if(!s) throw Error('请选择有效的具体手术')
      const time=String(input.occurredAt||''),stamp=new Date(time+'+08:00').getTime()
      const roundtrip=Number.isFinite(stamp)?new Date(stamp+8*3600000).toISOString().slice(0,16):''
      if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(time)||roundtrip!==time||stamp>now().getTime()) throw Error('请填写有效的发生时间，不能晚于当前时间（北京时间）')
      const triggerTime=time.replace('T',' ')+':00'
      if(d.reports.some(r=>r.templateId===t.id&&String(r.surgeryId)===String(s.id)&&r.triggerTime===triggerTime)) throw Error('该手术在此时间已上报相同事件，请核对填报记录')
      const notes=String(input.notes||'').trim();if(notes.length>1000) throw Error('补充说明不能超过 1000 字')
      const event={id:uid('MANUAL'),ruleId:'MANUAL',templateId:t.id,templateSnapshot:clone(t),indicator:t.name,phase:t.phase,phaseLabel:phases[t.phase],level:t.level,recipients:clone(t.recipients),triggerTime,reportedAt:now().toISOString(),triggerEvidence:notes||'填报人确认该事件发生；未填写补充说明',desc:t.description,sourceSystem:'人工填报',status:'pending',responseStatus:'pending',messageStatus:'unread',notificationStatus:'本地告警记录，尚未接入消息服务',surgeryId:s.id,surgeryNo:s.surgeryNo,patientId:s.patientId,patientName:s.patientName,surgeryName:s.surgeryName,dept:s.department,group:s.medicalGroupName,roomName:s.operatingRoomNo,surgeon:s.surgeonName}
      d.reports.unshift(event);write(d);return clone(event)
    },
    async reset() { write(blank());domainPromise=undefined;scenarioPromise=undefined },
  }
}
