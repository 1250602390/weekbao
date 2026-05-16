const express = require('express')
const router = express.Router()
const { authMiddleware, checkPermission } = require('../middleware/auth')
const reportService = require('../services/reportService')

router.get('/current', authMiddleware, checkPermission('fill'), reportService.getCurrentReport)
router.get('/', authMiddleware, reportService.getReportList)
router.get('/:id', authMiddleware, reportService.getReportById)
router.post('/:id/data', authMiddleware, checkPermission('fill'), reportService.saveModuleData)
router.put('/:id/data/:module', authMiddleware, checkPermission('fill'), reportService.saveModuleData)
router.post('/:id/submit', authMiddleware, checkPermission('fill'), reportService.submitReport)
router.post('/:id/generate', authMiddleware, checkPermission('generate'), reportService.generateReport)
router.put('/:id/content', authMiddleware, checkPermission('generate'), reportService.updateReportContent)
router.post('/:id/publish', authMiddleware, checkPermission('generate'), reportService.publishReport)

// 草稿
router.get('/:reportId/drafts', authMiddleware, checkPermission('fill'), reportService.getDrafts)
router.put('/:reportId/drafts/:module', authMiddleware, checkPermission('fill'), reportService.saveDraft)

module.exports = router
