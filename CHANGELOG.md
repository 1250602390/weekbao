# Changelog

本文件记录基础数据生产周报平台的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

---

## [1.1.0] - 2026-05-16

### 修复

#### 🔴 严重

- **修复登录后页面不跳转且 API 返回 401 的问题**
  根本原因：`api/index.js` 与 `stores/auth.js` 之间存在循环依赖，导致请求拦截器中 `useAuthStore()` 读到空 token。
  修复：移除 `api/index.js` 中对 `useAuthStore` 和 `router` 的直接导入，改为从 `localStorage` 直接读写 token，彻底打破循环依赖链。

- **修复 JWT Secret 不稳定导致服务器重启后所有 Token 失效**
  `server/config/index.js` 中的 dev secret 包含 `process.pid`，每次进程重启都生成不同密钥。
  修复：改用固定开发密钥 `weekly-report-dev-secret-key-fixed`。

- **修复多个并发 401 响应触发多次页面刷新**
  DashboardView 中有 3 个并行 API 调用，全部返回 401 时会多次触发 `window.location.href`。
  修复：新增 `isRedirecting` 标志位，确保只执行一次重定向。

- **修复 `isTokenExpired` 的 catch 块过于激进**
  token 格式异常时也视为"过期"，会导致用户被无条件踢出。
  修复：增加 `console.warn` 日志区分解析失败场景，增加 `exp` 字段有效性检查。

#### 🟡 中等

- **修复 jsonStore 100ms debounce 写入存在数据丢失风险**
  进程 `SIGKILL`/OOM 时 100ms 内的写操作会丢失。
  修复：debounce 降为 0ms，CRUD 写操作（create/update/remove）改为立即持久化。

- **修复登录频率限制仅用进程内存，多进程下无效**
  `loginAttempts` 使用内存 Map 存储，PM2 cluster 等多进程部署时无法共享。
  修复：改为文件持久化存储到 `data/ratelimit.json`，支持多进程共享，自动清理过期记录。

- **修复权限定义前后端重复，容易不同步**
  RBAC 权限矩阵在前端 `router/index.js` 和后端 `middleware/auth.js` 中各自硬编码。
  修复：创建 `shared/permissions.json` 作为唯一数据源，两端添加同步注释。

- **修复 DashboardView 三个 API 调用顺序执行**
  `fetchCurrentReport()`、`getReportList(published)`、`getReportList(recent)` 顺序 await。
  修复：改用 `Promise.allSettled` 并行执行，页面加载时间缩短为最长单次请求时间。

- **修复 `router.push` 未 await 导致导航失败被静默忽略**
  `LoginView.vue` 中 `router.push('/')` 未 await。
  修复：添加 `await`。

#### 🟢 轻微

- **修复草稿 beforeunload 异步保存不可靠**
  浏览器不等待 `beforeunload` 中的异步操作完成，关闭页面时草稿大概率保存失败。
  修复：新增 `sendBeaconSave()` 使用 `fetch` + `keepalive: true` 确保请求发出。

- **移除 `server/app.js` 中未使用的导入**
  `initDatabase` 和 `startCronJobs` 在 `app.js` 中导入但从未使用。
  修复：移除无用导入。

- **新增启动时 Token 有效性校验**
  用户带旧 token 进入页面时 Dashoard 会短暂闪现后跳转登录。
  修复：`App.vue` 的 `onMounted` 中调用 `/auth/me` 提前验证 token，无效则直接清理跳转。

### 新增

- 新增 `shared/permissions.json` 权限配置共享文件
- 新增 `api/index.js` 中 `redirectToLogin()` 统一重定向入口
- 新增 `draft.js` 中 `sendBeaconSave()` 可靠的页面关闭前保存

### 变更

- `server/config/jsonStore.js`: `saveData()` 改为 `saveData(immediate)` 签名，支持立即写入
- `server/services/authService.js`: 频率限制从内存 Map 改为文件持久化
- `client/src/api/index.js`: 不再依赖 `useAuthStore` 和 `router` 的顶部导入

---

## [1.0.0] - 2026-05-15 (初始版本)

### 功能

- 7大业务模块填报（路网核实、POI数据、作弊审核、限速信息、电子眼、核心价值概要、团队总结）
- 周报生成引擎：环比分析 + 异常检测 + 亮点提炼
- 双版本输出：执行摘要 + 详细分析
- RBAC 权限控制（admin/manager/viewer）
- 草稿自动保存（30秒间隔）
- PDF/Word 导出
- 定时任务（每周三16:00自动创建下周周报模板）
- 操作日志全量记录