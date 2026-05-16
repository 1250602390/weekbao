# 百度地图基础数据生产周报平台 — Agent 开发指南

## 一、项目边界

### 1.1 一期范围内（当前实现）

- 8个页面完整实现：登录、工作台、填报、预览编辑、详情查看、历史查询、用户管理、操作日志
- 7大业务模块表单：路网核实、POI数据、作弊审核、限速信息、电子眼、核心价值概要、团队总结计划
- 周报生成引擎：环比分析、异常告警、亮点提炼、双版本生成（执行摘要版+详细分析版）
- 草稿自动保存（30秒间隔）
- 周三16:00定时自动创建周报空模板
- 导出PDF/Word
- RBAC权限控制（admin/manager/viewer三角色）
- 操作日志全量记录
- 百度Hi消息推送（填报提醒、周报发布通知）

### 1.2 一期范围外（二期规划，不实现）

- 与路网编辑/POI审核/作弊审核后台API对接（自动拉取指标）
- 智能0填报
- 与智能汇报机器人对接
- 内部知识库自动归档
- 移动端适配
- 多语言支持

### 1.3 明确不做

- 不接入真实百度统一身份认证，使用本地JWT模拟登录
- 不接入真实百度Hi推送，提供接口占位+控制台日志模拟
- 不接入真实知识库，提供接口占位
- 不做单元测试和E2E测试框架搭建（手动验证即可）
- 不做CI/CD流水线
- 不做Docker容器化
- 不做国际化

---

## 二、技术硬约束

| 约束项 | 要求 | 说明 |
|--------|------|------|
| 前端框架 | Vue3 纯JS | **禁用TypeScript**，所有.vue和.js文件不含TS语法 |
| 后端框架 | Node.js + Express 纯JS | **禁用TypeScript**，所有.js文件不含TS语法 |
| 数据库 | PostgreSQL/SQLite 兼容 | 开发用SQLite，生产切PostgreSQL，通过Sequelize方言切换 |
| UI框架 | TailwindCSS | 与PRD内置HTML保持一致，不引入Element/Ant Design等组件库 |
| 图标 | Font Awesome 4.7 | 与PRD内置HTML保持一致 |
| 图表 | ECharts | 环比趋势、多维度可视化 |
| 构建工具 | Vite | 前端构建 |
| 进程管理 | PM2 | 后端进程管理 |

---

## 三、开发规范

### 3.1 命名规范

- 文件名：kebab-case（如 `report-fill-view.vue`、`report-service.js`）
- Vue组件名：PascalCase（如 `ReportFillView`、`MetricCard`）
- JS变量/函数：camelCase
- JS常量：UPPER_SNAKE_CASE
- CSS类名：TailwindCSS工具类优先，自定义类用BEM
- API路由：kebab-case（如 `/api/report-data`）
- 数据库表名：snake_case（如 `report_data`）

### 3.2 代码规范

- 缩进：2空格
- 字符串：优先单引号
- 分号：不强制
- 每个Vue组件 `<template>` → `<script>` → `<style>` 顺序
- 后端路由、控制器、服务三层分离
- API统一响应格式：`{ code: 0, msg: 'success', data: {} }`
- 错误码：0=成功，401=未认证，403=无权限，404=不存在，500=服务器错误

### 3.3 数据库规范

- 所有表含 `id`（自增主键）、`created_at`、`updated_at`
- 软删除不用，直接物理删除（小规模管理系统）
- JSONB字段用于灵活的业务数据存储（7大模块的指标数据）
- 时间统一UTC存储，展示层转北京时间（+8）

---

## 四、核心业务规则

### 4.1 周期计算

- 周报周期：**本周四 00:00 ~ 下周三 23:59**
- 自动创建时间：**每周三 16:00**（为下周创建模板）
- 填报截止：**每周四 09:00**
- 生产例会：**每周四 10:00-11:00**
- 周数计算：ISO标准，以周四所在周为基准

### 4.2 环比分析规则

- 变化率公式：`(当前值 - 上周值) / 上周值 * 100%`，上周值为0时显示"新增"
- 正常波动：变化率 ≤ ±30%
- 异常标记：变化率 > ±30%，标橙色告警
- 高风险模块（作弊审核）：变化率 > ±20% 即标记告警
- 首周无环比数据，显示"首周"

### 4.3 权限规则

| 角色 | 能做什么 |
|------|----------|
| admin（系统管理员） | 全部操作 + 用户管理 + 日志查看 + 模板配置 |
| manager（生产管理者） | 填报 + 生成 + 编辑 + 导出 + 发布 + 查询 |
| viewer（查阅决策者） | 查看 + 导出 + 查询（只读） |

### 4.4 状态流转

