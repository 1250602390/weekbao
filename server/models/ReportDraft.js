const store = require('../config/jsonStore')

const TABLE = 'report_drafts'

module.exports = {
  findAll: (where) => store.findAll(TABLE, where),
  findById: (id) => store.findById(TABLE, id),
  findOne: (where) => store.findOne(TABLE, where),
  create: (data) => store.create(TABLE, data),
  update: (id, data) => store.update(TABLE, id, data),
  upsert: (where, data) => {
    const existing = store.findOne(TABLE, where)
    if (existing) {
      return store.update(TABLE, existing.id, { ...data, saved_at: new Date().toISOString() })
    }
    return store.create(TABLE, { ...where, ...data, saved_at: new Date().toISOString() })
  },
  remove: (where) => store.remove(TABLE, where)
}
