const express = require('express')
const router = express.Router()
const { authMiddleware, checkPermission } = require('../middleware/auth')
const logService = require('../services/logService')

router.get('/', authMiddleware, checkPermission('view_log'), logService.getLogList)

module.exports = router
