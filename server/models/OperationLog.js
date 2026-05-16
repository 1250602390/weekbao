const store = require('../config/jsonStore')

const TABLE = 'operation_logs'

module.exports = {
  findAll: (where, options) => store.findAll(TABLE, where, options),
  create: (data) => store.create(TABLE, data),
  count: (where) => store.count(TABLE, where)
}
