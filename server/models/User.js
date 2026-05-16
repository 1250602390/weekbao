const store = require('../config/jsonStore')
const bcrypt = require('bcryptjs')

const TABLE = 'users'

module.exports = {
  findAll: (where, options) => store.findAll(TABLE, where, options),
  findById: (id) => store.findById(TABLE, id),
  findOne: (where) => store.findOne(TABLE, where),
  create: (data) => store.create(TABLE, data),
  update: (id, data) => store.update(TABLE, id, data),
  remove: (id) => store.removeById(TABLE, id),
  count: (where) => store.count(TABLE, where),
  authenticate: async (username, password) => {
    const user = store.findOne(TABLE, { username })
    if (!user) return null
    if (user.status !== 'active') return null
    const valid = bcrypt.compareSync(password, user.password)
    return valid ? user : null
  }
}
