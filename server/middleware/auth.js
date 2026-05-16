const jwt = require('jsonwebtoken')
const config = require('../config')
const { fail } = require('../utils/response')

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json(fail(401, '未登录，请先登录'))
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json(fail(401, '登录已过期，请重新登录'))
  }
}

const PERMISSIONS = {
  admin: ['fill', 'generate', 'export', 'query', 'manage_user', 'view_log', 'config'],
  manager: ['fill', 'generate', 'export', 'query'],
  viewer: ['export', 'query']
}

function checkPermission(requiredPerm) {
  return (req, res, next) => {
    const userPerms = PERMISSIONS[req.user.role] || []
    if (!userPerms.includes(requiredPerm)) {
      return res.status(403).json(fail(403, '无权限执行此操作'))
    }
    next()
  }
}

module.exports = { authMiddleware, checkPermission, PERMISSIONS }
