# 甘特同屏空间地图接入

甘特图、详情卡片、空间地图同页并排显示；日期、视图、当前手术和游标时点由甘特页面统一管理。空间地图按钮只切换本页面板，不跳转指挥调度路由。未配置场景时显示iframe预留位和当前联动标识，不模拟已经接入3D。

`.env.local` 配置 `VITE_GANTT_IFRAME_URL` 后重启开发服务；为空时回退 `VITE_COMMAND_IFRAME_URL`。仅接受HTTP(S)，也可填写同源相对路径。当前没有配置真实场景，验收的是宿主、预留位与通信边界。

父应用在iframe load、场景ready和上下文变化时发送：

```js
{
  type: 'hospital:gantt-context', version: 1,
  context: {
    date: '2026-10-21', view: 'patient', time: '14:00:00',
    surgeryId: 'OPR0094', patientId: 'PAT…',
    operatingRoomId: 'OR…', operatingRoomNo: '4F-20', theme: 'dark'
  }
}
```

清除选中后三个ID及房间号为null。日期变化按既定场景模板平移；时间游标为空时使用场景快照时间。不发送完整患者记录。iframe load只显示“容器已加载”，不代表内部应用健康。

嵌入场景可向父应用发送 `hospital:scene-ready` 请求最新上下文；可发送 `{type:'hospital:scene-select', surgeryId:'OPR0094'}` 请求选中当前筛选范围内的手术。父应用严格核对event.source和配置URL的origin，并验证手术ID白名单。发送时使用准确targetOrigin。场景实现也应核对宿主来源，按约定消费context，不得把本宿主的预留位视为真实3D已经完成。

完整手术信息在可独立滚动的详情卡片中保留：计划实际、时序节点及操作人备注、患者/人员/资源/患者全程、生命体征。等级I–IV和计划/实际图例在Canvas中绘制，导出PNG使用同一画布。

2026-10-22：空间标识已对齐 E3 项目 10。上下文额外包含 `projectId`、`sceneId`、`locations`（ward/operatingRoom/pacu）及随复盘日期平移的 `transfers`。房间编码如 `B2-2F-R16`；数值 `roomId` 对应 E3 面片 ID。详细数据口径、门口坐标系与跨楼路径限制见 [甘特图与 E3 医院场景对齐](gantt-e3-alignment.md)。

### 2026-10-22 全量静态绑定与回放

`public/data/e3-transfers.json` 是从当前 scenario 导出的 308 条模拟转运，运行 `npm run data:export-e3` 可重新导出。场景 20260722000111 的既有转运实例使用该 records 数组作为静态数据源，后续可替换为接口；通用商城模板不包含医院数据。重新导出不会自动写入 E3 服务，需同步实例数据源。绑定前配置保存在 `e3-transfer-binding-before.json`。

iframe 完成 `hospital:scene-ready` 握手后，宿主发送 version=1 的 `hospital:gantt-context`，仅包含 projectId、sceneId、surgeryId、date、timeMs、play。timeMs 按上海时区解析；手术取消选择时 surgeryId=null，恢复所有在该时刻区间内的转运。选中时展示该手术的两段路径。房间/设备视图共用手术 ID，不以设备排程行 ID 选择。

E3 组件只接受浏览器 referrer 对应父窗口的消息，并核对项目和场景。数据晚于消息到达、场景重载和日期切换均保留/重发最新上下文。外部时钟接管后停止组件自身时钟推进，使用 setPlayback 驱动已有任务，并同步控件显示时间。此版本甘特时间定位发送 play=false。

跨楼路线继续按现有寻路限制报告不可用，不绘制穿楼直线。全院模式表示当时正在转运的患者，不将未发生或已结束转运显示为移动病床。手术中停留状态不额外生成转运路径。

历史接入曾通过 `gantt=1` 读取 E3 的静态资源文件；该分支已在 2026-10-23 被下述保存配置读取链路替代。

### 2026-10-23 保存配置与实时指挥调度

实时指挥调度与甘特嵌入共用 E3 分享链接。E3 分享接口现在读取场景中启用的特效实例、组件默认参数、实例覆盖和已保存数据源，返回服务端解析的运行值。当前来源仍是 E3 保存的 308 条模拟转运记录；不再读取 `/projects/10/hospital-gantt.json`，也不需要旧的 `demo-transfer-001/002` 演员。来源凭据不会发送到 iframe。

保存 E3 镜头或组件参数后，点击“重新加载场景”读取最新值。默认“转运中”按当前显示时间筛选；已有记录日期为 2026-10-21，实时模式处于其他日期时没有正在转运的任务，应使用回播查看。指挥页面不发送甘特时钟，时间轴由 iframe 内控件控制；甘特页面的父窗口时间和选中任务仍优先控制复盘显示。

这不是向已打开 iframe 自动推送变更；宿主重新导出数据仍不会自行写入 E3 数据源。跨楼路线继续受当前寻路能力限制。
