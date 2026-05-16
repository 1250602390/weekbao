const { Report, ReportData, ReportDraft, TemplateConfig } = require('../models')
const { getWeekPeriod, getWeekNumber, calcChangeRate, isAnomaly } = require('../utils/weekHelper')
const { success, fail, paginate } = require('../utils/response')

const MODULE_NAMES = {
  road: '路网核实', poi: 'POI数据', cheat: '作弊审核',
  speed: '限速信息', camera: '电子眼', value: '核心价值概要', team: '团队总结与下周计划'
}

// 获取字段label映射
function getFieldLabelMap() {
  const templates = TemplateConfig.findAll({}, {}).rows
  const map = {}
  templates.forEach(t => { map[t.field_key] = t.field_label })
  return map
}

async function getCurrentReport(req, res) {
  const period = getWeekPeriod(new Date())
  let report = Report.findOne({ start_date: period.start })
  if (!report) {
    const weekNum = getWeekNumber(new Date())
    const year = new Date(period.start).getFullYear()
    report = Report.create({
      week_number: weekNum,
      year,
      start_date: period.start,
      end_date: period.end,
      status: 'draft'
    })
  }
  // 获取模块数据
  report.moduleData = ReportData.findAll({ report_id: report.id }).rows
  // 获取上周数据
  const lastWeekStart = new Date(period.start)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastReport = Report.findOne({ start_date: lastWeekStart.toISOString().split('T')[0] })
  const lastWeekData = []
  if (lastReport) {
    const lastModuleData = ReportData.findAll({ report_id: lastReport.id }).rows
    lastModuleData.forEach(d => lastWeekData.push({ module: d.module, data: d.data }))
  }
  const result = { ...report, last_week_data: lastWeekData }
  res.json(success(result))
}

async function getReportById(req, res) {
  const { id } = req.params
  const report = Report.findById(parseInt(id))
  if (!report) {
    return res.status(404).json(fail(404, '周报不存在'))
  }
  // H9: 附带模块数据
  report.moduleData = ReportData.findAll({ report_id: parseInt(id) }).rows
  res.json(success(report))
}

async function getReportList(req, res) {
  const { page = 1, page_size = 10, start_date, end_date, filled_by, status } = req.query
  const where = {}
  if (start_date) where.start_date = { ...where.start_date, gte: start_date }
  if (end_date) where.end_date = { ...where.end_date, lte: end_date }
  if (filled_by) where.filled_by = parseInt(filled_by)
  if (status) where.status = status

  const result = Report.findAndCountAll(where, {
    order: [['created_at', 'DESC']],
    limit: parseInt(page_size),
    offset: (parseInt(page) - 1) * parseInt(page_size)
  })
  res.json(success(paginate(result.rows, result.count, parseInt(page), parseInt(page_size))))
}

async function saveModuleData(req, res) {
  const { id } = req.params
  const { module, data } = req.body
  if (!module || !data) {
    return res.status(400).json(fail(400, '模块名和数据不能为空'))
  }
  const report = Report.findById(parseInt(id))
  if (!report) {
    return res.status(404).json(fail(404, '周报不存在'))
  }
  // H1: 仅draft/submitted状态可编辑
  if (report.status !== 'draft' && report.status !== 'submitted') {
    return res.status(400).json(fail(400, '当前状态不可编辑'))
  }
  const record = ReportData.upsert({ report_id: parseInt(id), module }, { data })
  res.json(success(record))
}

async function saveDraft(req, res) {
  const { reportId, module } = req.params
  const { data } = req.body
  const record = ReportDraft.upsert(
    { report_id: parseInt(reportId), user_id: req.user.id, module },
    { data }
  )
  res.json(success(record))
}

async function getDrafts(req, res) {
  const { reportId } = req.params
  const drafts = ReportDraft.findAll({ report_id: parseInt(reportId), user_id: req.user.id }).rows
  res.json(success(drafts))
}

async function submitReport(req, res) {
  const { id } = req.params
  const report = Report.findById(parseInt(id))
  if (!report) {
    return res.status(404).json(fail(404, '周报不存在'))
  }
  Report.update(parseInt(id), {
    status: 'submitted',
    filled_by: req.user.id,
    submitted_at: new Date().toISOString()
  })
  // 清除草稿
  ReportDraft.remove({ report_id: parseInt(id) })
  res.json(success(Report.findById(parseInt(id))))
}

