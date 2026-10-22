// Generated from the original pure data definitions; DOM controllers are not imported.
// Regenerate with node scripts/import-domain.cjs. No user-supplied code is executed.
export function createDomain({scenario,storage,manual}) {
const window={mockData:scenario}; const mockData=scenario; const localStorage=storage;
let RuleWorkflows,DecisionConfig,riskParameter; const ManualReporting=manual;

// Source: decision-app/alert-data.js
// 围手术期指标决策预警系统 - 数据层
// 科室-医疗组两级结构：优先使用统一场景主数据，静态字典仅作降级。

var FALLBACK_DEPT_GROUPS = {
  '普通外科': ['张伟明组', '李国强组', '王建华组', '陈志远组', '刘德安组', '赵明辉组'],
  '骨外科': ['孙大伟组', '周立军组', '吴海涛组', '郑凯文组', '钱宏达组', '冯志强组'],
  '心胸外科': ['杨建平组', '黄文斌组', '林国栋组', '何永康组'],
  '神经外科': ['罗振宇组', '梁伟杰组', '宋海峰组', '唐志刚组', '韩明远组'],
  '泌尿外科': ['曹德成组', '许国安组', '邓伟民组', '萧建华组', '田永刚组'],
  '妇产科': ['彭丽萍组', '董晓燕组', '姜淑芬组', '蒋美华组', '沈玉兰组'],
  '眼科': ['陆光明组', '苏建平组', '潘志强组', '范国华组'],
  '耳鼻咽喉科': ['马俊杰组', '龚德明组', '魏志远组'],
  '口腔颌面外科': ['谢永康组', '钟国平组', '丁伟杰组']
};

var DEPT_GROUPS = (function() {
  if (window.mockData && Array.isArray(window.mockData.medicalGroups) && window.mockData.medicalGroups.length) {
    return window.mockData.medicalGroups.reduce(function(result, group) {
      if (!result[group.department]) result[group.department] = [];
      result[group.department].push(group.groupName);
      return result;
    }, {});
  }
  return FALLBACK_DEPT_GROUPS;
})();

// 医疗组列表（扁平）
var ALL_GROUPS = [];
for (var dept in DEPT_GROUPS) {
  DEPT_GROUPS[dept].forEach(function(g) {
    ALL_GROUPS.push({ dept: dept, group: g });
  });
}

// 指标定义（不含数值，数值按医疗组动态生成）
var INDICATOR_DEFS = [
  {
    id: 'or-utilization',
    name: '手术室利用率',
    category: '效率',
    icon: '🏥',
    iconColor: 'blue',
    desc: '衡量手术间时间利用效率，反映手术排程合理性',
    unit: '%',
    dimension: '日/周/月',
    baseValue: 78, baseRange: 15, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '手术室利用率 = ∑(手术实际占用时长) / 手术间可用时长 × 100%',
      html: '<span class="var">利用率</span> <span class="op">=</span> <span class="var">∑(手术实际占用时长)</span> <span class="op">/</span> <span class="var">手术间可用时长</span> <span class="op">×</span> 100%',
      vars: [
        { name: '手术实际占用时长', desc: '从患者入室(T3)到患者出室(T12)的实际时间', source: '手术麻醉信息系统' },
        { name: '手术间可用时长', desc: '手术间开放时段（通常8:00-18:00，10小时）', source: '排班系统配置' }
      ]
    },
    dataSources: [
      { field: '患者入室时间(T3)', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '自动采集' },
      { field: '患者出室时间(T12)', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '自动采集' },
      { field: '手术间开放时段', type: 'form', typeLabel: '手填表单', source: '手术室排班表', collection: '护士长手动配置' },
      { field: '停机维护时段', type: 'form', typeLabel: '手填表单', source: '设备维护申请单', collection: '设备科手动登记' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 50, unit: '%', direction: 'below', desc: '利用率低于此值触发严重告警' },
      { level: 'warning', label: '预警阈值', value: 65, unit: '%', direction: 'below', desc: '利用率低于此值触发预警' },
      { level: 'safe', label: '目标值', value: 85, unit: '%', direction: 'above', desc: '利用率达到此值为优秀' }
    ]
  },
  {
    id: 'first-case-punctuality',
    name: '首台手术准点率',
    category: '效率',
    icon: '⏰',
    iconColor: 'green',
    desc: '首台手术按计划时间开始执行的比例，反映手术启动效率',
    unit: '%',
    dimension: '日/周',
    baseValue: 75, baseRange: 18, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '首台手术准点率 = 首台准点数(入室时间与计划偏差≤5min) / 首台手术总数 × 100%',
      html: '<span class="var">准点率</span> <span class="op">=</span> <span class="var">首台准点数</span><br><span class="op">其中：</span><span class="var">准点</span> <span class="op">= |</span><span class="var">实际入室时间(T3)</span> <span class="op">-</span> <span class="var">计划入室时间</span><span class="op">| ≤ 5min</span>',
      vars: [
        { name: '实际入室时间(T3)', desc: '患者实际接入手术间的时间', source: '手术麻醉信息系统' },
        { name: '计划入室时间', desc: '排程中设定的患者入室时间', source: '手术排程系统' }
      ]
    },
    dataSources: [
      { field: '实际入室时间(T3)', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '自动采集' },
      { field: '计划入室时间', type: 'it', typeLabel: '信息化系统', source: '手术排程系统(HIS)', collection: '排程时自动生成' },
      { field: '延迟原因', type: 'form', typeLabel: '手填表单', source: '延迟原因登记表', collection: '巡回护士手动填写' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 60, unit: '%', direction: 'below', desc: '准点率低于此值触发严重告警' },
      { level: 'warning', label: '预警阈值', value: 75, unit: '%', direction: 'below', desc: '准点率低于此值触发预警' },
      { level: 'safe', label: '目标值', value: 90, unit: '%', direction: 'above', desc: '准点率达到此值为优秀' }
    ]
  },
  {
    id: 'turnover-time',
    name: '平均接台间隔',
    category: '效率',
    icon: '🔄',
    iconColor: 'orange',
    desc: '相邻两台手术之间的间隔时间，直接影响手术间周转效率',
    unit: 'min',
    dimension: '日',
    baseValue: 42, baseRange: 18, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '平均接台间隔 = ∑(后一台T3入室时间 - 前一台T12出室时间) / 接台总次数',
      html: '<span class="var">接台间隔</span> <span class="op">=</span> <span class="var">∑(后一台T3</span> <span class="op">-</span> <span class="var">前一台T12)</span> <span class="op">/</span> <span class="var">接台总次数</span>',
      vars: [
        { name: '后一台T3(入室时间)', desc: '下一台手术患者接入手术间时间', source: '手术麻醉信息系统' },
        { name: '前一台T12(出室时间)', desc: '上一台手术患者送出手术间时间', source: '手术麻醉信息系统' }
      ]
    },
    dataSources: [
      { field: '患者入室时间(T3)', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '自动采集' },
      { field: '患者出室时间(T12)', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '自动采集' },
      { field: '清洁消毒完成确认', type: 'form', typeLabel: '手填表单', source: '手术间清洁确认单', collection: '保洁人员签字确认' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 60, unit: 'min', direction: 'above', desc: '接台间隔超过此值触发严重告警' },
      { level: 'warning', label: '预警阈值', value: 45, unit: 'min', direction: 'above', desc: '接台间隔超过此值触发预警' },
      { level: 'safe', label: '目标值', value: 30, unit: 'min', direction: 'below', desc: '接台间隔达到此值为优秀' }
    ]
  },
  {
    id: 'surgery-duration-deviation',
    name: '手术时长偏差率',
    category: '效率',
    icon: '📊',
    iconColor: 'purple',
    desc: '实际手术时长与预计时长的偏差程度，反映预估准确性',
    unit: '%',
    dimension: '单台/汇总',
    baseValue: 20, baseRange: 12, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '手术时长偏差率 = |实际手术时长 - 预计手术时长| / 预计手术时长 × 100%',
      html: '<span class="var">偏差率</span> <span class="op">= |</span><span class="var">实际手术时长(T9-T6)</span> <span class="op">-</span> <span class="var">预计手术时长</span><span class="op">| /</span> <span class="var">预计手术时长</span> <span class="op">×</span> 100%',
      vars: [
        { name: '实际手术时长(T9-T6)', desc: '从切皮到缝合结束的实际时间', source: '手术麻醉信息系统' },
        { name: '预计手术时长', desc: '排程时设定的预估手术时长', source: '手术排程系统' }
      ]
    },
    dataSources: [
      { field: '切皮时间(T6)', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '自动采集' },
      { field: '缝合结束时间(T9)', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '自动采集' },
      { field: '预计手术时长', type: 'it', typeLabel: '信息化系统', source: '手术排程系统(HIS)', collection: '排程时录入' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 40, unit: '%', direction: 'above', desc: '偏差率超过此值触发严重告警' },
      { level: 'warning', label: '预警阈值', value: 25, unit: '%', direction: 'above', desc: '偏差率超过此值触发预警' },
      { level: 'safe', label: '目标值', value: 15, unit: '%', direction: 'below', desc: '偏差率低于此值为优秀' }
    ]
  },
  {
    id: 'safety-check-completion',
    name: '安全核查完成率',
    category: '安全',
    icon: '✅',
    iconColor: 'green',
    desc: 'WHO手术安全核查三项（Sign-in/Time-out/Sign-out）全部完成的比例',
    unit: '%',
    dimension: '日/周/月',
    baseValue: 96, baseRange: 8, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '安全核查完成率 = 完成三项核查的手术台数 / 总手术台数 × 100%',
      html: '<span class="var">完成率</span> <span class="op">=</span> <span class="var">完成三项核查台数</span> <span class="op">/</span> <span class="var">总手术台数</span> <span class="op">×</span> 100%<br><span class="op">其中三项：</span><span class="var">Sign-in</span>(麻醉前) <span class="op">+</span> <span class="var">Time-out</span>(切皮前) <span class="op">+</span> <span class="var">Sign-out</span>(出室前)',
      vars: [
        { name: 'Sign-in核查', desc: '麻醉前安全核查（身份、部位、过敏）', source: '手术麻醉信息系统' },
        { name: 'Time-out核查', desc: '切皮前暂停核查（团队、术式、器械）', source: '手术麻醉信息系统' },
        { name: 'Sign-out核查', desc: '出室前核查（器械清点、标本、用药）', source: '手术麻醉信息系统' }
      ]
    },
    dataSources: [
      { field: 'Sign-in核查记录', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '系统自动记录' },
      { field: 'Time-out核查记录', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '系统自动记录' },
      { field: 'Sign-out核查记录', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '系统自动记录' },
      { field: '核查异常备注', type: 'form', typeLabel: '手填表单', source: '安全核查表', collection: '核查护士手动填写' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 90, unit: '%', direction: 'below', desc: '完成率低于此值触发严重告警' },
      { level: 'warning', label: '预警阈值', value: 95, unit: '%', direction: 'below', desc: '完成率低于此值触发预警' },
      { level: 'safe', label: '目标值', value: 100, unit: '%', direction: 'above', desc: '完成率应达到100%' }
    ]
  },
  {
    id: 'adverse-event-rate',
    name: '不良事件发生率',
    category: '安全',
    icon: '⚠️',
    iconColor: 'red',
    desc: '围手术期不良事件（手术部位错误、异物遗留、药物差错等）发生比例',
    unit: '%',
    dimension: '月/季',
    baseValue: 0.45, baseRange: 0.5, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '不良事件发生率 = 不良事件数 / 总手术台数 × 100%',
      html: '<span class="var">发生率</span> <span class="op">=</span> <span class="var">不良事件数</span> <span class="op">/</span> <span class="var">总手术台数</span> <span class="op">×</span> 100%<br><span class="op">事件类型：</span>手术部位错误 / 异物遗留 / 药物差错 / 非计划重返 / 术中死亡 / 麻醉意外 / 输血反应',
      vars: [
        { name: '不良事件数', desc: '围手术期内上报的不良事件总数', source: '质控管理系统' },
        { name: '总手术台数', desc: '统计周期内的手术总台数', source: '手术排程系统' }
      ]
    },
    dataSources: [
      { field: '不良事件记录', type: 'form', typeLabel: '手填表单', source: '不良事件上报系统', collection: '责任医护人员手动上报' },
      { field: '事件分类与分级', type: 'form', typeLabel: '手填表单', source: '不良事件上报系统', collection: '质控科审核录入' },
      { field: '手术台次统计', type: 'it', typeLabel: '信息化系统', source: '手术排程系统(HIS)', collection: '自动统计' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 1.0, unit: '%', direction: 'above', desc: '发生率超过此值触发严重告警' },
      { level: 'warning', label: '预警阈值', value: 0.5, unit: '%', direction: 'above', desc: '发生率超过此值触发预警' },
      { level: 'safe', label: '目标值', value: 0.1, unit: '%', direction: 'below', desc: '发生率低于此值为优秀' }
    ]
  },
  {
    id: 'instruments-turnover',
    name: '器械包周转时间',
    category: '资源',
    icon: '🧰',
    iconColor: 'teal',
    desc: '器械包从回收、清洗、打包到灭菌完成的完整循环时间',
    unit: 'min',
    dimension: '单包/汇总',
    baseValue: 50, baseRange: 20, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '器械包周转时间 = 灭菌完成时间 - 回收时间',
      html: '<span class="var">周转时间</span> <span class="op">=</span> <span class="var">灭菌完成时间</span> <span class="op">-</span> <span class="var">回收时间</span><br><span class="op">循环：</span>使用中 → 已回收 → 清洗中 → 打包中 → 灭菌中 → 已灭菌',
      vars: [
        { name: '回收时间', desc: '器械包从手术间回收到CSSD的时间', source: 'CSSD追溯系统' },
        { name: '灭菌完成时间', desc: '灭菌程序结束并检测合格的时间', source: 'CSSD追溯系统' }
      ]
    },
    dataSources: [
      { field: '器械回收时间', type: 'it', typeLabel: '信息化系统', source: 'CSSD器械追溯系统', collection: '扫码回收自动记录' },
      { field: '清洗完成时间', type: 'it', typeLabel: '信息化系统', source: 'CSSD清洗消毒机', collection: '设备自动上传' },
      { field: '灭菌完成时间', type: 'it', typeLabel: '信息化系统', source: 'CSSD灭菌器', collection: '设备自动上传' },
      { field: '生物监测结果', type: 'form', typeLabel: '手填表单', source: 'CSSD生物监测记录', collection: '消毒员手动录入' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 75, unit: 'min', direction: 'above', desc: '周转时间超过此值严重影响接台' },
      { level: 'warning', label: '预警阈值', value: 55, unit: 'min', direction: 'above', desc: '周转时间超过此值触发预警' },
      { level: 'safe', label: '目标值', value: 45, unit: 'min', direction: 'below', desc: '周转时间低于此值为优秀' }
    ]
  },
  {
    id: 'unplanned-return-or',
    name: '非计划重返手术室率',
    category: '安全',
    icon: '🚨',
    iconColor: 'red',
    desc: '术后因并发症等原因需非计划再次手术的比例，是核心安全指标',
    unit: '%',
    dimension: '月/季',
    baseValue: 0.35, baseRange: 0.4, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '非计划重返手术室率 = 非计划重返手术台数 / 总手术台数 × 100%',
      html: '<span class="var">重返率</span> <span class="op">=</span> <span class="var">非计划重返手术台数</span> <span class="op">/</span> <span class="var">总手术台数</span> <span class="op">×</span> 100%<br><span class="op">常见原因：</span>术后出血 / 切口感染 / 器械遗留 / 消化道瘘',
      vars: [
        { name: '非计划重返台数', desc: '术后30天内因并发症再次进入手术室', source: '手术排程系统+不良事件系统' },
        { name: '总手术台数', desc: '统计周期内的手术总台数', source: '手术排程系统' }
      ]
    },
    dataSources: [
      { field: '重返手术记录', type: 'it', typeLabel: '信息化系统', source: '手术排程系统(HIS)', collection: '系统自动关联识别' },
      { field: '重返原因分析', type: 'form', typeLabel: '手填表单', source: '不良事件上报系统', collection: '主治医生手动填写' },
      { field: '手术台次统计', type: 'it', typeLabel: '信息化系统', source: '手术排程系统(HIS)', collection: '自动统计' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 0.5, unit: '%', direction: 'above', desc: '重返率超过此值触发严重告警' },
      { level: 'warning', label: '预警阈值', value: 0.3, unit: '%', direction: 'above', desc: '重返率超过此值触发预警' },
      { level: 'safe', label: '目标值', value: 0.1, unit: '%', direction: 'below', desc: '重返率低于此值为优秀' }
    ]
  },
  {
    id: 'handover-completion',
    name: '交接记录完整率',
    category: '安全',
    icon: '🤝',
    iconColor: 'blue',
    desc: '患者在各环节交接时记录完整规范的比例',
    unit: '%',
    dimension: '日/周/月',
    baseValue: 92, baseRange: 10, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '交接完整率 = 交接记录完整规范的次数 / 总交接次数 × 100%',
      html: '<span class="var">完整率</span> <span class="op">=</span> <span class="var">完整交接次数</span> <span class="op">/</span> <span class="var">总交接次数</span> <span class="op">×</span> 100%<br><span class="op">交接环节：</span>病房→手术室 / 手术室→复苏室 / 复苏室→病房',
      vars: [
        { name: '完整交接次数', desc: '交接内容清单全部勾选完成的次数', source: '交接记录系统' },
        { name: '总交接次数', desc: '统计周期内所有交接事件总数', source: '交接记录系统' }
      ]
    },
    dataSources: [
      { field: '交接内容清单', type: 'form', typeLabel: '手填表单', source: '交接记录单(PDA端)', collection: '交接护士逐项勾选' },
      { field: '交接时间戳', type: 'it', typeLabel: '信息化系统', source: '移动护理系统', collection: 'PDA扫码自动记录' },
      { field: '交接人员信息', type: 'it', typeLabel: '信息化系统', source: '移动护理系统', collection: 'PDA登录自动获取' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 85, unit: '%', direction: 'below', desc: '完整率低于此值触发严重告警' },
      { level: 'warning', label: '预警阈值', value: 90, unit: '%', direction: 'below', desc: '完整率低于此值触发预警' },
      { level: 'safe', label: '目标值', value: 98, unit: '%', direction: 'above', desc: '完整率达到此值为优秀' }
    ]
  },
  {
    id: 'intraop-hypothermia',
    name: '术中低体温发生率',
    category: '安全',
    icon: '🌡️',
    iconColor: 'orange',
    desc: '术中核心体温低于36°C的发生比例，影响术后恢复',
    unit: '%',
    dimension: '月',
    baseValue: 8, baseRange: 6, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '术中低体温发生率 = 术中低体温例数 / 体温监测总例数 × 100%',
      html: '<span class="var">低体温率</span> <span class="op">=</span> <span class="var">核心体温 &lt; 36°C 的例数</span> <span class="op">/</span> <span class="var">体温监测总例数</span> <span class="op">×</span> 100%',
      vars: [
        { name: '核心体温', desc: '术中连续监测的核心体温值', source: '麻醉信息系统' },
        { name: '体温监测总例数', desc: '统计周期内进行体温监测的手术总数', source: '麻醉信息系统' }
      ]
    },
    dataSources: [
      { field: '术中体温时序数据', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '监护仪自动采集' },
      { field: '保温措施记录', type: 'form', typeLabel: '手填表单', source: '麻醉记录单', collection: '麻醉医生手动填写' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 15, unit: '%', direction: 'above', desc: '低体温率超过此值触发严重告警' },
      { level: 'warning', label: '预警阈值', value: 10, unit: '%', direction: 'above', desc: '低体温率超过此值触发预警' },
      { level: 'safe', label: '目标值', value: 5, unit: '%', direction: 'below', desc: '低体温率低于此值为优秀' }
    ]
  },
  {
    id: 'ssi-rate',
    name: '手术部位感染率',
    category: '安全',
    icon: '🦠',
    iconColor: 'red',
    desc: '术后手术部位感染(SSI)的发生比例，按切口类型分层统计',
    unit: '%',
    dimension: '月/季',
    baseValue: 1.2, baseRange: 1.0, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '手术部位感染率 = SSI发生例数 / 同类手术总例数 × 100%（按切口类型分层）',
      html: '<span class="var">SSI感染率</span> <span class="op">=</span> <span class="var">SSI发生例数</span> <span class="op">/</span> <span class="var">同类手术总例数</span> <span class="op">×</span> 100%<br><span class="op">分层：</span>I类切口 ≤ 1.5% / II类切口 ≤ 3.0% / III类切口 ≤ 5.0%',
      vars: [
        { name: 'SSI发生例数', desc: '术后30天内确诊的手术部位感染数', source: '院感监测系统' },
        { name: '同类手术总例数', desc: '同一切口类型的手术总数', source: '手术排程系统' }
      ]
    },
    dataSources: [
      { field: '感染诊断记录', type: 'it', typeLabel: '信息化系统', source: '院感监测系统', collection: '系统自动关联检验结果' },
      { field: '切口类型分类', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '手术记录自动提取' },
      { field: '病原体培养结果', type: 'it', typeLabel: '信息化系统', source: 'LIS检验系统', collection: '检验科自动上传' },
      { field: '随访感染记录', type: 'form', typeLabel: '手填表单', source: '术后随访表', collection: '随访护士手动录入' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值(I类)', value: 2.0, unit: '%', direction: 'above', desc: 'I类切口感染率超过此值触发严重告警' },
      { level: 'warning', label: '预警阈值(I类)', value: 1.5, unit: '%', direction: 'above', desc: 'I类切口感染率超过此值触发预警' },
      { level: 'safe', label: '目标值(I类)', value: 0.8, unit: '%', direction: 'below', desc: 'I类切口感染率低于此值为优秀' }
    ]
  },
  {
    id: 'antibiotic-prophylaxis',
    name: '术前预防性抗菌药物使用率',
    category: '安全',
    icon: '💊',
    iconColor: 'purple',
    desc: 'I类切口手术术前预防性使用抗菌药物的比例（应≤30%）',
    unit: '%',
    dimension: '月',
    baseValue: 26, baseRange: 10, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '预防性抗菌药物使用率 = 术前预防用药的I类切口手术数 / I类切口手术总数 × 100%',
      html: '<span class="var">使用率</span> <span class="op">=</span> <span class="var">术前预防用药台数</span> <span class="op">/</span> <span class="var">I类切口手术总数</span> <span class="op">×</span> 100%<br><span class="op">规范要求：</span>I类切口预防用药率 ≤ 30%，切皮前30min~2h给药',
      vars: [
        { name: '预防用药台数', desc: 'I类切口手术中使用了预防性抗菌药物的台数', source: '麻醉信息系统' },
        { name: 'I类切口手术总数', desc: '统计周期内I类清洁切口手术总数', source: '手术麻醉信息系统' }
      ]
    },
    dataSources: [
      { field: '术中用药记录', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '系统自动记录' },
      { field: '切口类型', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '手术记录自动提取' },
      { field: '给药时间', type: 'it', typeLabel: '信息化系统', source: '手术麻醉信息系统(ORIS)', collection: '系统自动记录' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 40, unit: '%', direction: 'above', desc: '使用率超过此值触发严重告警' },
      { level: 'warning', label: '预警阈值', value: 30, unit: '%', direction: 'above', desc: '使用率超过此值触发预警' },
      { level: 'safe', label: '目标值', value: 20, unit: '%', direction: 'below', desc: '使用率低于此值为优秀' }
    ]
  },
  {
    id: 'resource-conflict-index',
    name: '资源冲突指数',
    category: '效率',
    icon: '⚡',
    iconColor: 'orange',
    desc: '手术排程中资源（手术间/人员/设备）冲突事件的比例',
    unit: '%',
    dimension: '日',
    baseValue: 3.5, baseRange: 4, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '资源冲突指数 = 资源冲突事件数 / 总手术排程数 × 100%',
      html: '<span class="var">冲突指数</span> <span class="op">=</span> <span class="var">资源冲突事件数</span> <span class="op">/</span> <span class="var">总排程数</span> <span class="op">×</span> 100%<br><span class="op">冲突类型：</span>手术间冲突 / 医生冲突 / 设备冲突 / 器械冲突',
      vars: [
        { name: '冲突事件数', desc: '排程检测到的资源冲突事件总数', source: '排程冲突检测引擎' },
        { name: '总排程数', desc: '当日手术排程总条数', source: '手术排程系统' }
      ]
    },
    dataSources: [
      { field: '排程数据', type: 'it', typeLabel: '信息化系统', source: '手术排程系统(HIS)', collection: '排程时自动生成' },
      { field: '人员排班数据', type: 'it', typeLabel: '信息化系统', source: '人力资源排班系统', collection: '排班时自动生成' },
      { field: '设备预约数据', type: 'it', typeLabel: '信息化系统', source: '设备管理系统', collection: '预约时自动生成' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 8, unit: '%', direction: 'above', desc: '冲突指数超过此值触发严重告警' },
      { level: 'warning', label: '预警阈值', value: 5, unit: '%', direction: 'above', desc: '冲突指数超过此值触发预警' },
      { level: 'safe', label: '目标值', value: 2, unit: '%', direction: 'below', desc: '冲突指数低于此值为优秀' }
    ]
  },
  {
    id: 'postop-followup-rate',
    name: '术后随访完成率',
    category: '安全',
    icon: '📞',
    iconColor: 'blue',
    desc: '术后按规定时间节点完成随访的比例',
    unit: '%',
    dimension: '月',
    baseValue: 88, baseRange: 12, statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 },
    formula: {
      display: '术后随访完成率 = 已完成随访例数 / 应随访总例数 × 100%',
      html: '<span class="var">完成率</span> <span class="op">=</span> <span class="var">已完成随访例数</span> <span class="op">/</span> <span class="var">应随访总例数</span> <span class="op">×</span> 100%<br><span class="op">随访节点：</span>术后24h / 48h / 7天 / 30天',
      vars: [
        { name: '已完成随访例数', desc: '在规定时间节点内完成随访的例数', source: '随访管理系统' },
        { name: '应随访总例数', desc: '统计周期内需要随访的手术总例数', source: '手术排程系统' }
      ]
    },
    dataSources: [
      { field: '随访记录', type: 'form', typeLabel: '手填表单', source: '术后随访系统', collection: '随访护士/医生手动录入' },
      { field: '随访时间点', type: 'it', typeLabel: '信息化系统', source: '随访管理系统', collection: '系统自动计算' },
      { field: '手术出院记录', type: 'it', typeLabel: '信息化系统', source: 'HIS系统', collection: '出院时自动生成' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 75, unit: '%', direction: 'below', desc: '完成率低于此值触发严重告警' },
      { level: 'warning', label: '预警阈值', value: 85, unit: '%', direction: 'below', desc: '完成率低于此值触发预警' },
      { level: 'safe', label: '目标值', value: 95, unit: '%', direction: 'above', desc: '完成率达到此值为优秀' }
    ]
  },
  // ===== V2新增：政策对齐指标 =====
  {
    id: 'mdt-discussion-rate',
    name: '术前MDT讨论率',
    dept: '全部',
    category: 'quality',
    icon: '👥',
    iconColor: 'purple',
    desc: '术前多学科讨论开展率，依据卫健委MDT指引',
    baseValue: 82,
    baseRange: 20,
    unit: '%',
    dimension: '质量',
    formula: {
      display: '术前MDT讨论率 = 已开展MDT讨论的目录内手术数 / 目录内手术总数 × 100%',
      html: '<span class="var">MDT讨论率</span> <span class="op">=</span> <span class="var">已开展MDT讨论手术数</span> <span class="op">/</span> <span class="var">目录内手术总数</span> <span class="op">×</span> 100%',
      vars: [
        { name: '已开展MDT讨论手术数', desc: '统计周期内已开展MDT讨论的目录内手术台数', source: 'MDT管理系统' },
        { name: '目录内手术总数', desc: '统计周期内手术分级目录中应行MDT讨论的手术总数', source: 'HIS系统' }
      ]
    },
    dataSources: [
      { field: 'MDT讨论记录', type: 'it', typeLabel: '信息化系统', source: 'MDT管理系统', collection: '系统自动记录' },
      { field: '手术排程', type: 'it', typeLabel: '信息化系统', source: 'HIS系统', collection: '系统自动获取' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 70, unit: '%', direction: 'below', desc: '低于此值需立即整改' },
      { level: 'warning', label: '预警阈值', value: 80, unit: '%', direction: 'below', desc: '低于此值触发预警' },
      { level: 'safe', label: '目标值', value: 90, unit: '%', direction: 'above', desc: '达到此值为优秀' }
    ],
    statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 }
  },
  {
    id: 'mdt-participation-rate',
    name: 'MDT邀请科室参与率',
    dept: '全部',
    category: 'quality',
    icon: '🤝',
    iconColor: 'purple',
    desc: 'MDT讨论中邀请科室的实际参与率',
    baseValue: 91,
    baseRange: 15,
    unit: '%',
    dimension: '质量',
    formula: {
      display: 'MDT邀请科室参与率 = 实际参与科室数 / 应参与科室数 × 100%',
      html: '<span class="var">参与率</span> <span class="op">=</span> <span class="var">实际参与科室数</span> <span class="op">/</span> <span class="var">应参与科室数</span> <span class="op">×</span> 100%',
      vars: [
        { name: '实际参与科室数', desc: 'MDT讨论中实际签到参与的科室数量', source: 'MDT管理系统' },
        { name: '应参与科室数', desc: '根据MDT讨论病种应邀请的科室总数', source: 'MDT管理系统' }
      ]
    },
    dataSources: [
      { field: 'MDT签到记录', type: 'it', typeLabel: '信息化系统', source: 'MDT管理系统', collection: '系统自动记录' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 80, unit: '%', direction: 'below', desc: '' },
      { level: 'warning', label: '预警阈值', value: 88, unit: '%', direction: 'below', desc: '' },
      { level: 'safe', label: '目标值', value: 95, unit: '%', direction: 'above', desc: '' }
    ],
    statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 }
  },
  {
    id: 'surgery-catalog-coverage',
    name: '手术分级目录覆盖率',
    dept: '全部',
    category: 'management',
    icon: '📋',
    iconColor: 'blue',
    desc: '已纳入分级管理的手术占实际开展手术比例',
    baseValue: 94,
    baseRange: 10,
    unit: '%',
    dimension: '管理',
    formula: {
      display: '手术分级目录覆盖率 = 已纳入分级管理的手术数 / 实际开展手术总数 × 100%',
      html: '<span class="var">覆盖率</span> <span class="op">=</span> <span class="var">已纳入分级管理手术数</span> <span class="op">/</span> <span class="var">实际开展手术总数</span> <span class="op">×</span> 100%',
      vars: [
        { name: '已纳入分级管理手术数', desc: '已录入手术分级目录的手术种类数量', source: '手术分级管理系统' },
        { name: '实际开展手术总数', desc: '统计周期内实际开展的手术种类总数', source: 'HIS系统' }
      ]
    },
    dataSources: [
      { field: '手术分级目录', type: 'it', typeLabel: '信息化系统', source: '手术分级管理系统', collection: '系统自动统计' },
      { field: '手术记录', type: 'it', typeLabel: '信息化系统', source: 'HIS系统', collection: '系统自动获取' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 85, unit: '%', direction: 'below', desc: '' },
      { level: 'warning', label: '预警阈值', value: 90, unit: '%', direction: 'below', desc: '' },
      { level: 'safe', label: '目标值', value: 98, unit: '%', direction: 'above', desc: '' }
    ],
    statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 }
  },
  {
    id: 'level4-surgery-ratio',
    name: '四级手术占比',
    dept: '全部',
    category: 'management',
    icon: '📊',
    iconColor: 'blue',
    desc: '四级手术条目数占手术分级目录总条目数比例',
    baseValue: 8,
    baseRange: 5,
    unit: '%',
    dimension: '管理',
    formula: {
      display: '四级手术占比 = 四级手术条目数 / 手术分级目录总条目数 × 100%',
      html: '<span class="var">四级手术占比</span> <span class="op">=</span> <span class="var">四级手术条目数</span> <span class="op">/</span> <span class="var">手术分级目录总条目数</span> <span class="op">×</span> 100%',
      vars: [
        { name: '四级手术条目数', desc: '手术分级目录中评级为四级的手术条目数量', source: '手术分级管理系统' },
        { name: '手术分级目录总条目数', desc: '手术分级目录中所有手术条目总数', source: '手术分级管理系统' }
      ]
    },
    dataSources: [
      { field: '手术分级目录', type: 'it', typeLabel: '信息化系统', source: '手术分级管理系统', collection: '系统自动统计' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 15, unit: '%', direction: 'above', desc: '占比过高需关注资源配置' },
      { level: 'warning', label: '预警阈值', value: 12, unit: '%', direction: 'above', desc: '占比偏高' },
      { level: 'safe', label: '目标值', value: 8, unit: '%', direction: 'below', desc: '参考值5%-10%' }
    ],
    statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 }
  },
  {
    id: 'red-warning-count',
    name: '红色预警事件数',
    dept: '全部',
    category: 'safety',
    icon: '🔴',
    iconColor: 'red',
    desc: '统计周期内红色预警（即刻危及生命）事件发生总数',
    baseValue: 2,
    baseRange: 3,
    unit: '件',
    dimension: '安全',
    formula: {
      display: '红色预警事件数 = 统计周期内红色预警事件发生总数',
      html: '<span class="var">红色预警事件数</span> <span class="op">=</span> <span class="var">红色预警事件总数</span>',
      vars: [
        { name: '红色预警事件总数', desc: '统计周期内所有红色预警（即刻危及生命）事件的发生次数', source: '手术风险预警系统' }
      ]
    },
    dataSources: [
      { field: '预警事件记录', type: 'it', typeLabel: '信息化系统', source: '手术风险预警系统', collection: '系统自动抓取' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 5, unit: '件', direction: 'above', desc: '超过此值需院级复盘' },
      { level: 'warning', label: '预警阈值', value: 3, unit: '件', direction: 'above', desc: '超过此值触发关注' },
      { level: 'safe', label: '目标值', value: 0, unit: '件', direction: 'below', desc: '零事件为最优' }
    ],
    statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 }
  },
  {
    id: 'orange-warning-count',
    name: '橙色预警事件数',
    dept: '全部',
    category: 'safety',
    icon: '🟠',
    iconColor: 'orange',
    desc: '统计周期内橙色预警（高风险需紧急干预）事件总数',
    baseValue: 8,
    baseRange: 6,
    unit: '件',
    dimension: '安全',
    formula: {
      display: '橙色预警事件数 = 统计周期内橙色预警事件发生总数',
      html: '<span class="var">橙色预警事件数</span> <span class="op">=</span> <span class="var">橙色预警事件总数</span>',
      vars: [
        { name: '橙色预警事件总数', desc: '统计周期内所有橙色预警（高风险需紧急干预）事件的发生次数', source: '手术风险预警系统' }
      ]
    },
    dataSources: [
      { field: '预警事件记录', type: 'it', typeLabel: '信息化系统', source: '手术风险预警系统', collection: '系统自动抓取' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 15, unit: '件', direction: 'above', desc: '' },
      { level: 'warning', label: '预警阈值', value: 10, unit: '件', direction: 'above', desc: '' },
      { level: 'safe', label: '目标值', value: 5, unit: '件', direction: 'below', desc: '' }
    ],
    statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 }
  },
  {
    id: 'yellow-warning-count',
    name: '黄色预警事件数',
    dept: '全部',
    category: 'safety',
    icon: '🟡',
    iconColor: 'orange',
    desc: '统计周期内黄色预警（病情不稳定）事件总数',
    baseValue: 18,
    baseRange: 10,
    unit: '件',
    dimension: '安全',
    formula: {
      display: '黄色预警事件数 = 统计周期内黄色预警事件发生总数',
      html: '<span class="var">黄色预警事件数</span> <span class="op">=</span> <span class="var">黄色预警事件总数</span>',
      vars: [
        { name: '黄色预警事件总数', desc: '统计周期内所有黄色预警（病情不稳定）事件的发生次数', source: '手术风险预警系统' }
      ]
    },
    dataSources: [
      { field: '预警事件记录', type: 'it', typeLabel: '信息化系统', source: '手术风险预警系统', collection: '系统自动抓取' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 30, unit: '件', direction: 'above', desc: '' },
      { level: 'warning', label: '预警阈值', value: 25, unit: '件', direction: 'above', desc: '' },
      { level: 'safe', label: '目标值', value: 15, unit: '件', direction: 'below', desc: '' }
    ],
    statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 }
  },
  {
    id: 'warning-response-rate',
    name: '预警响应及时率',
    dept: '全部',
    category: 'safety',
    icon: '⚡',
    iconColor: 'teal',
    desc: '按时限完成响应的预警数占预警总数比例',
    baseValue: 88,
    baseRange: 12,
    unit: '%',
    dimension: '安全',
    formula: {
      display: '预警响应及时率 = 按时限完成响应的预警数 / 预警总数 × 100%',
      html: '<span class="var">响应及时率</span> <span class="op">=</span> <span class="var">按时限完成响应的预警数</span> <span class="op">/</span> <span class="var">预警总数</span> <span class="op">×</span> 100%',
      vars: [
        { name: '按时限完成响应的预警数', desc: '在规定时限内完成响应的预警事件数量', source: '手术风险预警系统' },
        { name: '预警总数', desc: '统计周期内发生的预警事件总数', source: '手术风险预警系统' }
      ]
    },
    dataSources: [
      { field: '预警响应记录', type: 'it', typeLabel: '信息化系统', source: '手术风险预警系统', collection: '系统自动记录' }
    ],
    thresholds: [
      { level: 'danger', label: '异常阈值', value: 80, unit: '%', direction: 'below', desc: '' },
      { level: 'warning', label: '预警阈值', value: 85, unit: '%', direction: 'below', desc: '' },
      { level: 'safe', label: '目标值', value: 95, unit: '%', direction: 'above', desc: '' }
    ],
    statusWeights: { normal: 0.6, warning: 0.2, danger: 0.2 }
  }
];

