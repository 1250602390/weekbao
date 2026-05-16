const store = require('../config/jsonStore')

const TABLE = 'template_configs'

module.exports = {
  findAll: (where, options) => store.findAll(TABLE, where, options),
  findById: (id) => store.findById(TABLE, id),
  create: (data) => store.create(TABLE, data),
  update: (id, data) => store.update(TABLE, id, data),
  bulkCreate: (records) => store.bulkCreate(TABLE, records),
  count: (where) => store.count(TABLE, where)
}
