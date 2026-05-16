const { TemplateConfig } = require('../models')
const { success, fail } = require('../utils/response')

async function getTemplateList(req, res) {
  const { module } = req.query
  const where = { is_active: true }
  if (module) where.module = module
  const templates = TemplateConfig.findAll(where, {
    order: [['sort_order', 'ASC']]
  })
  res.json(success(templates.rows))
}

async function updateTemplate(req, res) {
  const { id } = req.params
  const template = TemplateConfig.findById(parseInt(id))
  if (!template) {
    return res.status(404).json(fail(404, '模板配置不存在'))
  }
  const { field_label, field_type, unit, required, sort_order, options, is_active } = req.body
  const updates = {}
  if (field_label) updates.field_label = field_label
  if (field_type) updates.field_type = field_type
  if (unit !== undefined) updates.unit = unit
  if (required !== undefined) updates.required = required
  if (sort_order !== undefined) updates.sort_order = sort_order
  if (options) updates.options = options
  if (is_active !== undefined) updates.is_active = is_active
  TemplateConfig.update(parseInt(id), updates)
  res.json(success(TemplateConfig.findById(parseInt(id))))
}

module.exports = { getTemplateList, updateTemplate }