async function generateReport(req, res) {
  const { id } = req.params
  const report = Report.findById(parseInt(id))
  if (!report) {
    return res.status(404).json(fail(404, '周报不存在'))
  }
  // H2: 仅submitted状态可生成
  if (report.status !== 'submitted' && report.status !== 'generated') {
    return res.status(400).json(fail(400, '周报尚未提交，请先提交'))
  }
  const moduleData = ReportData.findAll({ report_id: parseInt(id) }).rows
  report.moduleData = moduleData

  // 获取上周数据
  const lastWeekStart = new Date(report.start_date)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastReport = Report.findOne({ start_date: lastWeekStart.toISOString().split('T')[0] })
  const lastModuleData = lastReport ? ReportData.findAll({ report_id: lastReport.id }).rows : []

  const analysis = analyzeReport(report, lastModuleData)
  const summaryContent = generateSummary(report, analysis)
  const detailContent = generateDetail(report, analysis)

  Report.update(parseInt(id), {
    status: 'generated',
    summary_content: summaryContent,
    detail_content: detailContent
  })
  res.json(success(Report.findById(parseInt(id))))
}

async function publishReport(req, res) {
  const { id } = req.params
  const report = Report.findById(parseInt(id))
  if (!report) {
    return res.status(404).json(fail(404, '周报不存在'))
  }
  if (report.status !== 'generated') {
    return res.status(400).json(fail(400, '周报尚未生成，请先生成'))
  }
  Report.update(parseInt(id), { status: 'published', published_at: new Date().toISOString() })
  console.log(`[Notify] 周报已发布: ${report.year}年第${report.week_number}周`)
  res.json(success(Report.findById(parseInt(id))))
}

async function updateReportContent(req, res) {
  const { id } = req.params
  const { summary_content, detail_content } = req.body
  const report = Report.findById(parseInt(id))
  if (!report) {
    return res.status(404).json(fail(404, '周报不存在'))
  }
  const updates = {}
  if (summary_content !== undefined) updates.summary_content = summary_content
  if (detail_content !== undefined) updates.detail_content = detail_content
  Report.update(parseInt(id), updates)
  res.json(success(Report.findById(parseInt(id))))
}

// ---- 分析引擎 ----

function analyzeReport(report, lastModuleData) {
  const analysis = {}
  const lastDataMap = {}
  lastModuleData.forEach(d => { lastDataMap[d.module] = d.data })

  report.moduleData.forEach(d => {
    const lastModuleData = lastDataMap[d.module] || {}
    const changes = {}
    Object.keys(d.data).forEach(key => {
      const cur = d.data[key]
      const prev = lastModuleData[key]
      if (typeof cur === 'number' && typeof prev === 'number') {
        const rate = calcChangeRate(cur, prev)
        changes[key] = { current: cur, previous: prev, rate, is_anomaly: isAnomaly(rate, d.module) }
      }
    })
    analysis[d.module] = {
      name: MODULE_NAMES[d.module],
      data: d.data,
      changes,
      last_data: lastModuleData
    }
  })
  return analysis
}

function generateSummary(report, analysis) {
  const labelMap = getFieldLabelMap()
  const periodStr = `${report.start_date} 至 ${report.end_date}`
  let content = `<h1>${report.year}年第${report.week_number}周基础数据生产周报（执行摘要）</h1>`
  content += `<p><strong>统计周期</strong>：${periodStr}</p>`
  content += `<h2>核心数字一览</h2><ul>`
  const keyMetrics = []
  if (analysis.road?.data.road_verified_count !== undefined) keyMetrics.push({ label: '路网核实条数', value: analysis.road.data.road_verified_count, rate: analysis.road.changes.road_verified_count?.rate, module: 'road' })
  if (analysis.poi?.data.poi_new_count !== undefined) keyMetrics.push({ label: '新增POI数量', value: analysis.poi.data.poi_new_count, rate: analysis.poi.changes.poi_new_count?.rate, module: 'poi' })
  if (analysis.cheat?.data.cheat_confirmed_count !== undefined) keyMetrics.push({ label: '作弊确认条数', value: analysis.cheat.data.cheat_confirmed_count, rate: analysis.cheat.changes.cheat_confirmed_count?.rate, module: 'cheat' })
  if (analysis.cheat?.data.cheat_loss_avoided !== undefined) keyMetrics.push({ label: '避免损失估算(万元)', value: analysis.cheat.data.cheat_loss_avoided, rate: analysis.cheat.changes.cheat_loss_avoided?.rate, module: 'cheat' })

  keyMetrics.forEach(m => {
    const rateStr = typeof m.rate === 'number' ? `${m.rate > 0 ? '↑' : m.rate < 0 ? '↓' : '→'}${Math.abs(m.rate)}%` : '-'
    const anomalyTag = typeof m.rate === 'number' && isAnomaly(m.rate, m.module) ? ' ⚠️' : ''
    content += `<li><strong>${m.label}</strong>：${m.value}（环比${rateStr}${anomalyTag}）</li>`
  })
  content += `</ul>`

  const highlights = extractHighlights(analysis, labelMap)
  if (highlights.length > 0) {
    content += `<h2>本周最大亮点</h2><ul>`
    highlights.forEach(h => { content += `<li>${h}</li>` })
    content += `</ul>`
  }

  const anomalies = extractAnomalies(analysis, labelMap)
  if (anomalies.length > 0) {
    content += `<h2>⚠️ 异常告警</h2><ul>`
    anomalies.forEach(a => { content += `<li>${a}</li>` })
    content += `</ul>`
  }
  return content
}