```
空模板 → draft(填报中) → generated(已生成) → published(已发布)
                                          ↑ 可反复编辑后重新发布
```

### 4.5 草稿规则

- 每30秒前端自动保存到后端
- 模块级别保存，每个模块独立草稿
- 提交后草稿自动清除
- 页面刷新/关闭前触发保存

---

## 五、项目结构

```
weekly-report-platform/
├── client/                    # 前端 Vue3 项目
│   ├── src/
│   │   ├── api/               # 接口封装
│   │   ├── components/        # 公共组件
│   │   ├── layouts/           # 布局组件
│   │   ├── router/            # 路由配置
│   │   ├── stores/            # Pinia状态管理
│   │   ├── utils/             # 工具函数
│   │   └── views/             # 8个页面视图
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                    # 后端 Express 项目
│   ├── config/                # 配置
│   ├── middleware/             # 中间件
│   ├── models/                # JSON存储模型层（非Sequelize）
│   ├── routes/                # 路由
│   ├── services/              # 业务服务
│   └── utils/                 # 工具
├── agents.md                  # 本文件
└── package.json               # 根package（workspace管理）
```

---

## 六、开发顺序（按阶段执行）

| 阶段 | 内容 | 关键产出 |
|------|------|----------|
| P0 | 项目初始化、数据库建表、认证、全局布局、路由 | 可登录、可见空页面 |
| P1 | 填报页（7模块表单）、草稿保存、定时任务 | 可填报、可存草稿 |
| P2 | 周报生成引擎、预览编辑页、详情查看页 | 可生成周报、可编辑预览 |
| P3 | 导出PDF/Word、历史查询、分享 | 可导出、可查询历史 |
| P4 | 用户管理、操作日志、模板配置 | 管理后台完整 |
| P5 | 样式打磨、联调、修复 | 可交付 |

---

## 七、已知风险与决策

| 风险/决策 | 处理方式 |
|-----------|----------|
| 百度统一认证未接入 | 使用本地JWT登录模拟，预留OAuth接口 |
| 百度Hi推送未接入 | 控制台日志模拟，预留notifyService接口 |
| 周报生成"智能润色" | 一期用模板+规则拼接，不接入大模型 |
| 并发性能 | PM2集群模式4 worker，SQLite开发环境单写 |
| 数据库切换 | Sequelize方言配置，环境变量控制 |
| 富文本编辑 | contenteditable原生方案，不引入重量级编辑器 |
| 图表渲染 | ECharts按需引入，避免全量打包 |

---

## 八、环境变量

```bash
# .env (开发环境)
NODE_ENV=development
PORT=3000
DB_DIALECT=sqlite
DB_STORAGE=./data/dev.sqlite
JWT_SECRET=dev-secret-key-change-in-prod
JWT_EXPIRES_IN=24h

# .env.production (生产环境)
NODE_ENV=production
PORT=3000
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weekly_report
DB_USER=postgres
DB_PASSWORD=******
JWT_SECRET=prod-strong-secret
JWT_EXPIRES_IN=8h
```

---

## 九、验证检查清单

每个阶段完成后需验证：

- [ ] 无TS语法出现在任何文件中
- [ ] 数据库可通过JSON文件存储正常运行（开发环境，生产切PostgreSQL）
- [ ] 登录/权限流程可用
- [ ] 周期计算符合周四~下周三规则
- [ ] 草稿自动保存30秒触发
- [ ] 环比计算与异常标记逻辑正确
- [ ] 双版本周报均可生成
- [ ] 导出PDF/Word格式正确
- [ ] 三种角色权限隔离生效
- [ ] 操作日志完整记录

---

## 十、实际实现变更记录

### 存储方案调整
- 原计划 Sequelize + SQLite，因环境缺C++编译器无法编译原生模块
- 改用 **JSON文件存储**（`server/config/jsonStore.js`），接口完全兼容，生产环境切换PostgreSQL只需替换模型层

### 页面扩展
- 原计划8页，实际实现 **9页**：新增模板配置管理页（`TemplateConfigView.vue`）

### 新增组件
- `EChartsWrap.vue` — ECharts封装组件
- `ModuleBarChart.vue` — 模块环比柱状图
- `WeekTrendChart.vue` — 周趋势折线图
- `MetricCards.vue` — 核心指标卡片
- `CountdownTimer.vue` — 填报倒计时

### 导出功能
- PDF导出：html2pdf.js
- Word导出：docx + file-saver
- 支持摘要版/详细版分别导出

### 周报生成引擎
- 字段label映射：通过TemplateConfig表将field_key转为中文label
- 双版本生成：执行摘要版（核心数字+亮点+告警）+ 详细分析版（7模块逐项分析）
- 环比分析：>30%标记异常，作弊模块>20%标记告警
