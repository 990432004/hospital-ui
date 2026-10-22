# 浙江省肿瘤医院 · Hospital UI

以本机 `full-version` 的 Vuexy 9 / Vue3 / Vuetify3 为视觉来源，迁移 `decision-app` 的完整医院业务页面及子弹窗。原型及组件库保留；3D 按约定仅预留 iframe 接入。

## 本地运行

```sh
npm ci
npm run dev
```

默认地址 http://127.0.0.1:5174 。Node 22 已验证。使用独立锁文件和依赖，不要求原型或组件库服务同时运行。

```sh
npm test
npm run build
npm run preview
```

## 实现边界

- 路由：`/alerts`、`/alerts/:id`、`/reporting`、`/rules`、`/metrics`、`/metrics/config`、`/data`、`/data/bindings`、`/gantt`、`/command`。
- 导航统一为五个一级模块，告警/指标/数据源展开各自二级页面；水平布局使用同一层级的下拉菜单。表结构/实例等仅作为页面内容Tab，当前页、展开状态和面包屑来自统一导航定义。
- `src/plugins/theme.js`、`defaults.js`、`icons.js` 继承 Vuexy；`styles/icons.css` 从原图标库裁剪。双主题默认跟随系统，选择持久化。
- `src/services/repository.js` 是唯一业务存储边界，异步接口通过 Vue provide/inject 进入页面。接后台时替换 repository 实现，不在页面嵌入接口请求或 localStorage。
- 业务键 `hospital-ui:demo:v1`：模板、人工事件、消息状态，以及 clinical 中的规则/指标参数和数据源绑定；外观独立键 `hospital-ui:appearance:v1`。不读取或覆盖原型的浏览器数据。
- 初始事件模板为空，与原型一致。上报须先建模板；停用阻止新提交，不改写历史快照。事件发生时间按 Asia/Shanghai 解释。
- 处置状态只展示；已读/标记不等于已处置。不实现临床处置、登录权限、实际消息通知或真实医院接口。
- 数据是原型的完整固定场景，场景日期显示在页面。自动告警依据保存的规则参数重新生成；指标沿用原型的确定性演示算法，不能作为正式国考统计。不会伪造其他阶段事件。跨日期人工事件通过全部时间筛选或直达详情查看。

## 来源更新

`scripts/import-domain.cjs` 只读导出完整场景到 `public/data/scenario.json`、纯算法到 `src/domain/prototype-engine.js`，保留原始关联和独立 MDT 统计快照。生成模块没有 DOM 控制器或 eval；正常运行不依赖原型文件。完整场景约 9.4MB，首次进入完整业务模块时从本机静态资源加载。

`scripts/import-prototype.cjs` 从 `../decision-app` 只读生成 `src/data/seed.json`，需显式 `npm run import:prototype`。更新前评估场景日期变化及已持久化状态，正常运行不依赖外部源文件。

`node scripts/subset-icons.cjs` 从 `../../full-version` 提取本工程引用的 Tabler/custom 图标；常规构建不依赖该目录。复制的组件库资产沿用原模板的使用许可。

## 3D 接入预留

复制 `.env.example` 为 `.env.local`，设置 `VITE_COMMAND_IFRAME_URL` 后重启开发服务。未配置时展示接入空态；配置后展示 iframe 和加载/超时提示。跨域 iframe 的 load 事件不能证明内部应用健康，浏览器可能不暴露拒绝嵌入错误；真实接入时需双方约定 ready/错误握手与安全来源，再补充认证、患者同步及主题通信。本轮不包含 3D 实现。

## 验证与协作

内容契约：`../docs/hospital-ui-content-contract.md`、`../docs/hospital-ui-full-content-contract.md`。

全量验收记录：`docs/full-expansion-verification.md`。规则74项、指标22项、数据集合23个；甘特六视图及手术详情。
设计和实施计划：`../docs/superpowers/`。
验证记录：`docs/verification.md`。

## 主题定制工具栏

页面右侧齿轮打开 Theme Customizer，迁移组件库的主色预设/自定义颜色、亮暗/系统主题、默认/边框外观、深色侧边菜单、垂直/折叠/水平导航、紧凑/宽屏内容和 LTR/RTL 方向。原版 SVG 预览图位于 `src/assets/customizer`。主色分别记住亮暗模式的值。

配置独立保存在 `hospital-ui:appearance:v1`，首次兼容旧 `hospital-ui:theme`；顶部主题菜单与工具栏同步。工具栏的恢复按钮只恢复外观，业务演示数据重置不会清空外观配置。存储受限时可继续预览，但显示无法保存的提示。

## 甘特同屏工作区

`/gantt` 同时展示甘特、手术详情卡片和空间地图预留位；选择、日期和时间游标共享。空间地图按钮在本页显隐地图，实时指挥调度仍是独立模块。等级与计划/实际图例绘入Canvas并随PNG导出。

可通过 `VITE_GANTT_IFRAME_URL` 指定甘特专用场景，默认回退指挥场景URL。宿主通信与来源校验见 `docs/gantt-scene-integration.md`；未配置时保留明确接入空态。