// 管理目标是指标看板与告警归属的统一口径。
var DECISION_GOALS = {
  quality: { label: '质量管理' },
  efficiency: { label: '效率管理' },
  mdt: { label: '术前MDT专项' }
};

var DECISION_GOAL_BY_CATEGORY = {
  '安全': 'quality',
  safety: 'quality',
  '效率': 'efficiency',
  '资源': 'efficiency',
  quality: 'mdt',
  management: 'mdt'
};

var INDICATOR_CATEGORY_LABELS = {
  '安全': '医疗质量',
  safety: '风险预警',
  '效率': '运行效率',
  '资源': '资源周转',
  quality: 'MDT执行',
  management: '分级目录'
};

function getDecisionGoalKey(category) {
  return DECISION_GOAL_BY_CATEGORY[category];
}

// ===== 术种二级分类 =====
// 一级分类 -> 二级分类（具体术种）
var SURGERY_TYPES = {
  '普通外科手术': [
    '腹腔镜胆囊切除术', '腹腔镜阑尾切除术', '腹腔镜疝修补术', '甲状腺切除术',
    '乳腺纤维瘤切除术', '胃肠吻合术', '肝部分切除术', '脾切除术',
    '胆总管探查术', '结直肠癌根治术'
  ],
  '骨科手术': [
    '膝关节置换术', '髋关节置换术', '椎间融合术', '股骨颈骨折内固定术',
    '半月板修补术', '脊柱内固定术', '肩袖修补术', '踝关节融合术',
    '腱鞘囊肿切除术', '骨肿瘤刮除术'
  ],
  '心胸外科手术': [
    '冠状动脉搭桥术', '心脏瓣膜置换术', '食管癌根治术', '肺叶切除术',
    '胸腺瘤切除术', '动脉瘤修补术', '房/室间隔缺损修补术'
  ],
  '神经外科手术': [
    '开颅肿瘤切除术', '脑动脉瘤夹闭术', '椎管内肿瘤切除术', '脑室-腹腔分流术',
    '三叉神经微血管减压术', '颅骨修补术'
  ],
  '泌尿外科手术': [
    '肾结石碎石术', '前列腺电切术', '膀胱肿瘤电切术', '腹腔镜肾切除术',
    '输尿管镜碎石术', '睾丸固定术'
  ],
  '妇产科手术': [
    '剖宫产术', '子宫肌瘤剔除术', '卵巢囊肿剥除术', '腹腔镜全子宫切除术',
    '输卵管复通术', '宫颈锥切术'
  ],
  '眼科手术': [
    '白内障超声乳化术', '视网膜复位术', '青光眼滤过术', '斜视矫正术',
    '眼睑成形术', '玻璃体切割术'
  ],
  '耳鼻咽喉科手术': [
    '扁桃体摘除术', '鼻中隔偏曲矫正术', '鼓膜修补术', '声带息肉摘除术',
    '人工耳蜗植入术', '喉癌根治术'
  ],
  '口腔颌面外科手术': [
    '颌骨骨折内固定术', '舌癌根治术', '腮腺肿瘤切除术', '唇腭裂修复术',
    '颌面部囊肿摘除术'
  ]
};

