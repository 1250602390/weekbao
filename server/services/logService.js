const { OperationLog } = require('../models')
const { success, paginate } = require('../utils/response')

async function getLogList(req, res) {
  const { page = 1, page_size = 20, action, start_date, end_date } = req.query
  const where = {}
  if (action) where.action = action
  if (start_date || end_date) {
    where.created_at = {}
    if (start_date) where.created_at.gte = start_date
    if (end_date) where.created_at.lte = end_date + 'T23:59:59'
  }

  const result = OperationLog.findAll(where, {
    order: [['created_at', 'DESC']],
    limit: parseInt(page_size),
    offset: (parseInt(page) - 1) * parseInt(page_size)
  })
  res.json(success(paginate(result.rows, result.count, parseInt(page), parseInt(page_size))))
}

module.exports = { getLogList }
