const express = require('express')
const router = express.Router()
const { authMiddleware, checkPermission } = require('../middleware/auth')
const userService = require('../services/userService')

router.get('/', authMiddleware, checkPermission('manage_user'), userService.getUserList)
router.post('/', authMiddleware, checkPermission('manage_user'), userService.createUser)
router.put('/:id', authMiddleware, checkPermission('manage_user'), userService.updateUser)
router.delete('/:id', authMiddleware, checkPermission('manage_user'), userService.deleteUser)

module.exports = router