// 扁平术种列表
var ALL_SURGERY_TYPES = [];
for (var st in SURGERY_TYPES) {
  SURGERY_TYPES[st].forEach(function(sub) {
    ALL_SURGERY_TYPES.push({ category: st, name: sub });
  });
}

// 为每个医疗组生成指标数值
var GROUP_INDICATOR_DATA = {};

function seededRandom(seed) {
  var x = Math.sin(seed * 9999 + 12345) * 10000;
  return x - Math.floor(x);
}

function generateValue(base, range, seed) {
  var r = seededRandom(seed);
  return Math.round((base + (r - 0.5) * range * 2) * 10) / 10;
}

function determineStatus(def, value) {
  var dangerTh = def.thresholds.find(function(t) { return t.level === 'danger'; });
  var warnTh = def.thresholds.find(function(t) { return t.level === 'warning'; });
  if (dangerTh.direction === 'below') {
    if (value <= dangerTh.value) return 'danger';
    if (value <= warnTh.value) return 'warning';
    return 'normal';
  } else {
    if (value >= dangerTh.value) return 'danger';
    if (value >= warnTh.value) return 'warning';
    return 'normal';
  }
}

ALL_GROUPS.forEach(function(g, gi) {
  var key = g.dept + '|' + g.group;
  GROUP_INDICATOR_DATA[key] = {};
  INDICATOR_DEFS.forEach(function(def, di) {
    var seed = gi * 100 + di;
    var val = generateValue(def.baseValue, def.baseRange, seed);
    // Ensure value respects status weights
    var targetStatusRoll = seededRandom(seed + 500);
    var cumulative = 0;
    var forcedStatus = 'normal';
    for (var s in def.statusWeights) {
      cumulative += def.statusWeights[s];
      if (targetStatusRoll <= cumulative) { forcedStatus = s; break; }
    }
    // Adjust value to match forced status
    var dangerTh = def.thresholds.find(function(t) { return t.level === 'danger'; });
    var warnTh = def.thresholds.find(function(t) { return t.level === 'warning'; });
    if (forcedStatus === 'danger') {
      if (dangerTh.direction === 'below') val = dangerTh.value - Math.abs(seededRandom(seed + 600) * 5);
      else val = dangerTh.value + Math.abs(seededRandom(seed + 600) * 3);
    } else if (forcedStatus === 'warning') {
      if (warnTh.direction === 'below') val = warnTh.value - Math.abs(seededRandom(seed + 600) * 3);
      else val = warnTh.value + Math.abs(seededRandom(seed + 600) * 2);
    }
    val = Math.round(val * 10) / 10;
    GROUP_INDICATOR_DATA[key][def.id] = {
      value: val,
      status: determineStatus(def, val)
    };
  });
});

// 时间偏移映射：不同时间范围对应不同的数值偏移种子
var TIME_OFFSET_SEEDS = {
  'today': 0,
  'yesterday': 1000,
  'this-week': 2000,
  'last-week': 3000,
  'this-month': 4000,
  'last-month': 5000,
  'this-year': 6000,
  'last-year': 7000
};

// 根据时间key和自定义日期生成偏移种子
function getTimeSeed(timeKey) {
  if (timeKey.indexOf('custom:') === 0) {
    var parts = timeKey.split(':');
    var startStr = parts[1] || '2026-01-01';
    var endStr = parts[2] || (window.mockData && window.mockData.meta ? window.mockData.meta.date : new Date().toISOString().slice(0, 10));
    // 用日期字符串生成一个简单hash作为种子偏移
    var hash = 0;
    var combined = startStr + endStr;
    for (var i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 9000 + 8000;
  }
  return TIME_OFFSET_SEEDS[timeKey] || 0;
}

// 构建INDICATORS数组（用于渲染），timeKey影响数值，surgeryTypeFilter支持术种筛选
function buildIndicators(deptFilter, groupFilter, timeKey, surgeryTypeFilter, surgeryLevelFilter) {
  var result = [];
  var groupsToRender = [];
  var timeSeed = getTimeSeed(timeKey);
  // 术种筛选: surgeryTypeFilter = { category: 'all' | '一级分类', subType: 'all' | '具体术种' }
  var stFilter = surgeryTypeFilter || { category: 'all', subType: 'all' };
  // 手术等级筛选: surgeryLevelFilter = { levels: [] }
  var lvFilter = surgeryLevelFilter || { levels: [] };

  if (deptFilter === 'all' && groupFilter.length === 0) {
    groupsToRender = ALL_GROUPS;
  } else {
    ALL_GROUPS.forEach(function(g) {
      var matchDept = (deptFilter === 'all') || (g.dept === deptFilter);
      var matchGroup = (groupFilter.length === 0) || (groupFilter.indexOf(g.group) !== -1);
      if (matchDept && matchGroup) groupsToRender.push(g);
    });
  }

  // 根据术种筛选调整模拟数据：选了具体术种时数值有偏移（模拟不同术种的差异）
  var surgeryOffset = 0;
  var surgeryLabel = '全部术种';
  if (stFilter.category !== 'all') {
    // 用一级分类名生成确定性偏移
    var catHash = 0;
    for (var ci = 0; ci < stFilter.category.length; ci++) {
      catHash = ((catHash << 5) - catHash) + stFilter.category.charCodeAt(ci);
      catHash = catHash & catHash;
    }
    surgeryOffset = (seededRandom(Math.abs(catHash)) - 0.5) * 0.15;
    surgeryLabel = stFilter.category;
    if (stFilter.subTypes && stFilter.subTypes.length > 0) {
      // 多选术种：取所有选中术种偏移的平均值
      var totalSubOffset = 0;
      stFilter.subTypes.forEach(function(subName) {
        var subHash = 0;
        for (var si = 0; si < subName.length; si++) {
          subHash = ((subHash << 5) - subHash) + subName.charCodeAt(si);
          subHash = subHash & subHash;
        }
        totalSubOffset += (seededRandom(Math.abs(subHash) + 1000) - 0.5) * 0.1;
      });
      surgeryOffset += totalSubOffset / stFilter.subTypes.length;
      surgeryLabel = stFilter.subTypes.length <= 2 ? stFilter.subTypes.join('、') : ('已选' + stFilter.subTypes.length + '个术种');
    }
  }

  // 手术等级筛选：不同等级对指标值有不同的影响（高等级手术风险更高、耗时更长）
  var levelOffset = 0;
  var levelLabel = '全部等级';
  if (lvFilter.levels && lvFilter.levels.length > 0) {
    // 每个等级一个确定性偏移：等级越高，不良事件率/感染率等越高，利用率也越高
    var levelOffsets = { level1: -0.12, level2: -0.05, level3: 0.06, level4: 0.15 };
    var levelNames = { level1: '一级', level2: '二级', level3: '三级', level4: '四级' };
    var totalLevelOffset = 0;
    lvFilter.levels.forEach(function(lvId) {
      totalLevelOffset += levelOffsets[lvId] || 0;
    });
    levelOffset = totalLevelOffset / lvFilter.levels.length;
    levelLabel = lvFilter.levels.map(function(id) { return levelNames[id] || id; }).join('、') + '手术';
  }

  INDICATOR_DEFS.forEach(function(def) {
    var decisionGoal = getDecisionGoalKey(def.category);
    var totalValue = 0;
    var normalCount = 0, warnCount = 0, dangerCount = 0;
    var groupValues = []; // 存储每个组的详细值用于过程展示
    groupsToRender.forEach(function(g, gi) {
      var key = g.dept + '|' + g.group;
      var baseData = GROUP_INDICATOR_DATA[key][def.id];
      var seed = gi * 100 + INDICATOR_DEFS.indexOf(def) + timeSeed;
      var offset = (seededRandom(seed) - 0.5) * def.baseRange * 0.15;
      // 术种偏移 + 手术等级偏移影响数值
      var val = Math.round((baseData.value + offset) * (1 + surgeryOffset + levelOffset) * 10) / 10;
      var status = determineStatus(def, val);
      totalValue += val;
      if (status === 'normal') normalCount++;
      else if (status === 'warning') warnCount++;
      else dangerCount++;
      groupValues.push({ group: g.group, dept: g.dept, value: val, status: status });
    });
    var avgValue = groupsToRender.length > 0 ? Math.round(totalValue / groupsToRender.length * 10) / 10 : 0;
    // 卡片值直接取医疗组明细均值，状态严格由同一阈值函数判定。
    var overallStatus = determineStatus(def, avgValue);

    // 生成计算过程值（模拟当前筛选条件下的分子/分母等过程数据）
    var matchingCaseCount = getScenarioCaseCount(groupsToRender, timeKey, stFilter, lvFilter);
    var calcProcess = generateCalcProcess(def, avgValue, groupsToRender.length, timeKey, surgeryLabel, matchingCaseCount);

    result.push({
      id: def.id,
      name: def.name,
      dept: deptFilter === 'all' ? '全部科室' : deptFilter,
      groups: groupsToRender.map(function(g) { return g.group; }),
      category: def.category,
      categoryLabel: INDICATOR_CATEGORY_LABELS[def.category],
      decisionGoal: decisionGoal,
      decisionGoalLabel: DECISION_GOALS[decisionGoal].label,
      icon: def.icon,
      iconColor: def.iconColor,
      desc: def.desc,
      value: avgValue,
      unit: def.unit,
      status: overallStatus,
      dimension: def.dimension,
      formula: def.formula,
      dataSources: def.dataSources,
      thresholds: def.thresholds,
      groupCount: groupsToRender.length,
      normalCount: normalCount,
      warnCount: warnCount,
      dangerCount: dangerCount,
      surgeryType: surgeryLabel,
      surgeryLevel: levelLabel,
      groupValues: groupValues,
      calcProcess: calcProcess
    });
  });

  return result;
}

function getScenarioDateRange(timeKey) {
  var anchor = window.mockData && window.mockData.meta ? window.mockData.meta.date : new Date().toISOString().slice(0, 10);
  var anchorDate = new Date(anchor + 'T12:00:00');
  function fmt(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function shifted(days) {
    var date = new Date(anchorDate);
    date.setDate(date.getDate() + days);
    return date;
  }
  if (timeKey.indexOf('custom:') === 0) {
    var parts = timeKey.split(':');
    return { start: parts[1], end: parts[2] };
  }
  if (timeKey === 'yesterday') {
    var yesterday = fmt(shifted(-1));
    return { start: yesterday, end: yesterday };
  }
  if (timeKey === 'this-week' || timeKey === 'last-week') {
    var mondayOffset = -((anchorDate.getDay() + 6) % 7) + (timeKey === 'last-week' ? -7 : 0);
    return { start: fmt(shifted(mondayOffset)), end: fmt(shifted(mondayOffset + 6)) };
  }
  if (timeKey === 'this-month') return { start: anchor.slice(0, 8) + '01', end: anchor };
  if (timeKey === 'last-month') {
    var firstThisMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1, 12);
    var lastPrevious = new Date(firstThisMonth);
    lastPrevious.setDate(0);
    return { start: fmt(new Date(lastPrevious.getFullYear(), lastPrevious.getMonth(), 1, 12)), end: fmt(lastPrevious) };
  }
  if (timeKey === 'this-year') return { start: anchor.slice(0, 4) + '-01-01', end: anchor };
  if (timeKey === 'last-year') {
    var lastYear = String(anchorDate.getFullYear() - 1);
    return { start: lastYear + '-01-01', end: lastYear + '-12-31' };
  }
  return { start: anchor, end: anchor };
}

function getScenarioCaseCount(groupsToRender, timeKey, surgeryTypeFilter, surgeryLevelFilter) {
  if (!window.mockData || !Array.isArray(window.mockData.historicalCaseFacts)) return null;
  var range = getScenarioDateRange(timeKey);
  var available = window.mockData.meta && window.mockData.meta.availableDateRange;
  if (available && (range.end < available.start || range.start > available.end)) return null;
  var groupNames = groupsToRender.map(function(group) { return group.group; });
  var groupIds = (window.mockData.medicalGroups || []).filter(function(group) {
    return groupNames.indexOf(group.groupName) !== -1;
  }).map(function(group) { return group.id; });
  var levelMap = { level1: 'I', level2: 'II', level3: 'III', level4: 'IV' };
  var levels = (surgeryLevelFilter.levels || []).map(function(level) { return levelMap[level]; });
  var subTypes = surgeryTypeFilter.subTypes || [];

  return window.mockData.historicalCaseFacts.filter(function(fact) {
    return fact.date >= range.start && fact.date <= range.end &&
      (groupIds.length === 0 || groupIds.indexOf(fact.medicalGroupId) !== -1) &&
      (levels.length === 0 || levels.indexOf(fact.surgeryLevel) !== -1) &&
      (subTypes.length === 0 || subTypes.indexOf(fact.surgeryName) !== -1);
  }).length;
}

// 根据指标定义生成计算过程值（模拟当前筛选条件下的详细过程数据）
function generateCalcProcess(def, avgValue, groupCount, timeKey, surgeryLabel, matchingCaseCount) {
  var timeSeed = getTimeSeed(timeKey);
  var defIdx = INDICATOR_DEFS.indexOf(def);
  var baseSeed = defIdx * 77 + timeSeed;
  
  // 根据时间筛选确定统计范围内的台次量级
  var timeMultiplier = { 'today': 1, 'yesterday': 1, 'this-week': 5, 'last-week': 5, 'this-month': 22, 'last-month': 20, 'this-year': 260, 'last-year': 250 };
  var tm = timeMultiplier[timeKey] || 1;
  if (timeKey.indexOf('custom:') === 0) tm = 10;

  // 每组每日均台次约2-4台
  var surgeriesPerGroupPerDay = 3;
  var totalSurgeries = matchingCaseCount === null
    ? Math.max(1, Math.round(groupCount * surgeriesPerGroupPerDay * tm * (0.8 + seededRandom(baseSeed) * 0.4)))
    : matchingCaseCount;

  var process = {
    timeRange: timeKey,
    surgeryType: surgeryLabel,
    groupCount: groupCount,
    totalSurgeries: totalSurgeries
  };

  // 根据不同指标生成不同的过程值
  switch (def.id) {
    case 'or-utilization':
      // 利用率 = 占用时长 / 可用时长
      var activeRooms = Math.max(1, Math.min(
        window.mockData && window.mockData.operatingRooms ? window.mockData.operatingRooms.length : 40,
        Math.ceil(groupCount / 2)
      ));
      var periodDays = timeKey === 'today' || timeKey === 'yesterday' ? 1 : Math.max(1, Math.ceil(totalSurgeries / Math.max(groupCount * 3, 1)));
      var availableMinutes = activeRooms * periodDays * 870;
      var usedMinutes = Math.round(availableMinutes * avgValue / 100);
      process.numerator = usedMinutes;
      process.numeratorLabel = '手术实际占用总时长';
      process.numeratorUnit = 'min';
      process.denominator = availableMinutes;
      process.denominatorLabel = '手术间可用总时长';
      process.denominatorUnit = 'min';
      process.extra = [
        { label: '开放手术间数', value: activeRooms + '间' },
        { label: '平均每间可用时长', value: '870min (14.5h)' },
        { label: '平均每间占用时长', value: Math.round(usedMinutes / activeRooms / periodDays) + 'min/日' },
        { label: '统计台次', value: totalSurgeries + '台' }
      ];
      break;
    case 'first-case-punctuality':
      var onTimeCount = Math.round(totalSurgeries * avgValue / 100);
      process.numerator = onTimeCount;
      process.numeratorLabel = '首台准点数';
      process.numeratorUnit = '台';
      process.denominator = totalSurgeries;
      process.denominatorLabel = '首台手术总数';
      process.denominatorUnit = '台';
      process.extra = [
        { label: '准点判定标准', value: '|实际入室-计划入室| ≤ 5min' },
        { label: '准点台次', value: onTimeCount + '台' },
        { label: '延迟台次', value: (totalSurgeries - onTimeCount) + '台' },
        { label: '平均延迟时长', value: Math.round(seededRandom(baseSeed + 1) * 20 + 8) + 'min' }
      ];
      break;
    case 'turnover-time':
      var turnoverCount = Math.max(1, totalSurgeries - groupCount);
      var totalTurnoverMin = Math.round(avgValue * turnoverCount);
      process.numerator = totalTurnoverMin;
      process.numeratorLabel = '∑接台间隔总时长';
      process.numeratorUnit = 'min';
      process.denominator = turnoverCount;
      process.denominatorLabel = '接台总次数';
      process.denominatorUnit = '次';
      process.extra = [
        { label: '接台次数', value: turnoverCount + '次' },
        { label: '最长接台间隔', value: Math.round(avgValue * 1.8) + 'min' },
        { label: '最短接台间隔', value: Math.round(avgValue * 0.5) + 'min' },
        { label: '统计台次', value: totalSurgeries + '台' }
      ];
      break;
    case 'surgery-duration-deviation':
      var deviationCount = Math.round(totalSurgeries * avgValue / 100);
      process.numerator = deviationCount;
      process.numeratorLabel = '偏差超限台数';
      process.numeratorUnit = '台';
      process.denominator = totalSurgeries;
      process.denominatorLabel = '总手术台数';
      process.denominatorUnit = '台';
      process.extra = [
        { label: '偏差判定标准', value: '|实际-预计| / 预计 > 25%' },
        { label: '平均偏差率', value: avgValue + '%' },
        { label: '最大偏差率', value: Math.round(avgValue * 2.2) + '%' },
        { label: '统计台次', value: totalSurgeries + '台' }
      ];
      break;
    case 'safety-check-completion':
      var completedCount = Math.round(totalSurgeries * avgValue / 100);
      process.numerator = completedCount;
      process.numeratorLabel = '完成三项核查台数';
      process.numeratorUnit = '台';
      process.denominator = totalSurgeries;
      process.denominatorLabel = '总手术台数';
      process.denominatorUnit = '台';
      process.extra = [
        { label: 'Sign-in完成率', value: Math.round(avgValue + seededRandom(baseSeed + 2) * 3) + '%' },
        { label: 'Time-out完成率', value: Math.round(avgValue + seededRandom(baseSeed + 3) * 2) + '%' },
        { label: 'Sign-out完成率', value: Math.round(avgValue - seededRandom(baseSeed + 4) * 2) + '%' },
        { label: '统计台次', value: totalSurgeries + '台' }
      ];
      break;
    case 'adverse-event-rate':
      var adverseCount = Math.max(0, Math.round(totalSurgeries * avgValue / 100));
      process.numerator = adverseCount;
      process.numeratorLabel = '不良事件数';
      process.numeratorUnit = '件';
      process.denominator = totalSurgeries;
      process.denominatorLabel = '总手术台数';
      process.denominatorUnit = '台';
      process.extra = [
        { label: '事件分级-Ⅰ级(警告)', value: Math.max(0, Math.round(adverseCount * 0.1)) + '件' },
        { label: '事件分级-Ⅱ级(不良)', value: Math.max(0, Math.round(adverseCount * 0.3)) + '件' },
        { label: '事件分级-Ⅲ级(未遂)', value: Math.max(0, Math.round(adverseCount * 0.6)) + '件' },
        { label: '统计台次', value: totalSurgeries + '台' }
      ];
      break;
    case 'instruments-turnover':
      var packCount = Math.max(1, Math.round(totalSurgeries * 1.5));
      var totalTime = Math.round(avgValue * packCount);
      process.numerator = totalTime;
      process.numeratorLabel = '∑器械包周转总时长';
      process.numeratorUnit = 'min';
      process.denominator = packCount;
      process.denominatorLabel = '器械包总数';
      process.denominatorUnit = '个';
      process.extra = [
        { label: '器械包数量', value: packCount + '个' },
        { label: '最长周转时间', value: Math.round(avgValue * 1.6) + 'min' },
        { label: '最短周转时间', value: Math.round(avgValue * 0.6) + 'min' },
        { label: '灭菌批次', value: Math.ceil(packCount / 8) + '批' }
      ];
      break;
    case 'unplanned-return-or':
      var returnCount = Math.max(0, Math.round(totalSurgeries * avgValue / 100));
      process.numerator = returnCount;
      process.numeratorLabel = '非计划重返手术台数';
      process.numeratorUnit = '台';
      process.denominator = totalSurgeries;
      process.denominatorLabel = '总手术台数';
      process.denominatorUnit = '台';
      process.extra = [
        { label: '术后出血重返', value: Math.max(0, Math.round(returnCount * 0.4)) + '台' },
        { label: '切口感染重返', value: Math.max(0, Math.round(returnCount * 0.3)) + '台' },
        { label: '其他原因重返', value: Math.max(0, Math.round(returnCount * 0.3)) + '台' },
        { label: '统计台次', value: totalSurgeries + '台' }
      ];
      break;
    case 'handover-completion':
      var handoverTotal = Math.round(totalSurgeries * 3); // 每台手术约3次交接
      var handoverComplete = Math.round(handoverTotal * avgValue / 100);
      process.numerator = handoverComplete;
      process.numeratorLabel = '完整交接次数';
      process.numeratorUnit = '次';
      process.denominator = handoverTotal;
      process.denominatorLabel = '总交接次数';
      process.denominatorUnit = '次';
      process.extra = [
        { label: '病房→手术室交接', value: Math.round(handoverTotal / 3) + '次' },
        { label: '手术室→复苏室交接', value: Math.round(handoverTotal / 3) + '次' },
        { label: '复苏室→病房交接', value: Math.round(handoverTotal / 3) + '次' },
        { label: '漏填项次', value: (handoverTotal - handoverComplete) + '次' }
      ];
      break;
    case 'hypothermia-rate':
      var hypoCount = Math.max(0, Math.round(totalSurgeries * avgValue / 100));
      process.numerator = hypoCount;
      process.numeratorLabel = '术中低体温例数';
      process.numeratorUnit = '例';
      process.denominator = totalSurgeries;
      process.denominatorLabel = '总手术台数';
      process.denominatorUnit = '台';
      process.extra = [
        { label: '低体温判定', value: '核心体温 < 36.0°C' },
        { label: '轻度(<36°C)', value: Math.max(0, Math.round(hypoCount * 0.6)) + '例' },
        { label: '中度(<35°C)', value: Math.max(0, Math.round(hypoCount * 0.3)) + '例' },
        { label: '重度(<34°C)', value: Math.max(0, Math.round(hypoCount * 0.1)) + '例' }
      ];
      break;
    case 'resource-conflict':
      var conflictCount = Math.max(0, Math.round(totalSurgeries * avgValue / 100));
      process.numerator = conflictCount;
      process.numeratorLabel = '资源冲突事件数';
      process.numeratorUnit = '件';
      process.denominator = totalSurgeries;
      process.denominatorLabel = '总手术排程数';
      process.denominatorUnit = '条';
      process.extra = [
        { label: '手术间冲突', value: Math.max(0, Math.round(conflictCount * 0.2)) + '件' },
        { label: '人员冲突', value: Math.max(0, Math.round(conflictCount * 0.4)) + '件' },
        { label: '设备冲突', value: Math.max(0, Math.round(conflictCount * 0.3)) + '件' },
        { label: '器械冲突', value: Math.max(0, Math.round(conflictCount * 0.1)) + '件' }
      ];
      break;
    case 'antibiotic-use-rate':
      var antibioticCount = Math.round(totalSurgeries * avgValue / 100);
      process.numerator = antibioticCount;
      process.numeratorLabel = '预防性使用抗菌药台数';
      process.numeratorUnit = '台';
      process.denominator = totalSurgeries;
      process.denominatorLabel = 'I类切口手术总数';
      process.denominatorUnit = '台';
      process.extra = [
        { label: '规范使用', value: Math.round(antibioticCount * 0.7) + '台' },
        { label: '超时使用', value: Math.round(antibioticCount * 0.2) + '台' },
        { label: '未规范使用', value: Math.round(antibioticCount * 0.1) + '台' },
        { label: '品种选择不适宜', value: Math.round(antibioticCount * 0.05) + '台' }
      ];
      break;
    case 'ssi-rate':
      var ssiCount = Math.max(0, Math.round(totalSurgeries * avgValue / 100));
      process.numerator = ssiCount;
      process.numeratorLabel = '手术部位感染例数';
      process.numeratorUnit = '例';
      process.denominator = totalSurgeries;
      process.denominatorLabel = '总手术台数';
      process.denominatorUnit = '台';
      process.extra = [
        { label: '切口浅部感染', value: Math.max(0, Math.round(ssiCount * 0.5)) + '例' },
        { label: '切口深部感染', value: Math.max(0, Math.round(ssiCount * 0.3)) + '例' },
        { label: '器官/腔隙感染', value: Math.max(0, Math.round(ssiCount * 0.2)) + '例' },
        { label: 'I类切口感染率', value: (Math.round(avgValue * 0.6 * 10) / 10) + '%' }
      ];
      break;
    case 'postop-followup-rate':
      var followedCount = Math.round(totalSurgeries * avgValue / 100);
      process.numerator = followedCount;
      process.numeratorLabel = '已完成随访例数';
      process.numeratorUnit = '例';
      process.denominator = totalSurgeries;
      process.denominatorLabel = '应随访总例数';
      process.denominatorUnit = '例';
      process.extra = [
        { label: '术后24h随访', value: Math.round(followedCount * 0.95) + '例' },
        { label: '术后48h随访', value: Math.round(followedCount * 0.88) + '例' },
        { label: '术后7天随访', value: Math.round(followedCount * 0.80) + '例' },
        { label: '术后30天随访', value: Math.round(followedCount * 0.65) + '例' }
      ];
      break;
    case 'mdt-discussion-rate':
      // 术前MDT讨论率 = 已开展MDT讨论的目录内手术数 / 目录内手术总数 × 100%
      var mdtDiscussed = Math.round(totalSurgeries * avgValue / 100);
      var mdtTotal = totalSurgeries + Math.round(seededRandom(baseSeed) * 5);
      process.numerator = mdtDiscussed;
      process.numeratorLabel = '已开展MDT讨论手术数';
      process.numeratorUnit = '台';
      process.denominator = mdtTotal;
      process.denominatorLabel = '应行MDT讨论手术总数';
      process.denominatorUnit = '台';
      process.extra = [
        { label: '四级手术讨论', value: Math.round(mdtDiscussed * 0.55) + '台' },
        { label: '复杂疑难手术讨论', value: Math.round(mdtDiscussed * 0.25) + '台' },
        { label: '多学科联合手术讨论', value: Math.round(mdtDiscussed * 0.12) + '台' },
        { label: '其他触发条件讨论', value: Math.round(mdtDiscussed * 0.08) + '台' }
      ];
      break;
    case 'mdt-participation-rate':
      // MDT邀请科室参与率 = 实际参与科室数 / 应参与科室数 × 100%
      var invitedDepts = Math.round(seededRandom(baseSeed + 1) * 8 + 20);
      var actualDepts = Math.round(invitedDepts * avgValue / 100);
      process.numerator = actualDepts;
      process.numeratorLabel = '实际参与科室数';
      process.numeratorUnit = '个';
      process.denominator = invitedDepts;
      process.denominatorLabel = '应参与科室总数';
      process.denominatorUnit = '个';
      process.extra = [
        { label: 'MDT讨论场次', value: Math.round(totalSurgeries * 0.3) + '场' },
        { label: '平均每场邀请科室', value: Math.round(invitedDepts / Math.max(totalSurgeries, 1) * 0.3) + '个' },
        { label: '缺席科室数', value: (invitedDepts - actualDepts) + '个' },
        { label: '统计周期', value: surgeryLabel }
      ];
      break;
    default:
      process.numerator = totalSurgeries;
      process.numeratorLabel = '分子';
      process.numeratorUnit = '';
      process.denominator = totalSurgeries;
      process.denominatorLabel = '分母';
      process.denominatorUnit = '';
      process.extra = [
        { label: '统计台次', value: totalSurgeries + '台' },
        { label: '统计范围', value: surgeryLabel }
      ];
  }

  return process;
}


// Source: decision-app/alert-warning.js
// 围手术期手术重大风险自动监管 - 数据与规则引擎
// 数据来源以 data.js 的真实手术实例为主；补充字段均采用稳定种子生成，便于演示和回归。
// 本文件保持 classic script 形式，并兼容原 generateWarningEvents/getWarningStats API。

// ====================================================================
// 一、分级响应与升级策略
// ====================================================================
var WARNING_LEVELS = {
  red: {
    key: 'red', name: '红色预警', shortName: '红', level: 3,
    color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)',
    textColor: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.30)', icon: '🔴',
    desc: '危及生命或触及手术安全否决项，立即拦截并启动应急响应',
    responseTime: '立即响应', responseMinutes: 1,
    responseLead: '主刀医师、麻醉医师、手术室护士长',
    escalation: '同步科主任和医务处；未读满5分钟自动语音催办并升级'
  },
  orange: {
    key: 'orange', name: '橙色预警', shortName: '橙', level: 2,
    color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)',
    textColor: '#fcd34d', borderColor: 'rgba(245, 158, 11, 0.30)', icon: '🟠',
    desc: '已出现明确风险，需限时确认、干预并跟踪处置结果',
    responseTime: '10分钟内响应', responseMinutes: 10,
    responseLead: '主刀医师或麻醉医师、责任护士',
    escalation: '超时沿责任链升级至科主任'
  },
  yellow: {
    key: 'yellow', name: '黄色预警', shortName: '黄', level: 1,
    color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.15)',
    textColor: '#fde047', borderColor: 'rgba(234, 179, 8, 0.30)', icon: '🟡',
    desc: '潜在风险或流程偏差，需复核、记录并纳入交接',
    responseTime: '30分钟内响应', responseMinutes: 30,
    responseLead: '责任医师、巡回护士',
    escalation: '班组内闭环，未完成项进入日清单和周汇总'
  }
};

