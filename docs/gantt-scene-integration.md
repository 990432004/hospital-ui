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
