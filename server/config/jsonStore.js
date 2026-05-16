/**
 * 轻量JSON文件存储方案
 * 生产环境切换为Sequelize + PostgreSQL
 * 开发环境使用JSON文件存储，无需编译原生模块
 */
const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '../../data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 初始化数据结构
const defaultData = {
  users: [],
  reports: [],
  report_data: [],
  report_drafts: [],
  operation_logs: [],
  template_configs: [],
  _counters: { users: 0, reports: 0, report_data: 0, report_drafts: 0, operation_logs: 0, template_configs: 0 }
}

let data = null

function loadData() {
  if (data) return data
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8')
      data = JSON.parse(raw)
    } else {
      data = JSON.parse(JSON.stringify(defaultData))
      saveData()
    }
  } catch (err) {
    // C6: 解析失败时备份损坏文件，避免静默覆盖
    const backupFile = DB_FILE + '.corrupted.' + Date.now()
    console.error(`[JsonStore] db.json 解析失败，备份至 ${backupFile}: ${err.message}`)
    try {
      fs.renameSync(DB_FILE, backupFile)
    } catch (renameErr) {
      console.error('[JsonStore] 备份失败:', renameErr.message)
    }
    data = JSON.parse(JSON.stringify(defaultData))
    saveData()
  }
  return data
}

// C7: 原子写入 — 先写临时文件再重命名，避免断电导致文件损坏
let saveTimer = null
function saveData() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const tmpFile = DB_FILE + '.tmp'
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8')
      fs.renameSync(tmpFile, DB_FILE)
    } catch (err) {
      console.error('[JsonStore] Save data error:', err.message)
    }
  }, 100)
}

// 优雅关机：进程退出前将内存数据刷入磁盘
function flushData() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  if (data) {
    try {
      const tmpFile = DB_FILE + '.tmp'
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8')
      fs.renameSync(tmpFile, DB_FILE)
    } catch (err) {
      console.error('[JsonStore] Flush error on shutdown:', err.message)
    }
  }
}

process.on('SIGINT', () => { flushData(); process.exit(0) })
process.on('SIGTERM', () => { flushData(); process.exit(0) })

function nextId(table) {
  const d = loadData()
  if (!d._counters[table]) d._counters[table] = 0
  return ++d._counters[table]
}

// ============ 通用CRUD操作 ============

function findAll(table, where = {}, options = {}) {
  const d = loadData()
  let rows = d[table] || []
  // where条件过滤
  if (Object.keys(where).length > 0) {
    rows = rows.filter(row => {
      return Object.keys(where).every(key => {
        const val = where[key]
        if (val && typeof val === 'object') {
          if (val.gte !== undefined && val.lte !== undefined) return row[key] >= val.gte && row[key] <= val.lte
          if (val.gte !== undefined) return row[key] >= val.gte
          if (val.lte !== undefined) return row[key] <= val.lte
        }
        return row[key] === val
      })
    })
  }
  // 排序
  if (options.order) {
    const [field, dir] = options.order[0]
    rows.sort((a, b) => {
      if (a[field] < b[field]) return dir === 'DESC' ? 1 : -1
      if (a[field] > b[field]) return dir === 'DESC' ? -1 : 1
      return 0
    })
  }
  const total = rows.length
  // 分页
  if (options.limit) {
    const offset = options.offset || 0
    rows = rows.slice(offset, offset + options.limit)
  }
  return { rows, count: total }
}

function findById(table, id) {
  const d = loadData()
  return (d[table] || []).find(row => row.id === id) || null
}

function findOne(table, where) {
  const d = loadData()
  return (d[table] || []).find(row => {
    return Object.keys(where).every(key => row[key] === where[key])
  }) || null
}

// H4: create() 不允许外部覆盖 id
function create(table, record) {
  const d = loadData()
  const id = nextId(table)
  const now = new Date().toISOString()
  const { id: _ignoredId, ...safeRecord } = record
  const newRecord = {
    ...safeRecord,
    id,
    created_at: now,
    updated_at: now
  }
  if (!d[table]) d[table] = []
  d[table].push(newRecord)
  saveData()
  return newRecord
}

function update(table, id, updates) {
  const d = loadData()
  const idx = (d[table] || []).findIndex(row => row.id === id)
  if (idx === -1) return null
  d[table][idx] = {
    ...d[table][idx],
    ...updates,
    updated_at: new Date().toISOString()
  }
  saveData()
  return d[table][idx]
}

function remove(table, where) {
  const d = loadData()
  d[table] = (d[table] || []).filter(row => {
    return !Object.keys(where).every(key => row[key] === where[key])
  })
  saveData()
}

function removeById(table, id) {
  return remove(table, { id })
}

function bulkCreate(table, records) {
  const results = []
  records.forEach(record => {
    results.push(create(table, record))
  })
  return results
}

function count(table, where = {}) {
  return findAll(table, where).count
}

module.exports = {
  loadData, saveData, flushData, nextId,
  findAll, findById, findOne,
  create, update, remove, removeById, bulkCreate, count
}