// ====================================================================
// 二、手术重大风险规则目录
// 工作簿共86项事件规则，其中10项为管理指标；本目录纳入74项单台手术规则。
// 另有9项高危评分因子。资源成本类规则不进入本系统。
// ====================================================================
function _riskRule(id, phase, category, level, name, threshold, sourceSystem, riskScore, detector, advice) {
  var phaseLabel = phase === 'preop' ? '术前' : (phase === 'intraop' ? '术中' : '术后与出院');
  return {
    id: id,
    phase: phase,
    phaseName: phaseLabel,
    phaseLabel: phaseLabel,
    category: category,
    level: level,
    name: name,
    threshold: threshold,
    sourceSystem: sourceSystem,
    source: sourceSystem,
    riskScore: riskScore,
    detector: detector || 'rule-field',
    advice: advice || '请责任团队复核原始记录并按院内制度完成处置闭环',
    responseSla: WARNING_LEVELS[level].responseTime,
    responseSlaMinutes: WARNING_LEVELS[level].responseMinutes,
    autoDetect: detector !== 'manual',
    manualTrigger: true
  };
}

var SURGICAL_RISK_RULES = [
  // 术前：25项
  _riskRule('PRE-01', 'preop', '准入与授权', 'red', '主刀权限与手术分级不匹配', '主刀医师授权级别低于拟实施手术级别', '手术排程/人员资质', 3, 'authorization'),
  _riskRule('PRE-02', 'preop', '准入与授权', 'red', '高等级手术审批未完成', '规定审批节点未全部完成仍进入排程', 'OA/手术排程', 3, 'approval'),
  _riskRule('PRE-03', 'preop', '准入与授权', 'red', '限制类医疗技术备案缺失', '手术涉及限制类技术且备案状态无效', '医疗技术管理', 3, 'filing'),
  _riskRule('PRE-04', 'preop', '术前准备', 'orange', '术前讨论未完成', '规定时点前无有效术前讨论记录', '电子病历', 2, 'discussion'),
  _riskRule('PRE-05', 'preop', '知情同意', 'red', '手术知情同意缺失或签署不完整', '术前核查时无有效签署记录或关键项缺失', '电子病历/电子签名', 3, 'consent'),
  _riskRule('PRE-06', 'preop', '麻醉安全', 'orange', '麻醉术前访视未完成', '麻醉实施前无有效访视和计划记录', '麻醉信息系统', 2, 'anesthesia-visit'),
  _riskRule('PRE-07', 'preop', '检验检查', 'red', '术前危急值未闭环', '危急值已确认但无复核、处置或再次评估记录', 'LIS/电子病历', 3, 'critical-value'),
  _riskRule('PRE-08', 'preop', '检验检查', 'orange', '血红蛋白低于手术安全线', '血红蛋白低于院内分术式阈值且无处置计划', 'LIS', 2, 'hemoglobin'),
  _riskRule('PRE-09', 'preop', '检验检查', 'orange', '血小板低于手术安全线', '血小板低于院内分术式阈值且无处置计划', 'LIS', 2, 'platelet'),
  _riskRule('PRE-10', 'preop', '检验检查', 'orange', '凝血功能异常未处置', '凝血指标达到院内阈值且无复核或纠正记录', 'LIS', 2, 'coagulation'),
  _riskRule('PRE-11', 'preop', '检验检查', 'orange', '必需检查缺失或已过有效期', '术式必需检查未完成或超出院内有效期', 'HIS/PACS/LIS', 2, 'exam-validity'),
  _riskRule('PRE-12', 'preop', '检验检查', 'yellow', '关键报告未签署', '关键影像、病理或会诊报告处于未签署状态', 'PACS/病理/电子病历', 1, 'report-sign'),
  _riskRule('PRE-13', 'preop', '身份与术式', 'red', '身份、部位或术式多源信息不一致', '两类及以上来源记录不一致', 'HIS/电子病历/排程', 4, 'cross-check'),
  _riskRule('PRE-14', 'preop', '备血保障', 'orange', '备血方案未落实', '预计出血风险达到院内标准但备血确认未完成', '输血信息系统', 2, 'blood-plan'),
  _riskRule('PRE-15', 'preop', '患者优化', 'yellow', '营养风险未干预', '营养风险筛查阳性且无干预或会诊记录', '护理/营养系统', 1, 'nutrition'),
  _riskRule('PRE-16', 'preop', 'VTE防治', 'orange', 'VTE风险评估未完成', '术前规定时点无有效VTE评估或风险等级', '护理/电子病历', 2, 'vte-assessment'),
  _riskRule('PRE-17', 'preop', '用药安全', 'orange', '抗凝或抗血小板停药不符合方案', '用药记录与围术期停药方案冲突', '药学/HIS/电子病历', 2, 'anticoagulation'),
  _riskRule('PRE-18', 'preop', '患者优化', 'orange', '术前血糖控制未达标', '血糖超院内阈值且无调整或复测记录', 'LIS/床旁检测', 2, 'glucose'),
  _riskRule('PRE-19', 'preop', '患者优化', 'orange', '术前血压控制未达标', '血压持续超院内阈值且无评估或处置记录', '护理/麻醉系统', 2, 'blood-pressure'),
  _riskRule('PRE-20', 'preop', '感染预防', 'yellow', '预防性抗菌药给药超窗', '切皮前给药时点不符合院内规定', '医嘱/麻醉系统', 1, 'antibiotic-window'),
  _riskRule('PRE-21', 'preop', '肿瘤治疗衔接', 'yellow', '新辅助治疗至手术间隔异常', '实际间隔超出病种路径允许范围', '肿瘤专病/电子病历', 1, 'neoadjuvant-interval'),
  _riskRule('PRE-22', 'preop', '麻醉安全', 'orange', '禁食禁饮不符合要求', '患者实际摄入时间未满足麻醉方案要求', '护理/麻醉系统', 2, 'fasting'),
  _riskRule('PRE-23', 'preop', '身份与术式', 'red', '手术部位未标记', '需标记手术在入室前无有效部位标记记录', '护理/手术室系统', 3, 'site-mark'),
  _riskRule('PRE-24', 'preop', '重大手术决策', 'orange', '四级手术MDT未完成', '四级手术在规定时点无有效MDT结论', 'MDT/电子病历', 2, 'mdt'),
  _riskRule('PRE-25', 'preop', '麻醉安全', 'orange', '高麻醉风险未复核', 'ASA III级及以上或高风险患者无上级医师复核', '麻醉信息系统', 2, 'anesthesia-review'),

  // 术中：23项
  _riskRule('INTRA-01', 'intraop', '安全核查', 'red', '三方安全核查未完成或存在冲突', '麻醉前、切皮前、离室前三阶段任一应核节点缺失或异常', '手术室/麻醉系统', 4, 'safety-check'),
  _riskRule('INTRA-02', 'intraop', '危机事件', 'red', '红色危机事件', '心跳骤停、室颤、心肌梗死、紧急气道危机、大出血凝血异常、恶性高热或手术火灾任一发生', '监护设备/麻醉事件/手动触发', 4, 'red-crisis'),
  _riskRule('INTRA-03', 'intraop', '危机事件', 'orange', '橙色危机事件', '持续低血压、恶性高血压、急性心衰或低氧血症达到院内分级阈值', '监护设备/麻醉事件', 3, 'orange-crisis'),
  _riskRule('INTRA-04', 'intraop', '危机事件', 'yellow', '黄色危机事件', '血流动力学持续不稳定，如MAP较基础值波动>30%持续15分钟', '监护设备', 1, 'yellow-crisis'),
  _riskRule('INTRA-05', 'intraop', '生命体征', 'orange', '术中持续低血压', 'MAP<60mmHg持续10分钟，或SBP<90mmHg持续15分钟', '麻醉监护', 2, 'vital-bp'),
  _riskRule('INTRA-06', 'intraop', '生命体征', 'orange', '术中低氧血症', 'SpO₂<90%持续2分钟', '麻醉监护', 2, 'vital-spo2'),
  _riskRule('INTRA-07', 'intraop', '生命体征', 'yellow', '术中心率严重异常', 'HR<40次/min或>130次/min持续5分钟且无处置记录', '麻醉监护', 2, 'vital-hr'),
  _riskRule('INTRA-08', 'intraop', '体温管理', 'orange', '术中低体温且无主动保温', '核心体温<36.0℃且无主动保温记录', '麻醉监护/麻醉记录', 2, 'vital-temp'),
  _riskRule('INTRA-09', 'intraop', '出血管理', 'red', '术中出血量梯度异常', '400mL提示、800mL红色预警、1600mL启动大量输血流程', '麻醉/护理记录', 3, 'blood-loss'),
  _riskRule('INTRA-10', 'intraop', '输血闭环', 'orange', '紧急用血发血超时', '紧急同型用血>15分钟，或非同型用血>30分钟', '输血管理系统', 3, 'emergency-blood'),
  _riskRule('INTRA-11', 'intraop', '输血闭环', 'red', '输血核对或输注记录不完整', '未执行双人扫码核对，或单袋输注超过4小时', '输血/护理系统', 4, 'transfusion-check'),
  _riskRule('INTRA-12', 'intraop', '输血安全', 'red', '疑似输血不良反应未即时上报', '出现反应标记且未立即停止输注，或30分钟内未上报', '输血/不良事件系统', 4, 'transfusion-reaction'),
  _riskRule('INTRA-13', 'intraop', '知情同意', 'red', '术中变更术式未重新履行知情同意', '实际术式超出同意范围且无补充签署，抢救情形除外', '手术记录/电子签名', 4, 'procedure-change'),
  _riskRule('INTRA-14', 'intraop', '病理联动', 'orange', '术中冰冻病理与术前诊断不符', '冰冻结果改变手术方案且无上级医师或MDT决策记录', '病理/手术室系统', 3, 'frozen-pathology'),
  _riskRule('INTRA-15', 'intraop', '物品清点', 'red', '器械敷料清点不符', '术前、关腔前、关腔后任两次清点结果不一致', '护理/手术室系统', 4, 'count-check'),
  _riskRule('INTRA-16', 'intraop', '标本管理', 'orange', '手术标本流转异常', '离体30分钟未固定登记、标识不一致或规定时点未送达病理科', '手术室/病理系统', 2, 'specimen-chain'),
  _riskRule('INTRA-17', 'intraop', '手术时长', 'orange', '手术时长梯度超时', '超计划20%推送组长，超30%推送科主任，继续超时升级医务处', '手术排程/麻醉系统', 3, 'duration-gradient'),
  _riskRule('INTRA-18', 'intraop', '感染预防', 'orange', '术中预防用抗菌药物追加遗漏', '手术>3小时或失血量>1500mL且未追加一剂', '医嘱/麻醉系统', 1, 'antibiotic-redose'),
  _riskRule('INTRA-19', 'intraop', '器官灌注', 'yellow', '术中少尿', '尿量<0.5mL/kg/h持续2小时', '麻醉记录', 2, 'oliguria'),
  _riskRule('INTRA-20', 'intraop', '代谢管理', 'yellow', '术中血糖异常无处置', '血糖>10或<3.9mmol/L且30分钟内无处置', '床旁检测/麻醉系统', 2, 'intra-glucose'),
  _riskRule('INTRA-21', 'intraop', '不良事件', 'red', '术中其他非计划事件', '返流误吸、术中知晓、脏器损伤、中转开腹等任一事件被标记', '麻醉/不良事件系统', 4, 'adverse-event'),
  _riskRule('INTRA-23', 'intraop', '麻醉质控', 'orange', '全麻苏醒延迟或PACU停留超长', '术毕至拔管>60分钟，或PACU停留>2小时', '麻醉/PACU系统', 2, 'delayed-recovery'),
  _riskRule('INTRA-24', 'intraop', '转运去向', 'red', '术后非计划转入ICU', '术前计划返回病房且实际转入ICU', 'HIS/麻醉系统', 4, 'unplanned-icu'),

  // 术后与出院：26项
  _riskRule('POST-01', 'postop', '严重转归', 'red', '非计划再次手术', '同次住院发生非计划再次手术', 'HIS/手术排程', 4, 'reoperation'),
  _riskRule('POST-02', 'postop', '严重转归', 'red', '围手术期死亡', '围手术期发生非预期死亡', 'HIS/病案', 4, 'mortality'),
  _riskRule('POST-03', 'postop', '术后并发症', 'red', '术后活动性出血', '生命体征、引流量或血红蛋白变化提示持续出血', '护理/LIS', 3, 'post-bleeding'),
  _riskRule('POST-04', 'postop', '术后并发症', 'red', '吻合口瘘或重要脏器瘘', '影像、引流或临床记录满足院内识别标准', 'HIS/PACS/LIS', 3, 'leak'),
  _riskRule('POST-05', 'postop', '感染管理', 'orange', '手术部位感染风险', '切口或深部感染证据达到监测标准', '院感/HIS/LIS', 3, 'ssi'),
  _riskRule('POST-06', 'postop', 'VTE防治', 'red', '术后VTE或肺栓塞', '影像或临床诊断提示DVT/PE', 'PACS/HIS', 3, 'vte-event'),
  _riskRule('POST-07', 'postop', '感染管理', 'orange', '术后肺部感染', '影像、体温和感染指标满足院内监测条件', 'PACS/LIS/HIS', 3, 'pneumonia'),
  _riskRule('POST-08', 'postop', '感染管理', 'yellow', '导管相关感染风险', '导管留置和感染证据达到监测条件', '护理/院感/LIS', 2, 'catheter-infection'),
  _riskRule('POST-09', 'postop', '脏器保护', 'orange', '急性肾损伤风险', '肌酐或尿量变化达到院内AKI识别条件', 'LIS/护理', 3, 'aki'),
  _riskRule('POST-10', 'postop', '加速康复', 'yellow', '胃肠功能恢复延迟', '排气、进食或活动里程碑晚于病种路径', '护理/路径系统', 1, 'gi-recovery'),
  _riskRule('POST-11', 'postop', '疼痛管理', 'yellow', '术后疼痛控制不佳', '静息或活动疼痛评分持续超过院内阈值', '护理/麻醉随访', 1, 'pain'),
  _riskRule('POST-12', 'postop', '疼痛管理', 'orange', '镇痛泵运行异常', '设备报警、处方偏差或镇痛不足未闭环', '设备/麻醉随访', 2, 'analgesia-pump'),
  _riskRule('POST-13', 'postop', '感染管理', 'orange', '术后持续发热', '体温持续超过院内时长阈值且未查因', '护理/LIS', 2, 'fever'),
  _riskRule('POST-14', 'postop', '抗菌药管理', 'yellow', '术后抗菌药疗程偏离路径', '用药天数超出病种路径且无说明', '医嘱/药学', 1, 'antibiotic-duration'),
  _riskRule('POST-15', 'postop', '肿瘤病理', 'orange', '切缘阳性待决策', '术后病理报告切缘阳性且无后续治疗决策', '病理/肿瘤专病', 2, 'positive-margin'),
  _riskRule('POST-16', 'postop', '肿瘤病理', 'yellow', '淋巴结检出数不足', '检出数量低于病种质控标准且无说明', '病理/病案', 1, 'lymph-node'),
  _riskRule('POST-17', 'postop', '肿瘤病理', 'red', '快速与常规病理关键结论不一致', '关键诊断差异可能影响手术或后续治疗决策', '病理/电子病历', 4, 'pathology-discordance'),
  _riskRule('POST-18', 'postop', '交接安全', 'orange', '四级手术床旁交接不完整', '关键交接项、接收人或交接时间缺失', '护理/HIS', 2, 'bedside-handover'),
  _riskRule('POST-19', 'postop', '麻醉随访', 'yellow', '麻醉术后随访未完成', '规定时限内无有效麻醉随访记录', '麻醉信息系统', 1, 'anesthesia-followup'),
  _riskRule('POST-20', 'postop', '管路安全', 'red', '意外拔管或关键管路事件', '出现非计划拔管、脱落、堵塞或误接', '护理/不良事件', 4, 'tube-event'),
  _riskRule('POST-21', 'postop', '护理安全', 'yellow', '围手术期压力性损伤', '出现新发压力性损伤或风险措施中断', '护理系统', 2, 'pressure-injury'),
  _riskRule('POST-22', 'postop', 'VTE防治', 'orange', '高VTE风险患者出院前未拦截', '高风险患者出院医嘱缺少预防或宣教要素', 'HIS/护理', 2, 'discharge-vte'),
  _riskRule('POST-23', 'postop', 'VTE防治', 'orange', 'VTE预防措施中断', '药物或机械预防中断超过院内时限且无说明', '医嘱/护理', 2, 'vte-interruption'),
  _riskRule('POST-24', 'postop', '非计划转归', 'orange', '非计划再入院', '出院后规定窗口内因手术相关问题再次入院', 'HIS/随访', 3, 'readmission'),
  _riskRule('POST-25', 'postop', '效率与安全', 'yellow', '住院日明显偏离病种路径', '实际住院日超过病种路径上限且无合理说明', 'HIS/路径系统', 1, 'length-of-stay'),
  _riskRule('POST-26', 'postop', '加速康复', 'yellow', 'ERAS关键里程碑完成不足', '早进食、早活动、管路管理或随访里程碑未完成', '路径/护理/随访', 1, 'eras')
];

