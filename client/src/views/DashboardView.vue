<template>
  <div>
    <!-- 待办提醒 -->
    <div v-if="pendingReport" class="bg-warning/10 border-l-4 border-warning p-4 rounded-lg mb-6">
      <div class="flex items-center">
        <i class="fa fa-exclamation-triangle text-warning mr-3 text-lg"></i>
        <div>
          <h3 class="font-semibold text-gray-800">待办提醒</h3>
          <p class="text-gray-600 text-sm">您有1份周报待填报，截止时间：本周四 09:00</p>
        </div>
        <CountdownTimer v-if="pendingReport" :deadline="new Date(pendingReport.start_date + 'T09:00:00')" />
        <router-link
          :to="`/report/fill/${pendingReport.id}`"
          class="ml-auto bg-warning hover:bg-warning/90 text-white px-4 py-2 rounded-lg text-sm"
        >立即填报</router-link>
      </div>
    </div>

    <!-- 快捷入口卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer" @click="pendingReport ? router.push(`/report/fill/${pendingReport.id}`) : router.push('/report/fill')">
        <div class="flex items-center mb-3">
          <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
            <i class="fa fa-pencil text-primary"></i>
          </div>
          <h3 class="font-semibold">周报填报</h3>
        </div>
        <p class="text-gray-500 text-sm">填写本周生产数据，自动生成智能周报</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer" @click="viewLatestReport">
        <div class="flex items-center mb-3">
          <div class="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center mr-3">
            <i class="fa fa-file-text-o text-success"></i>
          </div>
          <h3 class="font-semibold">最新周报查看</h3>
        </div>
        <p class="text-gray-500 text-sm">查看已生成发布的本周完整周报</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer" @click="router.push('/history')">
        <div class="flex items-center mb-3">
          <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
            <i class="fa fa-history text-gray-600"></i>
          </div>
          <h3 class="font-semibold">历史周报查询</h3>
        </div>
        <p class="text-gray-500 text-sm">按周期查询、导出历史所有周报</p>
      </div>
    </div>

    <!-- 本周核心数据概览 -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h3 class="font-semibold text-gray-800 mb-4">本周核心数据概览</h3>
      <MetricCards v-if="metrics.length" :metrics="metrics" />
      <div v-else class="text-center text-gray-400 py-8">
        <i class="fa fa-bar-chart text-3xl mb-2"></i>
        <p>暂无本周数据，请先填报周报</p>
      </div>
    </div>

    <!-- 近期趋势图 -->
    <div v-if="trendWeeks.length >= 2" class="mb-6">
      <WeekTrendChart title="近期数据趋势" :weeks="trendWeeks" height="300px" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '@/stores/report'
import { getReportList } from '@/api/report'
import MetricCards from '@/components/MetricCards.vue'
import WeekTrendChart from '@/components/WeekTrendChart.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'

const router = useRouter()
const reportStore = useReportStore()
const pendingReport = ref(null)
const latestPublished = ref(null)
const recentReports = ref([])

const metrics = computed(() => {
  if (!reportStore.currentReport?.moduleData) return []
  const data = reportStore.currentReport.moduleData
  const result = []
  data.forEach(d => {
    if (d.module === 'road' && d.data.road_verified_count) {
      const rate = getChangeRate(d.data.road_verified_count, d.data._last_road_verified_count)
      result.push({ label: '路网核实条数', value: d.data.road_verified_count, rate })
    }
    if (d.module === 'poi' && d.data.poi_new_count) {
      const rate = getChangeRate(d.data.poi_new_count, d.data._last_poi_new_count)
      result.push({ label: '新增POI数量', value: d.data.poi_new_count, rate })
    }
    if (d.module === 'cheat' && d.data.cheat_audit_total) {
      const rate = getChangeRate(d.data.cheat_audit_total, d.data._last_cheat_audit_total)
      result.push({ label: '作弊审核量', value: d.data.cheat_audit_total, rate })
    }
    if (d.module === 'cheat' && d.data.cheat_loss_avoided) {
      const rate = getChangeRate(d.data.cheat_loss_avoided, d.data._last_cheat_loss_avoided)
      result.push({ label: '反作弊止损(万元)', value: d.data.cheat_loss_avoided, rate })
    }
  })
  return result
})

// 趋势数据
const trendWeeks = computed(() => {
  return recentReports.value.map(r => {
    const roadData = r.moduleData?.find(m => m.module === 'road')?.data || {}
    const poiData = r.moduleData?.find(m => m.module === 'poi')?.data || {}
    return {
      week: r.week_number,
      metrics: {
        '路网核实': roadData.road_verified_count || 0,
        '新增POI': poiData.poi_new_count || 0
      }
    }
  })
})

function getChangeRate(cur, prev) {
  if (!prev || prev === 0) return cur > 0 ? '新增' : '-'
  return parseFloat(((cur - prev) / prev * 100).toFixed(1))
}

function viewLatestReport() {
  if (latestPublished.value) router.push(`/report/detail/${latestPublished.value.id}`)
}

onMounted(async () => {
  // 获取当前周报
  try {
    const res = await reportStore.fetchCurrentReport()
    if (res.code === 0) {
      const report = res.data
      if (report.status === 'draft' || report.status === 'submitted') {
        pendingReport.value = report
      }
      // 合并上周数据
      if (report.last_week_data) {
        report.last_week_data.forEach(lwd => {
          const mod = report.moduleData.find(m => m.module === lwd.module)
          if (mod) {
            Object.keys(lwd.data).forEach(key => { mod.data[`_last_${key}`] = lwd.data[key] })
          }
        })
      }
    }
  } catch {}

  // 获取最新已发布周报
  try {
    const res = await getReportList({ page: 1, page_size: 1, status: 'published' })
    if (res.code === 0 && res.data.list.length > 0) {
      latestPublished.value = res.data.list[0]
    }
  } catch {}

  // 获取近期周报用于趋势图
  try {
    const res = await getReportList({ page: 1, page_size: 8 })
    if (res.code === 0) {
      recentReports.value = res.data.list.reverse()
    }
  } catch {}
})
</script>
