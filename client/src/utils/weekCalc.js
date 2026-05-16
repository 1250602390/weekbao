/**
 * 周期计算：周四~下周三
 */
export function getWeekPeriod(date) {
  const d = new Date(date || new Date())
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()

  let thursday
  if (day === 0) {
    thursday = new Date(d)
    thursday.setDate(d.getDate() - 3)
  } else if (day >= 4) {
    thursday = new Date(d)
    thursday.setDate(d.getDate() - (day - 4))
  } else {
    thursday = new Date(d)
    thursday.setDate(d.getDate() - (day + 3))
  }

  const wednesday = new Date(thursday)
  wednesday.setDate(thursday.getDate() + 6)

  return { start: formatDate(thursday), end: formatDate(wednesday) }
}

export function getWeekNumber(date) {
  const period = getWeekPeriod(date)
  const thursday = new Date(period.start + 'T00:00:00Z')
  const tmpDate = new Date(Date.UTC(thursday.getFullYear(), thursday.getMonth(), thursday.getDate()))
  tmpDate.setUTCDate(tmpDate.getUTCDate() + 4 - (tmpDate.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmpDate.getUTCFullYear(), 0, 1))
  return Math.ceil(((tmpDate - yearStart) / 86400000 + 1) / 7)
}

export function formatDate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateTime(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', { hour12: false })
}

/**
 * 环比变化率
 */
export function calcChangeRate(current, previous) {
  if (!previous || previous === 0) return current > 0 ? '新增' : '-'
  const rate = ((current - previous) / previous * 100).toFixed(1)
  return parseFloat(rate)
}

/**
 * 距离截止时间的倒计时
 */
export function getCountdown(deadline) {
  const now = new Date()
  const end = new Date(deadline)
  const diff = end - now
  if (diff <= 0) return '已截止'
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * 获取填报截止时间（本周四09:00）
 */
export function getDeadline() {
  const period = getWeekPeriod(new Date())
  const deadline = new Date(period.start + 'T09:00:00')
  return deadline
}