var SURGICAL_RISK_CATALOG_META = {
  version: '2026.08',
  workbookEventRuleCount: 86,
  clinicalProcessRuleCount: 74,
  surgeryProcessRuleCount: SURGICAL_RISK_RULES.length,
  managementIndicatorCount: 10,
  highRiskFactorCount: 9,
  excludedRuleCount: 2,
  excludedRuleIds: ['PRE-26', 'INTRA-22'],
  scopeNote: '单台手术安全与质量风险；不覆盖院内物流和资源成本管理',
  thresholdNote: '演示阈值来自质控清单，正式启用前须经医院手术质量安全管理组织审定',
  phases: { preop: 25, intraop: 23, postop: 26 },
  levels: { red: 0, orange: 0, yellow: 0 },
  sourceSystems: ['HIS', '电子病历', '手术排程', '麻醉监护', 'LIS', 'PACS', '病理', '护理', '院感', '随访']
};
SURGICAL_RISK_RULES.forEach(function(rule) {
  SURGICAL_RISK_CATALOG_META.levels[rule.level] += 1;
});

// 高危评分因子（总分≥6进入重点监管清单）。
var SURGICAL_HIGH_RISK_FACTORS = [
  { key: 'hypothermia', name: '术中低体温', score: 2, ruleIds: ['INTRA-08'] },
  { key: 'duration20', name: '手术时长超过计划20%', score: 2, ruleIds: ['INTRA-17'] },
  { key: 'duration30', name: '手术时长超过计划30%', score: 3, ruleIds: ['INTRA-17'] },
  { key: 'bloodLoss', name: '术中出血量≥800mL', score: 3, ruleIds: ['INTRA-09'] },
  { key: 'unplannedEvent', name: '术中非计划事件', score: 4, ruleIds: ['INTRA-02', 'INTRA-21'] },
  { key: 'unplannedIcu', name: '非计划转入ICU', score: 4, ruleIds: ['INTRA-24'] },
  { key: 'postComplication', name: '术后重大并发症', score: 3, ruleIds: ['POST-01', 'POST-03', 'POST-04', 'POST-05', 'POST-06', 'POST-07', 'POST-09', 'POST-17', 'POST-20', 'POST-24'] },
  { key: 'consentDefect', name: '知情同意缺陷', score: 3, ruleIds: ['PRE-05', 'INTRA-11'] },
  { key: 'vteOrFollowup', name: 'VTE高风险或重点随访缺失', score: 2, ruleIds: ['PRE-16', 'POST-19', 'POST-22', 'POST-23'] }
];

var WARNING_RESPONSE_FLOW = [
  { step: 1, name: '自动识别', desc: '多系统采集原始证据并按规则持续计算', responsible: '监管引擎', sla: '实时/准实时' },
  { step: 2, name: '分级推送', desc: '按红橙黄分级推送至手术团队和管理责任链', responsible: '消息中心', sla: '触发后即刻' },
  { step: 3, name: '确认处置', desc: '责任人确认、记录措施并关联原始病历证据', responsible: '手术团队', sla: '按级别时限' },
  { step: 4, name: '超时升级', desc: '未读或未响应事件自动催办并逐级升级', responsible: '消息中心/医务处', sla: '红色未读5分钟自动语音催办' },
  { step: 5, name: '闭环复盘', desc: '记录转归、根因和改进任务，纳入管理指标PDCA', responsible: '科室/医务处', sla: '规定时限内归档' }
];

// ====================================================================
// 三、目录兼容结构
// ====================================================================
function _warningRulesToGroups(level) {
  var groups = {};
  SURGICAL_RISK_RULES.forEach(function(rule) {
    if (rule.level !== level) return;
    if (!groups[rule.category]) groups[rule.category] = [];
    groups[rule.category].push({
      id: rule.id, name: rule.name, threshold: rule.threshold,
      valueType: rule.detector, desc: rule.advice, phase: rule.phase,
      phaseName: rule.phaseName, sourceSystem: rule.sourceSystem,
      riskScore: rule.riskScore
    });
  });
  return Object.keys(groups).map(function(category) {
    return { category: category, indicators: groups[category] };
  });
}

var RED_WARNING_INDICATORS = _warningRulesToGroups('red');
var ORANGE_WARNING_INDICATORS = _warningRulesToGroups('orange');
var YELLOW_WARNING_INDICATORS = _warningRulesToGroups('yellow');

function _flattenWarningIndicators(indicatorGroups, level) {
  var result = [];
  indicatorGroups.forEach(function(group) {
    group.indicators.forEach(function(item) {
      var copy = {};
      Object.keys(item).forEach(function(key) { copy[key] = item[key]; });
      copy.level = level;
      copy.category = group.category;
      result.push(copy);
    });
  });
  return result;
}

var FLAT_RED_INDICATORS = _flattenWarningIndicators(RED_WARNING_INDICATORS, 'red');
var FLAT_ORANGE_INDICATORS = _flattenWarningIndicators(ORANGE_WARNING_INDICATORS, 'orange');
var FLAT_YELLOW_INDICATORS = _flattenWarningIndicators(YELLOW_WARNING_INDICATORS, 'yellow');

var _SURGICAL_RISK_RULE_MAP = {};
SURGICAL_RISK_RULES.forEach(function(rule) { _SURGICAL_RISK_RULE_MAP[rule.id] = rule; });

// ====================================================================
// 四、稳定种子、日期和过滤辅助函数
// ====================================================================
function _warningPadLeft(value, length, char) {
  var text = String(value);
  while (text.length < length) text = char + text;
  return text;
}

function warningSeededRandom(seed) {
  var x = Math.sin(seed * 9999 + 12345) * 10000;
  return x - Math.floor(x);
}

