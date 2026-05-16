# 百度地图基础数据生产周报平台

基础数据生产团队的周报自动化平台，覆盖7大业务模块的数据填报、环比分析、异常告警、周报生成与发布归档全流程。

## 功能特性

- **7大业务模块填报**：路网核实、POI数据、作弊审核、限速信息、电子眼、核心价值概要、团队总结与下周计划
- **周报生成引擎**：自动环比分析、异常检测（通用>30%、作弊模块>20%）、亮点提炼
- **双版本输出**：执行摘要版 + 详细分析版
- **RBAC权限控制**：admin / manager / viewer 三角色
- **草稿自动保存**：30秒间隔自动保存，页面关闭前触发保存
- **导出**：PDF / Word
- **定时任务**：每周三16:00自动创建下周周报模板
- **操作日志**：全量记录用户操作

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | Vue 3 + Pinia + Vue Router + TailwindCSS + ECharts |
| 后端 | Express.js + JWT + node-cron |
| 存储 | JSON文件（开发），可切换 PostgreSQL（生产） |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发环境（前端 + 后端）
npm run dev

# 仅启动后端（端口 3000）
cd server && node server.js

# 仅启动前端（端口 5173，代理 /api 到 localhost:3000）
cd client && npx vite

# 构建前端
cd client && npx vite build

# 生产环境启动
cd server && NODE_ENV=production node server.js
```

## 项目结构

```
weekly-report-platform/
├── client/                     # 前端 Vue 3 项目
│   ├── src/
│   │   ├── api/                # Axios 接口封装
│   │   ├── components/         # 公共组件（ECharts图表、指标卡片、倒计时）
│   │   ├── layouts/            # 全局布局（侧边栏+顶栏）
│   │   ├── router/             # 路由配置 + 权限守卫
│   │   ├── stores/             # Pinia 状态管理
│   │   ├── utils/              # 工具函数（周计算、草稿、导出）
│   │   └── views/              # 9个页面视图
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # 后端 Express 项目
│   ├── config/                 # 配置 + JSON存储引擎
│   ├── middleware/              # JWT认证 + RBAC + 操作日志
│   ├── models/                 # 数据模型层
│   ├── routes/                 # API路由
│   ├── services/               # 业务逻辑（周报生成引擎、定时任务等）
│   └── utils/                  # 工具函数
└── package.json                # 根 workspace 管理
```

## 核心业务规则

### 周期计算

- 周报周期：**本周四 00:00 ~ 下周三 23:59**
- 自动创建：**每周三 16:00**
- 填报截止：**每周四 09:00**

### 状态流转

```
draft(填报中) → submitted(已提交) → generated(已生成) → published(已发布)
                                           ↑ 可反复编辑重新生成
```

### 权限

| 角色 | 能力 |
|------|------|
| admin | 全部操作 + 用户管理 + 日志查看 + 模板配置 |
| manager | 填报 + 生成 + 编辑 + 导出 + 发布 + 查询 |
| viewer | 查看 + 导出 + 查询 |

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 系统管理员 |
| manager | manager123 | 生产管理者 |
| viewer | viewer123 | 只读查阅者 |

## API 响应格式

```json
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

分页响应：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [],
    "total": 0,
    "page": 1,
    "page_size": 10,
    "total_pages": 0
  }
}
```
