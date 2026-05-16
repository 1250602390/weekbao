const jwt = require('jsonwebtoken')
const config = require('../config')
const { User } = require('../models')
const { success, fail } = require('../utils/response')

// H6: 简易登录频率限制（内存存储，5次/分钟）
const loginAttempts = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_ATTEMPTS = 5

function checkRateLimit(username, ip) {
  const key = `${username}:${ip}`
  const now = Date.now()
  const record = loginAttempts.get(key)
  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.set(key, { count: 1, firstAttempt: now })
    return true
  }
  if (record.count >= MAX_ATTEMPTS) {
    return false
  }
  record.count++
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
