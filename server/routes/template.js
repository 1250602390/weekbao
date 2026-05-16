const express = require('express')
const router = express.Router()
const { authMiddleware, checkPermission } = require('../middleware/auth')
const templateService = require('../services/templateService')

router.get('/', authMiddleware, templateService.getTemplateList)
router.put('/:id', authMiddleware, checkPermission('config'), templateService.updateTemplate)

module.exports = router
