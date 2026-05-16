const { Report } = require('../models')
const { getWeekPeriod, getWeekNumber } = require('../utils/weekHelper')
const cron = require('node-cron')

function startCronJobs() {
  // 每周三16:00自动创建下周周报模板
  cron.schedule('0 16 * * 3', async () => {
    try {
      // 周三16:00，需要为"下周"（即明天周四开始的那一周）创建周报
      // getWeekPeriod在周三会返回上周四~本周三，所以+7天取下周四
      const now = new Date()
      const nextThursday = new Date(now)
      nextThursday.setDate(now.getDate() + 1) // 明天是周四
      // 取下周四（+8天=下周四），这样 getWeekPeriod 返回下周的周四~周三
      const nextWeekRef = new Date(now)
      nextWeekRef.setDate(now.getDate() + 8)
      const period = getWeekPeriod(nextWeekRef)
      const weekNum = getWeekNumber(nextWeekRef)
      const year = new Date(period.start).getFullYear()

      const existing = Report.findOne({ start_date: period.start })
      if (existing) {
        console.log(`[Cron] 周报已存在: ${year}年第${weekNum}周`)
        return
      }

      Report.create({
        week_number: weekNum,
        year,
        start_date: period.start,
        end_date: period.end,
        status: 'draft'
      })

      console.log(`[Cron] 已创建周报: ${year}年第${weekNum}周 (${period.start} ~ ${period.end})`)
      console.log('[Notify] 新周报已创建，请于周四09:00前完成填报')
    } catch (err) {
      console.error('[Cron] 创建周报失败:', err.message)
    }
  })

  console.log('[Cron] 定时任务已启动：每周三16:00自动创建周报')
}

module.exports = { startCronJobs }
