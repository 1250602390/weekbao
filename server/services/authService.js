const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const config = require('../config')
const { User } = require('../models')
const { success, fail } = require('../utils/response')

// H6: 登录频率限制（文件持久化存储，多进程共享）
const RATE_LIMIT_FILE = path.join(__dirname, '../../data/ratelimit.json')
const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_ATTEMPTS = 5

function loadRateLimits() {
  try {
    if (fs.existsSync(RATE_LIMIT_FILE)) {
      return JSON.parse(fs.readFileSync(RATE_LIMIT_FILE, 'utf-8'))
    }
  } catch {}
  return {}
}

function saveRateLimits(limits) {
  try {
    const dir = path.dirname(RATE_LIMIT_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const tmpFile = RATE_LIMIT_FILE + '.tmp'
    fs.writeFileSync(tmpFile, JSON.stringify(limits, null, 2), 'utf-8')
    fs.renameSync(tmpFile, RATE_LIMIT_FILE)
  } catch (err) {
    console.error('[RateLimit] 保存限流数据失败:', err.message)
  }
}

function checkRateLimit(username, ip) {
  const limits = loadRateLimits()
  const key = `${username}:${ip}`
  const now = Date.now()
  const record = limits[key]

  // 清理过期记录
  let cleaned = false
  Object.keys(limits).forEach(k => {
    if (now - limits[k].firstAttempt > RATE_LIMIT_WINDOW) {
      delete limits[k]
      cleaned = true
    }
  })

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    limits[key] = { count: 1, firstAttempt: now }
    saveRateLimits(limits)
    return true
  }
  if (record.count >= MAX_ATTEMPTS) {
    if (cleaned) saveRateLimits(limits)
    return false
  }
  record.count++
  limits[key] = record
  saveRateLimits(limits)
  return true
}

async function login(req, res) {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json(fail(400, '用户名和密码不能为空'))
  }
  // H6: 频率检查
  const ip = req.ip || req.connection.remoteAddress
  if (!checkRateLimit(username, ip)) {
    return res.status(429).json(fail(429, '登录尝试过于频繁，请稍后再试'))
  }

  const user = await User.authenticate(username, password)
  if (!user) {
    return res.status(401).json(fail(401, '用户名或密码错误'))
  }
  // 更新最后登录时间
  User.update(user.id, { last_login: new Date().toISOString() })

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, display_name: user.display_name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )
  res.json(success({
    token,
    user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role }
  }))
}

async function getCurrentUser(req, res) {
  const user = User.findById(req.user.id)
  if (!user) {
    return res.status(404).json(fail(404, '用户不存在'))
  }
  res.json(success({
    id: user.id, username: user.username, display_name: user.display_name,
    role: user.role, status: user.status, last_login: user.last_login
  }))
}

async function logout(req, res) {
  res.json(success(null, '已退出登录'))
}

module.exports = { login, getCurrentUser, logout }
