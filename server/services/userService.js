const bcrypt = require('bcryptjs')
const { User } = require('../models')
const { success, fail, paginate } = require('../utils/response')

async function getUserList(req, res) {
  const { page = 1, page_size = 20, role, status } = req.query
  const where = {}
  if (role) where.role = role
  if (status) where.status = status

  const result = User.findAll(where, {
    order: [['created_at', 'DESC']],
    limit: parseInt(page_size),
    offset: (parseInt(page) - 1) * parseInt(page_size)
  })
  // 隐藏密码
  const rows = result.rows.map(u => {
    const { password, ...rest } = u
    return rest
  })
  res.json(success(paginate(rows, result.count, parseInt(page), parseInt(page_size))))
}

async function createUser(req, res) {
  const { username, password, display_name, role } = req.body
  if (!username || !password || !display_name || !role) {
    return res.status(400).json(fail(400, '所有字段必填'))
  }
  const exists = User.findOne({ username })
  if (exists) {
    return res.status(400).json(fail(400, '用户名已存在'))
  }
  const hashedPassword = bcrypt.hashSync(password, 10)
  const user = User.create({
    username, password: hashedPassword, display_name, role, status: 'active'
  })
  res.json(success({ id: user.id, username: user.username, display_name: user.display_name, role: user.role }))
}

async function updateUser(req, res) {
  const { id } = req.params
  const user = User.findById(parseInt(id))
  if (!user) {
    return res.status(404).json(fail(404, '用户不存在'))
  }
  const { display_name, role, status, password } = req.body
  const updates = {}
  if (display_name) updates.display_name = display_name
  if (role) updates.role = role
  if (status) updates.status = status
  if (password) updates.password = bcrypt.hashSync(password, 10)
  User.update(parseInt(id), updates)
  const updated = User.findById(parseInt(id))
  const { password: _, ...rest } = updated
  res.json(success(rest))
}

async function deleteUser(req, res) {
  const { id } = req.params
  const user = User.findById(parseInt(id))
  if (!user) {
    return res.status(404).json(fail(404, '用户不存在'))
  }
  if (user.username === 'admin') {
    return res.status(400).json(fail(400, '不能删除超级管理员'))
  }
  User.remove(parseInt(id))
  res.json(success(null, '删除成功'))
}

module.exports = { getUserList, createUser, updateUser, deleteUser }
