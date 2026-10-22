# 甘特图与 E3 医院场景对齐

2026-10-22 通过 E3 项目 10 的只读 API 获取空间和面片记录。场景为半山院区（20260722000111），空间结构保留 E3 的“参考推演”属性。本次未修改 E3 场景，也未接入真实临床数据。

## 数据与映射

- `src/data/e3-spaces.json` 保存场景、楼栋、36 个楼层及业务房间的可移植快照，包含 248 间病房、50 间手术室、14 间复苏/术前准备室和 9 间物品/库房。
- 房间使用 E3 原始 `roomId`（面片 ID）、`roomCode`（如 B2-2F-R16），同时携带 `sceneId/buildingId/floorId`、名称、完整路径及门标识。
- `doorPoint` 的单位是米，坐标是楼层平面 X/Z、拆楼变换前。它是门口锚点，不是世界坐标，不代表已经计算出的可通行路径。三维消费端须使用 E3 的楼层坐标变换。
- 现有 40 间模拟手术间一对一映射到 E3 的 40 间房间，保留手术计划/实际开始和结束时间。资源目录列入全部 50 间手术室，计划利用率分母同步更新为 50 间。
- 患者固定关联一间场景病房；手术使用 `locations.ward/operatingRoom/pacu`。复苏室与手术室同层。每间复苏室配置 4 张**模拟床位**（共 56 张），床位不是 E3 中新增的房间；分配时检查计划和实际占用窗口，避免重叠。
- 设备排程、设备位置、安全核查、不良事件、交接记录、患者和轻量 seed 的房间引用同步更新。

## 时间与转运

保留原场景日 2026-10-21、快照 14:00 和 154 台手术。按保留的手术开始/结束时间重新统一入室、麻醉、出室、转运、复苏时间；实际节点不超过快照时间，未发生节点的实际时间为空。时间仍为演示推演，不应解释为真实临床记录。

`scenario.transfers` 包含 308 条记录，每台手术两条：病房→手术室、手术室→复苏室。每条有 `from/to` 空间标识，分别保留 `plannedStartTime/plannedEndTime` 和 `actualStartTime/actualEndTime`。E3 自动转运可识别的 `ward/operatingRoom` 填写起点/终点房间编码；`startTime/endTime` 已完成时采用实际区间，未出发时采用计划区间；转运中采用实际出发时间和 `estimatedEndTime`（按计划时长估算，至少晚于快照一分钟），`timeBasis=actual-start-estimated-end` 明确标识估算，实际到达时间仍为空。所有转运时间均带 `+08:00`。

同楼记录的 `routeStatus=not-computed`；跨楼记录为 `requires-cross-building-route`。现有 E3 自动转运组件以单栋楼快照解析房间，因此跨楼记录不能直接冒充已可播放的楼内任务。这里交付点位和起终点数据，不交付跨楼寻路。

切换复盘日期时，条带与转运记录同步平移日期，保持时区、起终点和空间 ID 一致。

## 重新清洗与生成

在 hospital-ui 下执行：

```sh
npm run data:align-e3
```

清洗现有 `public/data/scenario.json` 并同步 `src/data/seed.json`；相同版本和 E3 快照重复执行不改变结果。

```sh
npm run import:prototype
```

从 decision-app 重新生成当日模拟场景和 seed，两条导入链路均调用同一个 E3 对齐器，避免恢复旧编号。原始 decision-app 数据生成器未改动。

如果 E3 空间发生变化，先只读导出 `space/list-all?projectId=10` 返回的空间数组，以及以楼层 ID 为键、`plane-sheets/list-all?spaceId=...` 返回值为数组的对象，再执行：

```sh
node scripts/build-e3-catalog.cjs spaces.json areas-by-floor-id.json
npm run data:align-e3
npm test
npm run build
```

快照只保存空间数据，不保存认证信息。删除或减少房间可能需要重新规划排程，对齐器不会把多间手术间静默合并。

## 页面与联动

甘特图楼层筛选使用明确楼层字段，兼容旧编号。手术详情显示每个时序节点的房间编码；空间面板显示病房、手术间、复苏室的完整场景路径。

`hospital:gantt-context` 在原字段上增加 `projectId/sceneId/locations/transfers`，不发送患者姓名或完整临床记录。此次浏览器验收中，3D iframe 仍处于“待接入”，已验证的是数据、页面和发送上下文，不宣称 E3 iframe 已消费新字段。
