const store = require('../config/jsonStore')
const ReportData = require('./ReportData')

const TABLE = 'reports'

module.exports = {
  findAll: (where, options) => store.findAll(TABLE, where, options),
  findById: (id) => {
    const report = store.findById(TABLE, id)
    if (report) {
      report.moduleData = store.findAll('report_data', { report_id: id }).rows
      const filler = store.findById('users', report.filled_by)
      report.filler = filler ? { id: filler.id, display_name: filler.display_name } : null
    }
    return report
  },
  findOne: (where) => store.findOne(TABLE, where),
  create: (data) => store.create(TABLE, data),
  update: (id, data) => store.update(TABLE, id, data),
  remove: (id) => store.removeById(TABLE, id),
  findAndCountAll: (where, options) => {
    const result = store.findAll(TABLE, where, options)
    // 附加填报人信息
    result.rows = result.rows.map(r => {
      const filler = store.findById('users', r.filled_by)
      r.filler = filler ? { id: filler.id, display_name: filler.display_name } : null
      return r
    })
    return result
  }
}