function _warningHash(text) {
  var hash = 2166136261;
  text = String(text || '');
  for (var i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

function _warningRoll(key) {
  return (_warningHash(key) % 100000) / 100000;
}

var WARNING_TIME_OFFSET_SEEDS = {
  today: 100, yesterday: 1100, 'this-week': 2100, 'last-week': 3100,
  'this-month': 4100, 'last-month': 5100, 'this-year': 6100, 'last-year': 7100
};

function getWarningTimeSeed(timeKey) {
  if (!timeKey) return 0;
  if (String(timeKey).indexOf('custom:') === 0) return _warningHash(timeKey) % 9000 + 8000;
  return WARNING_TIME_OFFSET_SEEDS[timeKey] || 0;
}

function _warningMockData() {
  return typeof window !== 'undefined' && window.mockData ? window.mockData : null;
}

function _warningAnchorDate() {
  var data = _warningMockData();
  return data && data.meta && data.meta.date ? data.meta.date : new Date().toISOString().slice(0, 10);
}

function _warningDateFromText(text) {
  var parts = String(text).slice(0, 10).split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
}

function _warningDateText(date) {
  return date.getFullYear() + '-' + _warningPadLeft(date.getMonth() + 1, 2, '0') + '-' + _warningPadLeft(date.getDate(), 2, '0');
}

function _warningShiftDate(dateText, days) {
  var date = _warningDateFromText(dateText);
  date.setDate(date.getDate() + days);
  return _warningDateText(date);
}

function _warningDaysBetween(startText, endText) {
  return Math.max(0, Math.round((_warningDateFromText(endText).getTime() - _warningDateFromText(startText).getTime()) / 86400000));
}

function _warningRange(timeKey) {
  var anchor = _warningAnchorDate();
  var anchorDate = _warningDateFromText(anchor);
  var day = anchorDate.getDay();
  var mondayOffset = -((day + 6) % 7);
  var monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1, 12);
  var previousMonthEnd = new Date(monthStart); previousMonthEnd.setDate(0);
  var previousMonthStart = new Date(previousMonthEnd.getFullYear(), previousMonthEnd.getMonth(), 1, 12);
  var rangeMap = {
    today: { start: anchor, end: anchor },
    yesterday: { start: _warningShiftDate(anchor, -1), end: _warningShiftDate(anchor, -1) },
    'this-week': { start: _warningShiftDate(anchor, mondayOffset), end: anchor },
    'last-week': { start: _warningShiftDate(anchor, mondayOffset - 7), end: _warningShiftDate(anchor, mondayOffset - 1) },
    'this-month': { start: _warningDateText(monthStart), end: anchor },
    'last-month': { start: _warningDateText(previousMonthStart), end: _warningDateText(previousMonthEnd) },
    'this-year': { start: anchorDate.getFullYear() + '-01-01', end: anchor },
    'last-year': { start: (anchorDate.getFullYear() - 1) + '-01-01', end: (anchorDate.getFullYear() - 1) + '-12-31' }
  };
  if (timeKey && String(timeKey).indexOf('custom:') === 0) {
    var custom = String(timeKey).split(':');
    return { start: custom[1] || anchor, end: custom[2] || custom[1] || anchor };
  }
  return rangeMap[timeKey] || rangeMap.today;
}

function _warningRangeDates(timeKey) {
  var range = _warningRange(timeKey);
  var totalDays = _warningDaysBetween(range.start, range.end) + 1;
  var maxSnapshots = 42;
  var step = Math.max(1, Math.ceil(totalDays / maxSnapshots));
  var dates = [];
  for (var offset = 0; offset < totalDays; offset += step) dates.push(_warningShiftDate(range.start, offset));
  if (dates[dates.length - 1] !== range.end) dates.push(range.end);
  return { dates: dates, totalDays: totalDays, sampleWeight: Math.max(1, Math.round(totalDays / dates.length)) };
}

function _warningTimeOnDate(rawTime, dateText, fallbackTime) {
  var time = fallbackTime || '08:00:00';
  if (rawTime) {
    var raw = String(rawTime);
    if (raw.indexOf(' ') !== -1) time = raw.split(' ')[1];
    else if (raw.indexOf('T') !== -1) time = raw.split('T')[1].slice(0, 8);
    else if (/^\d{1,2}:\d{2}/.test(raw)) time = raw.slice(0, 5) + ':00';
  }
  if (time.length === 5) time += ':00';
  return dateText + ' ' + time.slice(0, 8);
}

function _warningTimeShift(dateTime, minutes) {
  var normalized = String(dateTime).replace(' ', 'T');
  var date = new Date(normalized);
  if (isNaN(date.getTime())) return dateTime;
  date.setMinutes(date.getMinutes() + minutes);
  return _warningDateText(date) + ' ' + _warningPadLeft(date.getHours(), 2, '0') + ':' + _warningPadLeft(date.getMinutes(), 2, '0') + ':' + _warningPadLeft(date.getSeconds(), 2, '0');
}

function _warningMinutes(value) {
  var parts = String(value || '00:00').slice(0, 5).split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function _warningTimeFromMinutes(dateText, minutes) {
  while (minutes < 0) { dateText = _warningShiftDate(dateText, -1); minutes += 1440; }
  while (minutes >= 1440) { dateText = _warningShiftDate(dateText, 1); minutes -= 1440; }
  return dateText + ' ' + _warningPadLeft(Math.floor(minutes / 60), 2, '0') + ':' + _warningPadLeft(minutes % 60, 2, '0') + ':00';
}

function _warningMatchesFilters(surgery, deptFilter, groupFilter) {
  var depts = Array.isArray(deptFilter) ? deptFilter : [deptFilter || 'all'];
  var allDepts = depts.length === 0 || depts.indexOf('all') !== -1;
  var deptMatch = allDepts || depts.indexOf(surgery.department) !== -1;
  var groups = Array.isArray(groupFilter) ? groupFilter : (groupFilter && groupFilter !== 'all' ? [groupFilter] : []);
  var groupMatch = groups.length === 0 || groups.indexOf(surgery.medicalGroupName) !== -1;
  return deptMatch && groupMatch;
}

function _warningRule(ruleId) { return _SURGICAL_RISK_RULE_MAP[ruleId]; }

function _warningPhaseForSurgery(surgery) {
  if (!surgery.actualStartTime) return 'preop';
  if (!surgery.actualEndTime) return 'intraop';
  return 'postop';
}

function _warningExpectedCheckCount(surgery) {
  if (!surgery.actualStartTime) return 0;
  if (!surgery.actualEndTime) return 2;
  return 3;
}

function _warningLongestRun(samples, predicate) {
  var best=null,current=null;
  (samples||[]).slice().sort(function(a,b){return a.timeMin-b.timeMin;}).forEach(function(sample){
    if(sample.timeMin==null||!Number.isFinite(Number(sample.timeMin))||!predicate(sample)){current=null;return;}
    if(!current||sample.timeMin-current.end.timeMin>5)current={start:sample,end:sample,count:1,durationMinutes:0};
    else {current.end=sample;current.count++;current.durationMinutes=sample.timeMin-current.start.timeMin;}
    if(!best||current.durationMinutes>best.durationMinutes)best=Object.assign({},current);
  });
  return best;
}

// ====================================================================
// 五、事件构建与自动识别
// ====================================================================
function _warningBaseEvent(surgery, dateText, ruleId, evidence, options) {
  var rule = _warningRule(ruleId);
  options = options || {};
  if (window.RuleWorkflows && RuleWorkflows.status(ruleId) !== 'enabled') return null;
  if (!rule || (window.DecisionConfig && !DecisionConfig.get('risk', ruleId).enabled)) return null;
  var level = options.level || rule.level;
  var sourceTime = options.triggerTime || _warningTimeOnDate('', dateText, '08:00:00');
  var config = WARNING_LEVELS[level];
  var status = 'active', responseTime = null, resolvedTime = null, responseMinutes = null;
  var messageStatus = 'unread', escalationStatus = '待责任角色确认';
  var recipients = window.DecisionConfig ? DecisionConfig.get('risk', ruleId).recipients : [config.responseLead];

  return {
    id: 'SR-' + dateText.replace(/-/g, '') + '-' + surgery.surgeryNo + '-' + ruleId.replace('-', '') + (options.sourceId ? '-' + options.sourceId : ''),
    sourceType: 'surgery', supervisionType: 'major-risk',
    ruleId: rule.id, ruleVersion: SURGICAL_RISK_CATALOG_META.version,
    level: level, levelName: config.name, levelColor: config.color,
    phase: rule.phase, phaseName: rule.phaseName, phaseLabel: rule.phaseLabel, category: rule.category,
    indicator: rule.name, threshold: window.DecisionConfig && DecisionConfig.limits[rule.id] ? DecisionConfig.limits[rule.id].label + '：' + riskParameter(rule.id, DecisionConfig.limits[rule.id].value) : rule.threshold, desc: rule.advice,
    triggerValue: evidence, evidence: evidence, triggerEvidence: evidence,
    evidenceItems: options.evidenceItems || [{ label: '触发证据', value: evidence, source: rule.sourceSystem, time: sourceTime }],
    sourceSystem: options.sourceSystem || rule.sourceSystem,
    source: options.sourceSystem || rule.sourceSystem,
    autoDetected: options.autoDetected !== false && rule.autoDetect,
    patientId: surgery.patientId, patientName: surgery.patientName,
    surgeryId: surgery.id, surgeryNo: surgery.surgeryNo, surgeryName: surgery.surgeryName,
    surgeryLevel: surgery.surgeryLevel, surgeryStatus: surgery.status,
    roomName: surgery.operatingRoomNo || '-', operatingRoomNo: surgery.operatingRoomNo || '-',
    dept: surgery.department || '-', group: surgery.medicalGroupName || '-',
    surgeon: surgery.surgeonName || '-', anesthesiologist: surgery.anesthesiologistName || '-',
    triggerTime: sourceTime, occurrenceDate: dateText,
    status: status,
    statusName: status === 'active' ? '待响应' : (status === 'resolved' ? '已闭环' : '已升级'),
    responseStatus: !responseTime ? '待确认' : (resolvedTime ? '已闭环' : (status === 'escalated' ? '升级处置中' : '已响应')),
    messageStatus: messageStatus,
    responseTime: responseTime, responseMinutes: responseMinutes, resolvedTime: resolvedTime,
    responseSla: config.responseTime, responseLead: (recipients || []).join('、'), recipients: recipients,
    escalationPolicy: config.escalation, escalationStatus: escalationStatus,
    notificationChannels: level === 'red' ? ['系统弹窗', '移动端', '即时消息', 'AI语音'] : (level === 'orange' ? ['系统弹窗', '移动端', '即时消息'] : ['系统消息', '日清单']),
    riskContribution: options.riskScore === undefined ? rule.riskScore : options.riskScore,
    riskScore: 0, highRisk: false, scoreFactors: [],
    advice: options.advice || rule.advice,
    sourceRecordId: options.sourceId || '',
    isSimulatedSupplement: !!options.isSimulatedSupplement,
    sampleWeight: options.sampleWeight || 1
  };
}

function _warningPush(events, event) {
  if (!event) return;
  for (var i = 0; i < events.length; i++) {
    if (events[i].id === event.id) {
      if (WARNING_LEVELS[event.level].level > WARNING_LEVELS[events[i].level].level) events[i] = event;
      return;
    }
  }
  events.push(event);
}

function _warningDetectVitals(events, surgery, dateText, sampleWeight) {
  var samples = surgery.vitalSigns || [];
  if (!samples.length) return;

  var lowMap=_warningLongestRun(samples,function(v){return v.bpSys!=null&&v.bpDia!=null&&(Number(v.bpSys)+2*Number(v.bpDia))/3<60;});
  var lowSbp=_warningLongestRun(samples,function(v){return v.bpSys!=null&&Number(v.bpSys)<90;});
  var lowBp=lowMap&&lowMap.durationMinutes>=10?lowMap:lowSbp&&lowSbp.durationMinutes>=15?lowSbp:null;
  if(lowBp) _warningPush(events,_warningBaseEvent(surgery,dateText,'INTRA-05',
    (lowBp===lowMap?'MAP<60mmHg':'SBP<90mmHg')+'，连续'+lowBp.durationMinutes+'分钟',{
      triggerTime:_warningTimeOnDate(lowBp.end.time,dateText),sampleWeight:sampleWeight,
      sourceId:surgery.id+'-BP-'+lowBp.start.time
    }));

  var lowSpo2 = _warningLongestRun(samples, function(sample) { return sample.spo2!=null && Number(sample.spo2) < (window.riskParameter ? riskParameter('INTRA-06', 90) : 90); });
  if (lowSpo2 && lowSpo2.durationMinutes >= 2) {
    var minSpo2 = lowSpo2.start;
    samples.forEach(function(sample) { if (sample.spo2 < minSpo2.spo2) minSpo2 = sample; });
    _warningPush(events, _warningBaseEvent(surgery, dateText, 'INTRA-06',
      'SpO₂最低' + minSpo2.spo2 + '%，连续' + lowSpo2.durationMinutes + '分钟', {
        triggerTime: _warningTimeOnDate(lowSpo2.end.time, dateText, surgery.actualStartTime || '08:00'),
        level: minSpo2.spo2 < 86 ? 'red' : 'orange', sampleWeight: sampleWeight,
        evidenceItems: [
          { label: '最低SpO₂', value: minSpo2.spo2 + '%', source: '麻醉监护', time: _warningTimeOnDate(minSpo2.time, dateText) },
          { label: '连续时长', value: lowSpo2.durationMinutes + '分钟', source: '时序计算', time: _warningTimeOnDate(lowSpo2.end.time, dateText) }
        ]
      }));
  }

  var abnormalHr = _warningLongestRun(samples, function(sample) { return Number(sample.hr) < 40 || Number(sample.hr) > 130; });
  if (abnormalHr && abnormalHr.durationMinutes >= 5) {
    var extremeHr = abnormalHr.start;
    abnormalHr.count = abnormalHr.count || 1;
    _warningPush(events, _warningBaseEvent(surgery, dateText, 'INTRA-07',
      'HR ' + extremeHr.hr + '次/min，连续' + abnormalHr.durationMinutes + '分钟', {
        triggerTime: _warningTimeOnDate(abnormalHr.end.time, dateText, surgery.actualStartTime || '08:00'),
        level: extremeHr.hr < 35 || extremeHr.hr > 150 ? 'red' : 'orange', sampleWeight: sampleWeight
      }));
  }

  var lowTemp = _warningLongestRun(samples, function(sample) { return Number(sample.temp) < (window.riskParameter ? riskParameter('INTRA-08', 36) : 36); });
  if (lowTemp) {
    var minTemp = lowTemp.start;
    samples.forEach(function(sample) { if (sample.temp < minTemp.temp) minTemp = sample; });
    _warningPush(events, _warningBaseEvent(surgery, dateText, 'INTRA-08',
      '核心体温最低' + minTemp.temp + '℃，低温持续' + lowTemp.durationMinutes + '分钟', {
        triggerTime: _warningTimeOnDate(lowTemp.end.time, dateText, surgery.actualStartTime || '08:00'),
      level: 'orange', riskScore: 2, sampleWeight: sampleWeight
      }));
  }
}

function _warningDetectDuration(events, surgery, dateText, sampleWeight) {
  var planned = Number(surgery.plannedDuration) || 0;
  var actual = Number(surgery.actualDuration) || 0;
  if (!planned || !actual) return;
  var threshold = window.riskParameter ? riskParameter('INTRA-17', 20) : 20;
  if(actual < planned*(1+threshold/100))return;
  var deviation = Math.round((actual / planned - 1) * 100);
  var ruleId = 'INTRA-17';
  var threshold = window.riskParameter ? riskParameter('INTRA-17', 20) : 20;
  var triggerTime = _warningTimeFromMinutes(dateText, _warningMinutes(surgery.actualStartTime) + Math.ceil(planned * (1 + threshold / 100)));
  _warningPush(events, _warningBaseEvent(surgery, dateText, ruleId,
    '计划' + planned + '分钟，实际/当前' + actual + '分钟，超计划' + deviation + '%', {
      triggerTime: triggerTime,
      riskScore: deviation > 30 ? 3 : 2,
      sampleWeight: sampleWeight,
      evidenceItems: [
        { label: '计划时长', value: planned + '分钟', source: '手术排程', time: _warningTimeOnDate(surgery.plannedStartTime, dateText) },
        { label: '实际/当前时长', value: actual + '分钟', source: '麻醉系统', time: triggerTime },
        { label: '偏差', value: '+' + deviation + '%', source: '时序计算', time: triggerTime }
      ]
    }));
}

function _warningDetectSafetyCheck(events,surgery,dateText,sampleWeight){
  var checks=(_warningMockData().safetyChecks||[]).filter(function(check){return check.surgeryId===surgery.id&&check.checkTime;});
  checks.forEach(function(check){
    var abnormalItems=(check.checkItems||[]).filter(function(item){return ['需关注','未确认','不通过','异常'].indexOf(item.result)!==-1;});
    if(['有异常','不通过','未通过'].indexOf(check.result)===-1&&!abnormalItems.length)return;
    var evidence=check.checkName+'结果异常：'+(abnormalItems.map(function(item){return item.item;}).join('、')||check.notes||check.result);
    _warningPush(events,_warningBaseEvent(surgery,dateText,'INTRA-01',evidence,{
      triggerTime:_warningTimeOnDate(check.checkTime,dateText),sourceId:check.id,sampleWeight:sampleWeight
    }));
  });
}

function _warningRuleForAdverse(adverse) {
  var text = [adverse.eventType, adverse.description].join('');
  if (text.indexOf('输血') !== -1) return 'INTRA-12';
  if (text.indexOf('出血') !== -1) return 'INTRA-09';
  if (text.indexOf('感染') !== -1) return 'POST-05';
  if (text.indexOf('心跳') !== -1 || text.indexOf('室颤') !== -1 || text.indexOf('室速') !== -1) return 'INTRA-02';
  if (text.indexOf('拔管') !== -1 || text.indexOf('管路') !== -1) return 'POST-20';
  return 'INTRA-21';
}

function _warningDetectAdverse(events, surgery, dateText, sampleWeight) {
  var data = _warningMockData();
  var adverseEvents = data && Array.isArray(data.adverseEvents) ? data.adverseEvents : [];
  adverseEvents.filter(function(item) { return item.surgeryId === surgery.id; }).forEach(function(adverse) {
    var ruleId = _warningRuleForAdverse(adverse);
    var severity = adverse.severity || '';
    var level = severity === '危重' || severity === '严重' ? 'red' : (severity === '一般' ? 'orange' : 'yellow');
    if (ruleId === 'POST-05' && level === 'yellow') level = 'orange';
    var evidence = (adverse.eventType || '非计划事件') + '：' + (adverse.description || '已记录异常事件') + '；转归：' + (adverse.result || '持续观察');
    _warningPush(events, _warningBaseEvent(surgery, dateText, ruleId, evidence, {
      triggerTime: _warningTimeOnDate(adverse.occurrenceTime, dateText, surgery.actualStartTime || '08:00'),
      level: level, sourceId: adverse.id, sourceSystem: '不良事件/麻醉系统',
      riskScore: ruleId === 'INTRA-21' || ruleId === 'INTRA-02' ? 4 : 3,
      sampleWeight: sampleWeight,
      evidenceItems: [
        { label: '事件类型', value: adverse.eventType || '-', source: '不良事件系统', time: _warningTimeOnDate(adverse.occurrenceTime, dateText) },
        { label: '严重程度', value: severity || '-', source: '不良事件系统', time: _warningTimeOnDate(adverse.discoveryTime, dateText) },
        { label: '处置结果', value: adverse.result || '-', source: '不良事件系统', time: _warningTimeOnDate(adverse.reportTime, dateText) }
      ]
    }));
  });
}

function _warningAssignRiskScores(events) {
  var byCase = {};
  events.forEach(function(event) {
    var key = event.occurrenceDate + '|' + event.surgeryId;
    if (!byCase[key]) byCase[key] = { score: 0, factors: {}, events: [] };
    byCase[key].events.push(event);
    var factorKey = event.ruleId;
    var contribution = Number(event.riskContribution) || 0;
    if (!byCase[key].factors[factorKey] || byCase[key].factors[factorKey].score < contribution) {
      byCase[key].factors[factorKey] = { ruleId: event.ruleId, name: event.indicator, score: contribution };
    }
  });
  Object.keys(byCase).forEach(function(key) {
    var caseData = byCase[key];
    caseData.score = Object.keys(caseData.factors).reduce(function(sum, factorKey) { return sum + caseData.factors[factorKey].score; }, 0);
    var factors = Object.keys(caseData.factors).map(function(factorKey) { return caseData.factors[factorKey]; });
    caseData.events.forEach(function(event) {
      event.riskScore = caseData.score;
      event.highRisk = caseData.score >= 6;
      event.scoreFactors = factors;
    });
  });
}

// ====================================================================
// 六、公开生成函数（保持原API）
// ====================================================================
function generateWarningEvents(timeKey, deptFilter, groupFilter) {
  timeKey = timeKey || 'today';
  deptFilter = deptFilter || 'all';
  groupFilter = groupFilter || [];
  var data = _warningMockData();
  if (!data || !Array.isArray(data.surgeries)) return [];

  var surgeries = data.surgeries.filter(function(surgery) {
    return surgery.status !== '取消' && _warningMatchesFilters(surgery, deptFilter, groupFilter);
  });
  var range = _warningRangeDates(timeKey);
  var events = [];
  var dateText = data.meta.date;
  if(window.RuleWorkflows){
    RuleWorkflows.refreshSources(data);
    (data.businessEvents||[]).forEach(function(source){
      var result=RuleWorkflows.evaluateAuthorization(source);
      var surgery=surgeries.find(function(s){return s.id===source.surgeryId;});
      if(result.result==='abnormal'&&surgery){
        var time=source.occurredAt.replace('T',' ').slice(0,19);
        var event=_warningBaseEvent(surgery,time.slice(0,10),'PRE-01',result.evidence,{triggerTime:time,sourceId:source.id});
        if(event)_warningPush(events,event);
      }
    });
  }
  surgeries.forEach(function(surgery) {
    _warningDetectVitals(events, surgery, dateText, 1);
    _warningDetectDuration(events, surgery, dateText, 1);
    _warningDetectSafetyCheck(events, surgery, dateText, 1);
    _warningDetectAdverse(events, surgery, dateText, 1);
  });
  var asOf = String(data.meta.asOf).replace('T', ' ').slice(0, 19);
  events = events.filter(function(event) {
    return range.dates.indexOf(event.occurrenceDate) !== -1 && event.triggerTime <= asOf;
  });
  _warningAssignRiskScores(events);
  events.sort(function(a, b) {
    var timeCompare = b.triggerTime.localeCompare(a.triggerTime);
    if (timeCompare !== 0) return timeCompare;
    return WARNING_LEVELS[b.level].level - WARNING_LEVELS[a.level].level;
  });
  return events;
}

function getWarningStats(timeKey, deptFilter, groupFilter) {
  var events = generateWarningEvents(timeKey, deptFilter, groupFilter);
  var stats = {
    redCount: 0, orangeCount: 0, yellowCount: 0, totalCount: events.length,
    activeCount: 0, resolvedCount: 0, escalatedCount: 0, respondedCount: 0,
    unreadCount: 0, highRiskCaseCount: 0, responseRate: 0,
    red: 0, orange: 0, yellow: 0,
    phaseCounts: { preop: 0, intraop: 0, postop: 0 }
  };
  var highRiskCases = {};
  events.forEach(function(event) {
    stats[event.level + 'Count'] += 1;
    stats[event.level] += 1;
    if (stats.phaseCounts[event.phase] !== undefined) stats.phaseCounts[event.phase] += 1;
    if (event.status === 'active') stats.activeCount += 1;
    else if (event.status === 'resolved') stats.resolvedCount += 1;
    else if (event.status === 'escalated') stats.escalatedCount += 1;
    if (event.responseTime) stats.respondedCount += 1;
    if (event.messageStatus === 'unread') stats.unreadCount += 1;
    if (event.highRisk) highRiskCases[event.occurrenceDate + '|' + event.surgeryId] = true;
  });
  stats.highRiskCaseCount = Object.keys(highRiskCases).length;
  stats.responseRate = stats.totalCount ? Math.round(stats.respondedCount / stats.totalCount * 1000) / 10 : 0;
  return stats;
}

function getSurgicalRiskCases(timeKey, deptFilter, groupFilter) {
  var events = generateWarningEvents(timeKey, deptFilter, groupFilter);
  var cases = {};
  events.forEach(function(event) {
    var key = event.occurrenceDate + '|' + event.surgeryId;
    if (!cases[key]) {
      cases[key] = {
        id: key, occurrenceDate: event.occurrenceDate,
        surgeryId: event.surgeryId, surgeryNo: event.surgeryNo,
        patientId: event.patientId, patientName: event.patientName,
        surgeryName: event.surgeryName, surgeryLevel: event.surgeryLevel,
        surgeryStatus: event.surgeryStatus, roomName: event.roomName,
        dept: event.dept, group: event.group, surgeon: event.surgeon,
        riskScore: event.riskScore, highRisk: event.highRisk,
        highestLevel: event.level, topRisk: event.indicator,
        latestTriggerTime: event.triggerTime, activeCount: 0,
        eventCount: 0, events: []
      };
    }
    var item = cases[key];
    item.events.push(event);
    item.eventCount += 1;
    if (event.status === 'active') item.activeCount += 1;
    if (event.triggerTime > item.latestTriggerTime) item.latestTriggerTime = event.triggerTime;
    if (WARNING_LEVELS[event.level].level > WARNING_LEVELS[item.highestLevel].level) {
      item.highestLevel = event.level;
      item.topRisk = event.indicator;
    }
  });
  return Object.keys(cases).map(function(key) { return cases[key]; }).sort(function(a, b) {
    if (a.highRisk !== b.highRisk) return a.highRisk ? -1 : 1;
    if (a.riskScore !== b.riskScore) return b.riskScore - a.riskScore;
    return b.latestTriggerTime.localeCompare(a.latestTriggerTime);
  });
}

function getSurgicalRiskOverview(timeKey, deptFilter, groupFilter) {
  var data = _warningMockData();
  var monitoredSurgeries = data && Array.isArray(data.surgeries)
    ? data.surgeries.filter(function(surgery) { return surgery.status !== '取消' && _warningMatchesFilters(surgery, deptFilter || 'all', groupFilter || []); }).length
    : 0;
  var stats = getWarningStats(timeKey, deptFilter, groupFilter);
  return {
    monitoredSurgeries: monitoredSurgeries,
    ruleCount: SURGICAL_RISK_RULES.length,
    autoRuleCount: SURGICAL_RISK_RULES.filter(function(rule) { return rule.autoDetect; }).length,
    sourceSystemCount: SURGICAL_RISK_CATALOG_META.sourceSystems.length,
    highRiskCaseCount: stats.highRiskCaseCount,
    stats: stats,
    phaseCounts: stats.phaseCounts,
    thresholdNote: SURGICAL_RISK_CATALOG_META.thresholdNote
  };
}

// ====================================================================
// 七、便捷查询与旧接口兼容
// ====================================================================
function getWarningLevelConfig(level) { return WARNING_LEVELS[level] || null; }

function getWarningIndicatorsByLevel(level) {
  if (level === 'red') return FLAT_RED_INDICATORS;
  if (level === 'orange') return FLAT_ORANGE_INDICATORS;
  if (level === 'yellow') return FLAT_YELLOW_INDICATORS;
  return [];
}

function getWarningIndicatorGroups(level) {
  if (level === 'red') return RED_WARNING_INDICATORS;
  if (level === 'orange') return ORANGE_WARNING_INDICATORS;
  if (level === 'yellow') return YELLOW_WARNING_INDICATORS;
  return [];
}

function getSurgicalRiskRules(filter) {
  filter = filter || {};
  return SURGICAL_RISK_RULES.filter(function(rule) {
    return (!filter.phase || filter.phase === 'all' || rule.phase === filter.phase) &&
      (!filter.level || filter.level === 'all' || rule.level === filter.level) &&
      (!filter.category || filter.category === 'all' || rule.category === filter.category);
  });
}

function filterWarningEventsByLevel(events, level) {
  if (!events || !level || level === 'all') return events || [];
  return events.filter(function(event) { return event.level === level; });
}

function filterWarningEventsByStatus(events, status) {
  if (!events || !status || status === 'all') return events || [];
  return events.filter(function(event) { return event.status === status || event.messageStatus === status; });
}

function filterWarningEventsByDept(events, dept) {
  if (!events || !dept || dept === 'all') return events || [];
  return events.filter(function(event) { return event.dept === dept; });
}

function genWarningTriggerValue(valueType, seed) {
  var rule = SURGICAL_RISK_RULES.filter(function(item) { return item.detector === valueType || item.id === valueType; })[0];
  if (rule) return rule.threshold;
  return '规则触发证据 #' + _warningPadLeft((_warningHash(String(seed || 0)) % 999) + 1, 3, '0');
}

// Source: decision-app/rule-workflows.js
/* Published workflow contracts. Missing evidence never means a clinical abnormality. */
(function () {
  'use strict';
  const rows = `
PRE-01|event|主刀确认、变更或手术分级变更时|主刀授权与手术分级标准：I＜II＜III＜IV；按医师ID读取拟术式的有效授权，授权等级须覆盖拟实施级别|主刀确认事件、医师术式授权表（范围/有效期/等级）|准入合规
PRE-02|deadline|排程提交或术前审批截止时点|院内高等级手术审批矩阵：按分级、急诊例外逐项核对已签署审批节点|审批流程、节点截止时间、签名|准入合规|III,IV
PRE-03|event|限制类术式选定或备案信息变更时|限制类技术目录与备案有效期标准|技术备案目录、术式关联、备案有效期|准入合规
PRE-04|deadline|术前讨论截止或手术申请提交时|分术式术前讨论要求：必需记录、参与人、终签与完成时限|讨论记录、终签、病种路径截止时间|术前准备
PRE-05|event|术前核查提交或同意书更新时|该术式知情同意模板必填项与签署权限标准|同意书范围、电子签名、版本|准入合规
PRE-06|deadline|麻醉实施前核查节点到达时|术前访视与麻醉计划完整性标准|麻醉访视、计划、签署时间|麻醉安全
PRE-07|deadline|危急值确认后处置截止时点|院内危急值分级处置时限及闭环字段标准|危急值确认、处置、复核记录|术前准备
PRE-08|event|术前血常规报告签发或处置记录更新时|院内按术式和患者风险设定的血红蛋白安全线及处置要求|血红蛋白、术式阈值表、处置记录|术前准备
PRE-09|event|术前血常规报告签发或复核完成时|院内分术式血小板安全线与复核要求|血小板、术式阈值表、复核记录|术前准备
PRE-10|event|凝血结果签发或纠正方案更新时|院内凝血检验阈值与复核纠正标准|凝血结果、参考阈值、处置记录|术前准备
PRE-11|deadline|入室前资料核查节点到达时|按术式维护的必需检查清单与报告有效期|必需检查目录、报告、有效期|术前准备
PRE-12|event|关键报告发布或手术申请提交时|关键报告终签及签署人权限标准|报告状态、签署事件、关键报告目录|准入合规
PRE-13|event|身份、部位、术式核查提交或任一来源变更时|多源患者标识、手术部位、侧别与术式一致性标准|HIS、同意书、排程对应字段|手术安全
PRE-14|deadline|计划入室前备血截止时点|院内按术式及出血风险设定的备血方案标准|备血计划、配血确认、截止时间|输血安全
PRE-15|event|营养筛查完成或干预计划更新时|营养风险分层及阳性患者干预要求|营养评分、干预方案、会诊记录|术前准备
PRE-16|deadline|术前VTE评估截止时点|院内VTE风险评估表及适用人群规则|VTE评估记录、风险等级、截止时间|VTE防治
PRE-17|event|围术期用药方案签署或用药执行时|按药品与患者风险制定的停药和桥接方案|抗凝医嘱、执行记录、停药方案|用药安全
PRE-18|event|术前血糖采集、复测或调整方案更新时|院内术前血糖目标与异常后复测处置标准|血糖、患者目标区间、调整与复测|术前准备
PRE-19|stream|术前血压新采样到达时，按连续窗口判断|院内血压持续超限窗口及复核处置要求|血压序列、院内阈值、处置记录|术前准备
PRE-20|event|切皮事件到达或预防用药执行时|院内分药品切皮前给药时间窗|切皮时点、药品、给药执行、给药窗|感染预防
PRE-21|event|手术日期确认或新辅助疗程结束时|病种路径规定的新辅助治疗至手术间隔|病种路径、新辅助疗程、手术日期|治疗衔接
PRE-22|event|麻醉前禁食禁饮核查提交时|按麻醉方案和摄入类型配置的禁食禁饮间隔|最后摄入时间、摄入类型、麻醉方案|麻醉安全
PRE-23|event|入室前手术部位核查提交时|需标记的术式清单、部位标记与核查标准|部位标记记录、核查、术式目录|手术安全
PRE-24|deadline|四级手术排程审批或MDT截止时点|四级手术MDT适用范围、结论终签与豁免标准|MDT结论、术式分级、豁免记录|重大手术决策|IV
PRE-25|event|ASA评估完成或麻醉方案变更时|高ASA风险上级复核要求|ASA风险、上级复核签名|麻醉安全
INTRA-01|event|麻醉前、切皮前、离室前核查提交时|三阶段核查结果标准：任一提交结果异常即告警；缺失检查需独立节点完整性数据|安全核查结果、阶段、提交时间|手术安全
INTRA-02|event|监护危机事件或麻醉危机记录确认时|院内红色危机事件目录与事件编码|危机事件编码、确认时间|麻醉安全
INTRA-03|stream|监护新采样到达时，分级窗口持续判断|院内橙色危机分级阈值、持续时间及上下文标准|监护序列、危机标准、基线|麻醉安全
INTRA-04|stream|血流动力学采样到达时|院内MAP基线偏离幅度与持续15分钟窗口|MAP基线、连续MAP、采样时间|麻醉安全
INTRA-05|stream|血压新采样到达时，连续窗口判断|沿用已发布规则：MAP<60持续10分钟，或SBP<90持续15分钟；分别计算连续窗口|血压序列、采样时间|麻醉安全
INTRA-06|stream|SpO₂新采样到达时，连续窗口判断|沿用已发布规则：SpO₂低于配置阈值持续2分钟；数据间隔超过5分钟中断窗口|SpO₂序列、采样时间|麻醉安全
INTRA-07|stream|心率采样或处置记录更新时|院内心率上下限、持续5分钟及未处置的组合条件|心率序列、处置记录|麻醉安全
INTRA-08|stream|核心体温采样或保温措施更新时|核心体温低于配置阈值且无主动保温记录|体温序列、主动保温记录|麻醉安全
INTRA-09|event|累计失血量记录更新时|院内失血量梯度与大量输血启动标准|累计失血量、输血启动记录|输血安全
INTRA-10|deadline|紧急用血申请到同型15分钟/非同型30分钟时|院内紧急发血时限与血型匹配分支|用血申请、血型、发血时间|输血安全
INTRA-11|event|输血开始扫码核对时；单袋时限到达时复核|双人扫码一致性及单袋输注时长标准|双人核对、血袋、输注开始结束|输血安全
INTRA-12|deadline|输血反应标记时及报告截止时点|院内输血反应停注与30分钟上报闭环标准|反应标记、停注事件、上报时间|输血安全
INTRA-13|event|术中术式变更确认时|同意书术式范围、补充签署与抢救豁免条件|实际术式、同意范围、补充签署、抢救标志|准入合规
INTRA-14|event|术中冰冻病理签发或方案变更时|冰冻与术前诊断差异及变更方案决策记录要求|冰冻病理、术前诊断、上级决策|重大手术决策
INTRA-15|event|每次器械敷料清点提交时|术前、关腔前、关腔后三次清点同一物品数量一致|分阶段物品清单、数量、签名|手术安全
INTRA-16|deadline|标本离体后固定/送达截止时点；扫码时|标本标识一致性、固定登记及送达时限标准|离体时间、固定登记、流转扫码|手术安全
INTRA-17|deadline|手术开始后到达计划时长阈值时，结束即撤销计时|计划时长×(1+超时阈值)为首次截止；结束后只保留已触发记录|计划时长、实际开始与结束、当前时点|流程效率
INTRA-18|deadline|手术时长到达追加用药时点或失血量更新时|分药品追加用药标准、已追加执行记录|药品、给药时间、失血量、追加执行|感染预防
INTRA-19|stream|尿量新记录到达时，按两小时窗口判断|按患者体重归一的尿量持续窗口标准|体重、分时段尿量|麻醉安全
INTRA-20|deadline|异常血糖结果签发后30分钟时|院内血糖范围及异常后30分钟处置闭环标准|血糖、处置、结果签发时间|麻醉安全
INTRA-21|event|术中非计划事件记录提交时|非计划事件编码目录：只接收已记录事件，不推定未记录事件|不良事件类型、发生时间、手术ID|手术安全
INTRA-23|deadline|术毕后60分钟或PACU入区后2小时到达时|院内拔管与PACU停留时限标准|术毕、拔管、PACU入出时间|麻醉安全
INTRA-24|event|实际转运目的地确认时|术前计划去向与实际ICU入科记录比对|计划去向、ICU入科、转运确认|手术安全
POST-01|event|同次住院新手术申请提交时|同次住院再次手术的计划性与关联性标准|住院ID、再次手术、计划性标记|术后转归
POST-02|event|死亡记录确认时|围术期时间窗与非预期死亡判定标准|死亡记录、预期属性、围术期时间窗|术后转归
POST-03|stream|引流、生命体征或血红蛋白更新时|院内活动性出血组合识别标准|引流序列、血红蛋白趋势、生命体征|术后转归
POST-04|event|影像或临床诊断报告签署时|按术式维护的吻合口/脏器瘘识别标准|影像、引流性状、诊断、院内标准|术后转归
POST-05|event|院感判定或切口感染证据更新时|院内手术部位感染判定标准与术后时间窗|感染诊断、切口分级、术后窗口|感染预防
POST-06|event|DVT/PE影像或临床诊断确认时|院内VTE诊断与病例关联标准|DVT/PE诊断、影像、手术关联|VTE防治
POST-07|event|胸部影像或感染相关报告签发时|院内肺部感染多源证据组合标准|影像、体温、感染指标|感染预防
POST-08|event|导管维护、感染培养或院感记录更新时|导管相关感染证据与留置时长标准|导管留置、培养、院感记录|感染预防
POST-09|stream|肌酐或尿量数据更新时|院内AKI识别标准及基线/观察窗口|基线肌酐、序列肌酐、尿量|术后转归
POST-10|deadline|病种路径排气、进食或活动截止时点|病种路径各恢复里程碑及豁免标准|病种路径、里程碑、豁免记录|康复管理
POST-11|stream|静息或活动疼痛评分录入时|院内疼痛评分上限、连续次数与干预标准|疼痛评分序列、干预记录|康复管理
POST-12|event|镇痛泵报警或处方核对时|设备报警码、处方与运行参数一致性标准|泵报警、处方、运行数据、闭环记录|用药安全
POST-13|stream|术后体温采样或查因记录更新时|院内持续发热温度、时长及查因标准|体温序列、查因记录|感染预防
POST-14|deadline|抗菌药疗程到达路径上限时|分病种疗程上限及延长说明要求|医嘱执行、病种疗程、延长说明|用药安全
POST-15|deadline|切缘阳性病理报告签发后决策截止时点|病种路径阳性切缘后续决策时限|病理切缘、后续决策、截止时间|治疗衔接
POST-16|event|常规病理报告终签时|分病种淋巴结检出数量标准及例外说明|病理数量、病种标准、说明|治疗衔接
POST-17|event|常规病理终签或诊断修订时|快速与常规病理关键结论一致性标准|快速病理、常规病理、诊断编码|治疗衔接
POST-18|event|四级手术床旁交接提交时|四级手术必需交接项、接收人及时间标准|交接单、交接项、接收人、时间|手术安全|IV
POST-19|deadline|术后麻醉随访截止时点|院内麻醉随访适用范围与时限标准|随访记录、术毕时间、随访时限|康复管理
POST-20|event|关键管路不良事件提交时|非计划拔管、脱落、堵塞及误接事件编码|管路事件、发生时间、手术关联|手术安全
POST-21|event|皮肤评估或预防措施中断记录更新时|新发压力性损伤分期与预防措施标准|皮肤评估、基线、措施执行|康复管理
POST-22|event|高VTE风险患者出院医嘱签署时|出院前VTE预防和宣教必需项标准|VTE风险、出院医嘱、宣教|VTE防治
POST-23|deadline|VTE预防措施中断到达允许时限时|院内预防中断允许时间及豁免条件|预防执行、中断时间、豁免|VTE防治
POST-24|event|再次入院登记完成时|出院后时间窗、非计划属性及手术相关性标准|前次出院、再入院、计划性、相关性|术后转归
POST-25|deadline|住院日到达病种路径上限时|病种住院日上限及合理延长说明|入院日期、病种路径、延长说明|流程效率
POST-26|deadline|ERAS单个里程碑截止时点|病种ERAS里程碑、适用人群及豁免要求|病种路径、里程碑、完成与豁免记录|康复管理`;
  const map = {};
  rows.trim().split('\n').forEach(row => { const [id, mode, trigger, standard, fields, goal, levels] = row.split('|'); map[id] = { mode, trigger, standard, fields: fields.split('、'), goal, levels: (levels || 'I,II,III,IV').split(',') }; });
  const roles = ['主刀医师','责任麻醉医师','巡回护士','医疗组长','科主任','手术部负责人','医务处','责任护士','院感专员'];
  const supported = new Set(['INTRA-01','INTRA-05','INTRA-06','INTRA-17','INTRA-21']);
  SURGICAL_RISK_RULES.forEach(rule => {
    rule.workflow = map[rule.id];
    if (!rule.workflow) throw Error('缺少业务规则定义：'+rule.id);
    rule.workflow.phase = ['POST-19','POST-22','POST-24'].includes(rule.id) ? 'followup' : rule.phase;
    rule.workflow.recipients = rule.workflow.goal === '麻醉安全' ? ['责任麻醉医师'] : rule.workflow.goal === '准入合规' ? ['医疗组长','医务处'] : ['主刀医师','巡回护士'];
    rule.workflow.supported = supported.has(rule.id);
    rule.autoDetect = rule.workflow.supported;
    rule.workflow.sourceNote = supported.has(rule.id) ? '当前场景字段已具备（演示数据）' : '缺少：'+rule.workflow.fields.join('、')+'；不执行自动判断';
  });
  // A business-event evaluator uses explicit evidence, never probability or a polling interval.
  function evaluateAuthorization(event) {
    const ranks = { I:1, II:2, III:3, IV:4 };
    if (!event || !['SURGEON_CONFIRMED','SURGEON_CHANGED','SURGERY_GRADE_CHANGED'].includes(event.type)) return { result:'ignored' };
    const auth = event.authorization;
    if (!event.id || !event.occurredAt || !ranks[event.surgeryLevel] || !auth || !ranks[auth.level] || !auth.validFrom || !auth.validTo || !Array.isArray(auth.procedures)) return { result:'unsupported', reason:'缺少完整授权依据或业务事件' };
    if (auth.surgeonId !== event.surgeonId || !auth.procedures.includes(event.procedureCode) || event.occurredAt < auth.validFrom || event.occurredAt > auth.validTo) return { result:'unsupported', reason:'未找到该医师在该术式及事件时点的有效授权' };
    const abnormal = ranks[auth.level] < ranks[event.surgeryLevel];
    return { result: abnormal ? 'abnormal':'normal', evidence: `有效授权${auth.level}级；拟实施${event.surgeryLevel}级`, key: event.id+'|PRE-01', recipients: window.DecisionConfig ? DecisionConfig.get('risk','PRE-01').recipients : map['PRE-01'].recipients };
  }
  function refreshSources(data) {
    SURGICAL_RISK_RULES.forEach(rule=>{
      let ready=false;
      if(rule.id==='PRE-01')ready=(data.businessEvents||[]).some(e=>evaluateAuthorization(e).result==='normal'||evaluateAuthorization(e).result==='abnormal');
      if(rule.id==='INTRA-01')ready=Array.isArray(data.safetyChecks)&&data.safetyChecks.some(e=>e.checkTime&&e.result);
      if(['INTRA-05','INTRA-06'].includes(rule.id))ready=(data.surgeries||[]).some(s=>(s.vitalSigns||[]).some(v=>Number.isFinite(v.timeMin)&&(rule.id==='INTRA-05'?v.bpSys!=null&&v.bpDia!=null:v.spo2!=null)));
      if(rule.id==='INTRA-17')ready=(data.surgeries||[]).some(s=>s.plannedDuration>0&&s.actualStartTime);
      if(rule.id==='INTRA-21')ready=Array.isArray(data.adverseEvents)&&data.adverseEvents.some(e=>e.surgeryId&&e.occurrenceTime&&e.eventType);
      rule.workflow.supported=ready;rule.autoDetect=ready;
      rule.workflow.sourceNote=ready?'当前场景必要字段已具备（演示数据）':'缺少：'+rule.workflow.fields.join('、')+'；不执行自动判断';
    });
  }
  refreshSources(window.mockData||{});
  window.RuleWorkflows = { roles, evaluateAuthorization, refreshSources, get: id => _warningRule(id).workflow,
    status(id) { const w=this.get(id); return !w.supported ? 'unsupported' : window.DecisionConfig && !DecisionConfig.get('risk',id).enabled ? 'disabled' : 'enabled'; },
    code(id) { return id==='PRE-01' ? evaluateAuthorization.toString() : id==='INTRA-17' ? _warningDetectDuration.toString() : ['INTRA-05','INTRA-06'].includes(id) ? _warningDetectVitals.toString() : id==='INTRA-01' ? _warningDetectSafetyCheck.toString() : id==='INTRA-21' ? _warningDetectAdverse.toString() : '// 数据适配器未接入。返回 unsupported，不将缺失数据判定为异常。\nreturn { result: "unsupported", requiredFields: workflow.fields };'; }
  };
})();

RuleWorkflows=window.RuleWorkflows;

// Source: decision-app/decision-model.js
/* Published definitions stay in source; only the whitelisted runtime parameters are stored. */
(function () {
  'use strict';
  const KEY = 'perioperative-config-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { saved = {}; }
  const limits = {
    'INTRA-06': { label: 'SpO₂下限（%）', value: 90, min: 50, max: 100 },
    'INTRA-08': { label: '核心体温下限（℃）', value: 36, min: 30, max: 40 },
    'INTRA-17': { label: '超计划时长（%）', value: 20, min: 1, max: 200 }
  };
  const configs = {};
  function validate(kind, id, value) {
    const def = (kind === 'risk' ? SURGICAL_RISK_RULES : INDICATOR_DEFS).find(d => d.id === id);
    if (!def) throw Error('未知规则');
    const result = {};
    if (kind === 'metric') {
      const frequency = Number(value.frequency);
      if (!Number.isInteger(frequency) || frequency < 1 || frequency > 1440) throw Error('频次必须为1–1440分钟的整数');
      result.frequency = frequency;
    }
    if (kind === 'risk') {
      result.enabled = value.enabled === true;
      if (window.RuleWorkflows && !RuleWorkflows.get(id).supported && result.enabled) throw Error('数据源不支持，无法启用自动判断');
      result.recipients = value.recipients || (def.workflow ? def.workflow.recipients : ['主刀医师']);
      if (!Array.isArray(result.recipients) || !result.recipients.length || result.recipients.some(role => window.RuleWorkflows && !RuleWorkflows.roles.includes(role))) throw Error('至少选择一个有效告警接收角色');
      result.recipients = Array.from(new Set(result.recipients));
      if (limits[id]) {
        const threshold = Number(value.threshold), range = limits[id];
        if (!Number.isFinite(threshold) || threshold < range.min || threshold > range.max) throw Error('关键阈值超出允许范围');
        result.threshold = threshold;
      }
    } else {
      if (!Object.keys(INDICATOR_CATEGORY_LABELS).includes(value.category)) throw Error('请选择有效指标分类');
      result.category = value.category;
      result.thresholds = def.thresholds.map((t, i) => {
        const n = Number(value.thresholds[i]);
        if (!Number.isFinite(n) || n < 0 || (t.unit === '%' && n > 100)) throw Error('阈值必须为有效非负数，百分比不超过100');
        return n;
      });
      const danger = def.thresholds.findIndex(t => t.level === 'danger');
      const warning = def.thresholds.findIndex(t => t.level === 'warning');
      if (danger >= 0 && warning >= 0 && (def.thresholds[danger].direction === 'below'
        ? result.thresholds[danger] >= result.thresholds[warning] : result.thresholds[danger] <= result.thresholds[warning])) throw Error('异常阈值须比预警阈值更严格');
    }
    return result;
  }
  function apply(kind, id, value) {
    configs[kind + ':' + id] = value;
    if (kind === 'metric') {
      const def = INDICATOR_DEFS.find(d => d.id === id);
      def.category = value.category;
      def.thresholds.forEach((t, i) => { t.value = value.thresholds[i]; });
    }
  }
  [['risk', SURGICAL_RISK_RULES], ['metric', INDICATOR_DEFS]].forEach(([kind, defs]) => defs.forEach(def => {
    const initial = kind === 'risk' ? { enabled: def.workflow ? def.workflow.supported : true, recipients: def.workflow ? def.workflow.recipients : ['主刀医师'], threshold: limits[def.id] && limits[def.id].value }
      : { frequency: 60, category: def.category, thresholds: def.thresholds.map(t => t.value) };
    let value = initial;
    try { if (saved[kind + ':' + def.id]) value = validate(kind, def.id, Object.assign({},saved[kind + ':' + def.id],kind==='risk'&&def.workflow&&!def.workflow.supported?{enabled:false}:{})); } catch (_) { /* Ignore invalid stored records. */ }
    apply(kind, def.id, value);
  }));
  window.DecisionConfig = {
    limits, get: (kind, id) => configs[kind + ':' + id], validate,
    save(kind, id, value) {
      const checked = validate(kind, id, value);
      const next = Object.assign({}, configs, { [kind + ':' + id]: checked });
      localStorage.setItem(KEY, JSON.stringify(next));
      apply(kind, id, checked);
    }
  };
  window.riskParameter = (id, fallback) => configs['risk:' + id] && configs['risk:' + id].threshold !== undefined ? configs['risk:' + id].threshold : fallback;
  window.buildCommandSnapshot = function (data, minute) {
    const anchor = data.meta.date;
    const totalSeconds=Math.max(0,Math.floor(minute*60));
    const stamp=anchor+' '+String(Math.floor(totalSeconds/3600)).padStart(2,'0')+':'+String(Math.floor(totalSeconds/60)%60).padStart(2,'0')+':'+String(totalSeconds%60).padStart(2,'0');
    const events = (data.timelineEvents || []).filter(e => e.actualTime && e.actualTime <= stamp);
    const patients = data.surgeries.filter(s => s.status !== '取消').map(s => {
      const nodes = events.filter(e => e.surgeryId === s.id);
      const has = code => nodes.some(e => e.nodeCode === code);
      const location = has('T18') ? '返回病区' : has('T17') ? '复苏室' : has('T8') ? '转运至复苏室' : has('T1') ? s.operatingRoomNo : has('T16') ? '转运入手术室' : '术前准备区';
      const allNodes=(data.timelineEvents||[]).filter(e=>e.surgeryId===s.id);
      const time=code=>{const e=allNodes.find(e=>e.nodeCode===code);return e&&e.actualTime? (new Date(e.actualTime.replace(' ','T'))-new Date(anchor+'T00:00:00'))/60000:null;};
      const journeys=[{from:'prep',to:'room',start:time('T16'),end:time('T1')},{from:'room',to:'pacu',start:time('T8'),end:time('T17')}];
      journeys.forEach(j=>{
        if(j.start!==null&&j.end===null){
          const arrival=allNodes.find(e=>e.nodeCode===(j.to==='room'?'T1':'T17'));
          const planned=arrival&&arrival.plannedTime?(new Date(arrival.plannedTime.replace(' ','T'))-new Date(anchor+'T00:00:00'))/60000:j.start+15;
          j.end=Math.max(j.start+1,planned);j.estimated=true;
        }
      });
      const movement=journeys.find(j=>j.start!==null&&j.end!==null&&j.end>j.start&&minute>=j.start&&(j.estimated||minute<j.end));
      if(movement)movement.progress=Math.min(movement.estimated ? 0.95 : 1,(minute-movement.start)/(movement.end-movement.start));
      return { surgery:s,location,nodes,movement:movement||null,inRoom:has('T1')&&!has('T8') };

    });
    const rooms = data.operatingRooms.map(room => {
      const cases = patients.filter(p => p.surgery.operatingRoomId === room.id);
      const active = cases.find(p => p.inRoom);
      const exits = cases.flatMap(p => p.nodes.filter(e => e.nodeCode === 'T8')).sort((a,b) => b.actualTime.localeCompare(a.actualTime));
      const lastExit = exits[0] && exits[0].actualTime;
      const endMinute = lastExit ? Number(lastExit.slice(11,13)) * 60 + Number(lastExit.slice(14,16)) : -999;
      const pending = cases.some(p => !p.nodes.some(e => e.nodeCode === 'T1'));
      const status = active ? (active.nodes.some(e => e.nodeCode === 'T6') ? '术后整理' : active.nodes.some(e => e.nodeCode === 'T3') ? '手术中' : '麻醉准备') : minute - endMinute < 35 ? '清洁中' : pending ? '待开始' : '空闲';
      return { roomId: room.roomNo, roomName: room.roomNo, status, surgeryName: active ? active.surgery.surgeryName : '—', patientName: active ? active.surgery.patientName : '—', currentPhase: status, warningLevel: null };
    });
    return { stamp, patients, rooms };
  };
})();

DecisionConfig=window.DecisionConfig; riskParameter=window.riskParameter;

// Source: decision-app/data-source-model.js
/* Source catalog and editable ingestion mappings. No network or database connection is implied. */
(function () {
  'use strict';
  const KEY='perioperative-source-bindings-v1';
  const labels={operatingRooms:['空间与资源','手术间'],medicalGroups:['组织与人员','医疗组'],surgeons:['组织与人员','外科医生'],anesthesiologists:['组织与人员','麻醉医生'],circulatingNurses:['组织与人员','巡回护士'],scrubNurses:['组织与人员','器械护士'],patients:['患者与手术','患者'],surgeries:['患者与手术','手术排程'],timelineEvents:['临床过程','时序事件'],vitalSigns:['临床过程','生命体征'],safetyChecks:['质量与安全','安全核查'],adverseEvents:['质量与安全','不良事件'],handovers:['临床过程','交接记录'],equipment:['空间与资源','设备'],equipmentSchedules:['空间与资源','设备排程'],instrumentSets:['空间与资源','器械包'],pacuBeds:['空间与资源','复苏床位'],historicalCaseFacts:['历史与统计','历史病例事实'],historicalDailyStats:['历史与统计','历史每日统计'],statistics:['历史与统计','统计汇总'],meta:['系统配置','场景元数据'],manualTemplates:['人工填报','事件模板'],manualReports:['人工填报','填报记录']};
  const manualFields={manualTemplates:{id:'string',name:'string',description:'string',phase:'string',level:'string',recipients:'array',enabled:'boolean'},manualReports:{id:'string',ruleId:'string',templateId:'string',templateSnapshot:'object',indicator:'string',phase:'string',phaseLabel:'string',level:'string',recipients:'array',triggerTime:'string',reportedAt:'string',triggerEvidence:'string',desc:'string',sourceSystem:'string',status:'string',responseStatus:'string',messageStatus:'string',notificationStatus:'string',surgeryId:'string',surgeryNo:'string',patientId:'string',patientName:'string',surgeryName:'string',dept:'string',group:'string',roomName:'string',surgeon:'string'}};
  const copy=v=>JSON.parse(JSON.stringify(v));
  const type=v=>v===null?'null':Array.isArray(v)?'array':typeof v;
  const blocked=new Set(['__proto__','prototype','constructor']);
  function pathParts(value, allowEmpty=false) {
    if (allowEmpty && !value) return [];
    const parts=String(value).split('.');
    if(!parts.length||parts.some(p=>! /^[A-Za-z_][A-Za-z0-9_]*$/.test(p)||blocked.has(p))) throw Error('外部字段及响应路径需使用字母、数字、下划线，以点分隔层级');
    return parts;
  }
  function rows(id) {
    if(id==='manualTemplates') return ManualReporting.templates();
    if(id==='manualReports') return ManualReporting.reports();
    const value=mockData[id];return Array.isArray(value)?value:value&&typeof value==='object'?[value]:[];
  }
  function catalog() {
    return [...Object.keys(mockData).filter(k=>mockData[k]&&typeof mockData[k]==='object'),'manualTemplates','manualReports'].map(id=>({id,category:(labels[id]||['其他数据',id])[0],name:(labels[id]||['其他数据',id])[1],count:rows(id).length}));
  }
  const cache=new Map();
  function schema(id) {
    if(!catalog().some(t=>t.id===id)) throw Error('内部数据表不存在');
    if(!id.startsWith('manual')&&cache.has(id)) return copy(cache.get(id));
    const data=rows(id), fields=new Map();
    Object.entries(manualFields[id]||{}).forEach(([name,t])=>fields.set(name,{name,types:new Set([t]),present:0,example:undefined}));
    data.forEach(row=>Object.entries(row).forEach(([name,value])=>{
      if(!fields.has(name))fields.set(name,{name,types:new Set(),present:0,example:undefined});
      const field=fields.get(name);field.types.add(type(value));field.present++;if(field.example===undefined&&value!=null)field.example=value;
    }));
    const result=[...fields.values()].map(f=>({name:f.name,type:[...f.types].join(' | '),coverage:data.length?`${f.present}/${data.length}`:'无实例',example:f.example,definition:manualFields[id]?'代码定义':'当前实例推导'}));
    if(!id.startsWith('manual'))cache.set(id,result);return copy(result);
  }
  function list() {
    const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(data))throw Error('绑定配置格式异常，请保留数据并联系管理员');return data;
  }
  function validateMappings(target,mappings) {
    const fields=schema(target).map(f=>f.name);
    if(!Array.isArray(mappings)||!mappings.length)throw Error('请至少配置一条字段映射');
    const targets=new Set();return mappings.map(m=>{
      pathParts(m.external);
      if(!fields.includes(m.internal)||blocked.has(m.internal))throw Error('内部字段不存在，请重新选择');
      if(targets.has(m.internal))throw Error('同一内部字段不能重复映射：'+m.internal);targets.add(m.internal);
      if(!['identity','string','number','boolean','datetime'].includes(m.transform))throw Error('无效的转换方式');
      return {external:m.external,internal:m.internal,transform:m.transform,required:m.required===true};
    });
  }
  function save(input) {
    const data=list(), value=copy(input);value.name=String(value.name||'').trim();
    if(!value.name||value.name.length>60)throw Error('请填写 1–60 字的数据源名称');
    if(!['api','database'].includes(value.kind))throw Error('请选择有效的数据源类型');
    if(!['internal','external'].includes(value.scope))throw Error('请选择院内或院外来源');
    schema(value.target);
    if(data.some(b=>b.name===value.name&&b.id!==value.id))throw Error('数据源名称已存在');
    if(value.kind==='api') {
      let url;try{url=new URL(value.connection.url);}catch(_){throw Error('请填写有效的 HTTP(S) 接口地址');}
      if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error('接口地址仅支持 HTTP(S)，请勿在地址中填写凭据、查询参数或片段');
      if(!['GET','POST'].includes(value.connection.method))throw Error('不支持的接口方法');
      pathParts(value.connection.responsePath,true);
      value.connection={url:url.href,method:value.connection.method,responsePath:value.connection.responsePath||'',credentialRef:String(value.connection.credentialRef||'').trim()};
    } else {
      const c=value.connection;
      if(!['PostgreSQL','MySQL','SQL Server','Oracle'].includes(c.engine))throw Error('请选择数据库类型');
      if(!/^[A-Za-z0-9.:[\]_-]+$/.test(c.host||''))throw Error('请填写有效的数据库主机');
      if(!Number.isInteger(Number(c.port))||Number(c.port)<1||Number(c.port)>65535)throw Error('数据库端口需为 1–65535 的整数');
      if(!String(c.database||'').trim()||!String(c.table||'').trim())throw Error('请填写数据库名和外部表名');
      value.connection={engine:c.engine,host:c.host,port:Number(c.port),database:c.database.trim(),schema:String(c.schema||'').trim(),table:c.table.trim(),username:String(c.username||'').trim(),credentialRef:String(c.credentialRef||'').trim()};
    }
    value.mappings=validateMappings(value.target,value.mappings);
    const index=data.findIndex(b=>b.id===value.id);if(value.id&&index<0)throw Error('绑定配置不存在');
    const result={id:value.id||'SRC-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name:value.name,kind:value.kind,scope:value.scope,target:value.target,enabled:value.enabled===true,connection:value.connection,mappings:value.mappings,updatedAt:new Date().toISOString()};
    if(index<0)data.push(result);else data[index]=result;
    try{localStorage.setItem(KEY,JSON.stringify(data));}catch(_){throw Error('配置保存失败，请检查浏览器存储空间后重试');}return copy(result);
  }
  function preview(binding, sample) {
    const mappings=validateMappings(binding.target,binding.mappings);
    let payload=sample;
    if(binding.kind==='api')for(const p of pathParts(binding.connection.responsePath,true))payload=payload!=null&&Object.prototype.hasOwnProperty.call(payload,p)?payload[p]:undefined;
    if(!payload||typeof payload!=='object')throw Error('样例中未找到响应数据，请检查响应路径');
    const input=Array.isArray(payload)?payload:[payload];if(!input.length)throw Error('样例数据为空');if(input.length>100)throw Error('映射预览最多接受 100 条样例');
    const errors=[];
    const records=input.map((row,i)=>{
      if(!row||typeof row!=='object'||Array.isArray(row))throw Error('样例每条记录必须是对象');
      const output={};
      for(const m of mappings){
        if(blocked.has(m.internal))throw Error('无效内部字段');
        let value=row;for(const p of pathParts(m.external))value=value!=null&&Object.prototype.hasOwnProperty.call(value,p)?value[p]:undefined;
        if(value==null||value===''){if(m.required)errors.push(`第 ${i+1} 条：${m.external} 缺失，无法映射到 ${m.internal}`);continue;}
        try{
          if(m.transform==='number'){if(typeof value==='boolean'||typeof value==='object'||!String(value).trim()||!Number.isFinite(Number(value)))throw Error('不是有效数字');value=Number(value);}
          if(m.transform==='string'){if(typeof value==='object')throw Error('对象或数组不能直接转为文本');value=String(value);}
          if(m.transform==='boolean'){if(![true,false,1,0,'true','false','1','0'].includes(value))throw Error('布尔值仅支持 true/false、1/0');value=[true,1,'true','1'].includes(value);}
          if(m.transform==='datetime'){if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))throw Error('日期时间无效');value=new Date(value).toISOString();}
          output[m.internal]=value;
        }catch(error){errors.push(`第 ${i+1} 条：${m.external} → ${m.internal}：${error.message}`);}
      }return output;
    });return {records,errors};
  }
  window.SourceData={catalog,rows,schema,list,save,preview};
})();

return {scenario,rules:SURGICAL_RISK_RULES,metrics:INDICATOR_DEFS,workflows:RuleWorkflows,config:DecisionConfig,sources:window.SourceData,departments:DEPT_GROUPS,surgeryTypes:SURGERY_TYPES,categories:INDICATOR_CATEGORY_LABELS,goals:DECISION_GOALS,goalForCategory:getDecisionGoalKey,buildIndicators,dateRange:getScenarioDateRange,generateAlerts:()=>generateWarningEvents("all","all",[]),metricCode:()=>buildIndicators.toString()};
}
