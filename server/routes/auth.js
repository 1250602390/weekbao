const express = require('express')
const router = express.Router()
const { login, getCurrentUser, logout } = require('../services/authService')
const { authMiddleware } = require('../middleware/auth')

router.post('/login', login)
router.get('/me', authMiddleware, getCurrentUser)
router.post('/logout', authMiddleware, logout)

module.exports = router
