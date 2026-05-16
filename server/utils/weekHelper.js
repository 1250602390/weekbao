function getWeekPeriod(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()

  // 计算本周四的日期
  let thursday
  if (day === 0) {
    // 周日 -> 上周四
    thursday = new Date(d)
    thursday.setDate(d.getDate() - 3)
  } else if (day >= 4) {
    // 周四~周六 -> 本周四
    thursday = new Date(d)
    thursday.setDate(d.getDate() - (day - 4))
  } else {
    // 周一~周三 -> 上周四
    thursday = new Date(d)
    thursday.setDate(d.getDate() - (day + 3))
  }

  const wednesday = new Date(thursday)
  wednesday.setDate(thursday.getDate() + 6)

  return { start: formatDate(thursday), end: formatDate(wednesday) }
}

function getWeekNumber(date) {
  const period = getWeekPeriod(date)
  const thursday = new Date(period.start + 'T00:00:00Z')
  // ISO-8601 week number: based on the Thursday of the week
  // Thursday always falls in the correct ISO week
  const tmpDate = new Date(Date.UTC(thursday.getFullYear(), thursday.getMonth(), thursday.getDate()))
  tmpDate.setUTCDate(tmpDate.getUTCDate() + 4 - (tmpDate.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmpDate.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmpDate - yearStart) / 86400000 + 1) / 7)
}

function getNextThursday() {
  const now = new Date()
  const day = now.getDay()
  const daysUntilThursday = (4 - day + 7) % 7 || 7
  const nextThursday = new Date(now)
  nextThursday.setDate(now.getDate() + daysUntilThursday)
  return formatDate(nextThursday)
}

function formatDate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function calcChangeRate(current, previous) {
  if (!previous || previous === 0) {
    return current > 0 ? '新增' : '-'
  }
  const rate = ((current - previous) / previous * 100).toFixed(1)
  return parseFloat(rate)
}

function isAnomaly(rate, module) {
  if (typeof rate !== 'number') return false
  const threshold = module === 'cheat' ? 20 : 30
  return Math.abs(rate) > threshold
}

module.exports = { getWeekPeriod, getWeekNumber, getNextThursday, formatDate, calcChangeRate, isAnomaly }
