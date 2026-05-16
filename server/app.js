const express = require('express')
const cors = require('cors')
const config = require('./config')
const { initDatabase } = require('./models')
const { autoLog } = require('./middleware/logger')

const authRoutes = require('./routes/auth')
const reportRoutes = require('./routes/report')
const userRoutes = require('./routes/user')
const logRoutes = require('./routes/log')
const templateRoutes = require('./routes/template')
const { startCronJobs } = require('./services/cronService')

const app = express()

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)
  next()
})

// 操作日志自动记录
app.use('/api', autoLog)

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/users', userRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/templates', templateRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ code: 500, msg: '服务器内部错误', data: null })
})

module.exports = app