function generateDetail(report, analysis) {
  const labelMap = getFieldLabelMap()
  const periodStr = `${report.start_date} 至 ${report.end_date}`
  let content = `<h1>${report.year}年第${report.week_number}周基础数据生产周报（详细分析）</h1>`
  content += `<p><strong>统计周期</strong>：${periodStr}</p>`

  Object.keys(analysis).forEach(moduleKey => {
    const mod = analysis[moduleKey]
    content += `<h2>${mod.name}</h2><ul>`
    Object.keys(mod.data).forEach(fieldKey => {
      const val = mod.data[fieldKey]
      const change = mod.changes[fieldKey]
      const label = labelMap[fieldKey] || fieldKey
      if (change && typeof change.rate === 'number') {
        const arrow = change.rate > 0 ? '↑' : change.rate < 0 ? '↓' : '→'
        const anomalyTag = change.is_anomaly ? ' ⚠️' : ''
        content += `<li>${label}：${val}（上周${change.previous}，环比${arrow}${Math.abs(change.rate)}%${anomalyTag}）</li>`
      } else {
        content += `<li>${label}：${val}</li>`
      }
    })
    content += `</ul>`
  })

  const highlights = extractHighlights(analysis, labelMap)
  if (highlights.length > 0) {
    content += `<h2>亮点总结</h2><ul>`
    highlights.forEach(h => { content += `<li>${h}</li>` })
    content += `</ul>`
  }

  const anomalies = extractAnomalies(analysis, labelMap)
  if (anomalies.length > 0) {
    content += `<h2>异常告警</h2><ul>`
    anomalies.forEach(a => { content += `<li>${a}</li>` })
    content += `</ul>`
  }
  return content
}

function extractHighlights(analysis, labelMap = {}) {
  const highlights = []
  if (analysis.value?.data.value_user_feedback) highlights.push(analysis.value.data.value_user_feedback)
  if (analysis.value?.data.value_quality_incident) highlights.push(analysis.value.data.value_quality_incident)
  Object.keys(analysis).forEach(key => {
    const mod = analysis[key]
    Object.keys(mod.changes).forEach(field => {
      const change = mod.changes[field]
      if (change.rate > 30 && !change.is_anomaly) {
        const label = labelMap[field] || field
        highlights.push(`${mod.name} ${label} 大幅增长${change.rate}%，表现优异`)
      }
    })
  })
  return highlights.slice(0, 5)
}

function extractAnomalies(analysis, labelMap = {}) {
  const anomalies = []
  Object.keys(analysis).forEach(key => {
    const mod = analysis[key]
    Object.keys(mod.changes).forEach(field => {
      const change = mod.changes[field]
      if (change.is_anomaly) {
        const label = labelMap[field] || field
        const dir = change.rate > 0 ? '上升' : '下降'
        anomalies.push(`${mod.name} ${label} ${dir}${Math.abs(change.rate)}%，需关注`)
      }
    })
  })
  return anomalies
}

module.exports = {
  getCurrentReport, getReportById, getReportList,
  saveModuleData, saveDraft, getDrafts,
  submitReport, generateReport, publishReport, updateReportContent
}
