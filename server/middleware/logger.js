const { OperationLog } = require('../models')

function logOperation(action, target, detail) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 400 && req.user) {
        OperationLog.create({
          user_id: req.user.id,
          action,
          target: target || '',
          detail: typeof detail === 'function' ? detail(req) : detail || '',
          ip: req.ip || req.connection?.remoteAddress || ''
        })
      }
    })
    next()
  }
}

function autoLog(req, res, next) {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode < 400 && req.user) {
        OperationLog.create({
          user_id: req.user.id,
          action: req.method,
          target: req.path,
          detail: `${req.user.display_name} ${req.method} ${req.path}`,
          ip: req.ip || req.connection?.remoteAddress || ''
        })
      }
    })
  }
  next()
}

module.exports = { logOperation, autoLog }
