require('dotenv').config()

// H5: 生产环境必须设置JWT_SECRET，否则拒绝启动
const secret = process.env.JWT_SECRET
if (!secret && process.env.NODE_ENV === 'production') {
  console.error('[FATAL] 生产环境必须设置 JWT_SECRET 环境变量')
  process.exit(1)
}

module.exports = {
  port: process.env.PORT || 3000,
  jwt: {
    secret: secret || 'dev-secret-key-' + (process.pid || 'local'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  }
}
