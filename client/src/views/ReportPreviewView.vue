<template>
  <div>
    <!-- 顶部操作栏 -->
    <div class="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center sticky top-0 z-40">
      <div class="flex items-center space-x-2">
        <button @click="router.push('/')" class="text-gray-400 hover:text-gray-600 mr-2"><i class="fa fa-arrow-left"></i></button>
        <h2 class="text-lg font-bold">周报预览编辑</h2>
      </div>
      <div class="flex items-center space-x-3">
        <div class="flex border rounded-lg overflow-hidden">
          <button @click="version = 'summary'" class="px-4 py-1.5 text-sm" :class="version === 'summary' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-50'">执行摘要版</button>
          <button @click="version = 'detail'" class="px-4 py-1.5 text-sm" :class="version === 'detail' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-50'">详细分析版</button>
        </div>
        <div class="flex items-center space-x-1">
          <button @click="handleExportPDF" class="bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300 text-sm" title="导出PDF">
            <i class="fa fa-file-pdf-o mr-1"></i>PDF
          </button>
          <button @click="handleExportWord" class="bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300 text-sm" title="导出Word">
            <i class="fa fa-file-word-o mr-1"></i>Word
          </button>
        </div>
        <button
          v-if="authStore.isManager && report?.status === 'generated'"
          @click="handlePublish"
          class="bg-success text-white px-4 py-1.5 rounded hover:bg-success/90 text-sm"
        ><i class="fa fa-paper-plane mr-1"></i>发布归档</button>
      </div>
    </div>

    <div v-if="report" class="max-w-4xl mx-auto">
      <!-- 周报标题 -->
      <div class="bg-white rounded-lg shadow p-8 mb-4">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-800">{{ report.year }}年第{{ report.week_number }}周基础数据生产周报</h1>
          <p class="text-gray-500 mt-2">统计周期：{{ report.start_date }} 至 {{ report.end_date }}</p>
        </div>

        <!-- 核心数字卡片 -->
        <MetricCards :metrics="keyMetrics" />
      </div>

      <!-- 图表区域（摘要版显示环比图） -->
      <div v-if="version === 'summary' && moduleChartData.length" class="mb-4">
        <ModuleBarChart
          v-for="chart in moduleChartData"
          :key="chart.key"
          :title="chart.title"
          :current-data="chart.current"
          :last-data="chart.last"
          :field-labels="chart.labels"
          height="280px"
        />
      </div>

      <!-- 周报正文（可编辑） -->
      <div class="bg-white rounded-lg shadow p-8">
        <div v-if="version === 'summary'">
          <!-- 亮点区域 -->
          <div v-if="highlights.length" class="mb-6 bg-success/5 border-l-4 border-success p-4 rounded">
            <h3 class="font-semibold text-success mb-2"><i class="fa fa-star mr-1"></i>本周最大亮点</h3>
            <ul class="space-y-1">
              <li v-for="(h, i) in highlights" :key="i" class="text-gray-700 text-sm">{{ h }}</li>
            </ul>
          </div>
          <!-- 异常告警 -->
          <div v-if="anomalies.length" class="mb-6 bg-danger/5 border-l-4 border-danger p-4 rounded">
            <h3 class="font-semibold text-danger mb-2"><i class="fa fa-exclamation-triangle mr-1"></i>异常告警</h3>
            <ul class="space-y-1">
              <li v-for="(a, i) in anomalies" :key="i" class="text-gray-700 text-sm">{{ a }}</li>
            </ul>
          </div>
        </div>

        <!-- 可编辑内容 -->
        <div
          ref="contentArea"
          class="prose max-w-none min-h-[200px] p-4 border border-dashed border-gray-200 rounded-lg focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          contenteditable="true"
          @blur="handleContentEdit"
        ></div>
        <p class="text-xs text-gray-400 mt-2"><i class="fa fa-info-circle mr-1"></i>点击上方区域可直接编辑周报文案</p>
      </div>
    </div>

    <div v-else class="text-center py-20 text-gray-400">
      <i class="fa fa-spinner fa-spin text-4xl"></i>
      <p class="mt-4">加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getReportById, generateReport, publishReport, updateReportContent } from '@/api/report'
import { getTemplateList } from '@/api/template'
import { exportToPDF, exportToWord } from '@/utils/export'
import MetricCards from '@/components/MetricCards.vue'
import ModuleBarChart from '@/components/ModuleBarChart.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const report = ref(null)
const version = ref('summary')
const editedSummary = ref('')
const editedDetail = ref('')
const templateLabels = ref({})
const contentArea = ref(null)

const MODULE_NAMES = {
  road: '路网核实', poi: 'POI数据', cheat: '作弊审核',
  speed: '限速信息', camera: '电子眼', value: '核心价值概要', team: '团队总结与下周计划'
}

// 核心指标卡片
const keyMetrics = computed(() => {
  if (!report.value?.moduleData) return []
  const result = []
  report.value.moduleData.forEach(d => {
    if (d.module === 'road' && d.data.road_verified_count !== undefined && d.data.road_verified_count !== null) {
      const rate = getChangeRate(d.data.road_verified_count, d.data._last_road_verified_count)
      result.push({ label: '路网核实条数', value: d.data.road_verified_count, rate, unit: '条' })
    }
    if (d.module === 'poi' && d.data.poi_new_count !== undefined && d.data.poi_new_count !== null) {
      const rate = getChangeRate(d.data.poi_new_count, d.data._last_poi_new_count)
      result.push({ label: '新增POI数量', value: d.data.poi_new_count, rate, unit: '个' })
    }
    if (d.module === 'cheat' && d.data.cheat_confirmed_count !== undefined && d.data.cheat_confirmed_count !== null) {
      const rate = getChangeRate(d.data.cheat_confirmed_count, d.data._last_cheat_confirmed_count)
      const anomaly = typeof rate === 'number' && Math.abs(rate) > 20
      result.push({ label: '作弊确认条数', value: d.data.cheat_confirmed_count, rate, unit: '条', color: anomaly ? 'text-danger' : '', anomaly })
    }
    if (d.module === 'cheat' && d.data.cheat_loss_avoided !== undefined && d.data.cheat_loss_avoided !== null) {
      const rate = getChangeRate(d.data.cheat_loss_avoided, d.data._last_cheat_loss_avoided)
      result.push({ label: '反作弊止损(万元)', value: d.data.cheat_loss_avoided, rate })
    }
  })
  return result
})

// 图表数据
const moduleChartData = computed(() => {
  if (!report.value?.moduleData) return []
  const charts = []
  report.value.moduleData.forEach(d => {
    const numericFields = {}
    const lastFields = {}
    const labels = {}
    Object.keys(d.data).forEach(key => {
      if (typeof d.data[key] === 'number' && !key.startsWith('_last_')) {
        numericFields[key] = d.data[key]
        lastFields[key] = d.data[`_last_${key}`] || 0
        labels[key] = templateLabels.value[key] || key
      }
    })
    if (Object.keys(numericFields).length > 0) {
      charts.push({
        key: d.module,
        title: MODULE_NAMES[d.module] + ' - 环比对比',
        current: numericFields,
        last: lastFields,
        labels
      })
    }
  })
  return charts
})

// 亮点与告警
const highlights = computed(() => {
  if (!report.value?.moduleData) return []
  const list = []
  report.value.moduleData.forEach(d => {
    if (d.module === 'value') {
      if (d.data.value_user_feedback) list.push(d.data.value_user_feedback)
      if (d.data.value_quality_incident) list.push(d.data.value_quality_incident)
    }
  })
  return list
})

const anomalies = computed(() => {
  if (!report.value?.moduleData) return []
  const list = []
  report.value.moduleData.forEach(d => {
    Object.keys(d.data).forEach(key => {
      if (typeof d.data[key] === 'number' && !key.startsWith('_last_')) {
        const prev = d.data[`_last_${key}`]
        if (prev && typeof prev === 'number') {
          const rate = ((d.data[key] - prev) / prev * 100).toFixed(1)
          const threshold = d.module === 'cheat' ? 20 : 30
          if (Math.abs(rate) > threshold) {
            const dir = rate > 0 ? '上升' : '下降'
            list.push(`${MODULE_NAMES[d.module]} ${templateLabels.value[key] || key} ${dir}${Math.abs(rate)}%，需关注`)
          }
        }
      }
    })
  })
  return list
})

const currentContent = computed(() => {
  if (version.value === 'summary') return editedSummary.value || report.value?.summary_content || '<p class="text-gray-400">暂无摘要内容，请先生成周报</p>'
  return editedDetail.value || report.value?.detail_content || '<p class="text-gray-400">暂无详细内容，请先生成周报</p>'
})

watch(currentContent, (html) => {
  nextTick(() => {
    if (contentArea.value && document.activeElement !== contentArea.value) {
      contentArea.value.innerHTML = html
    }
  })
})

watch(version, () => {
  nextTick(() => {
    if (contentArea.value) {
      contentArea.value.innerHTML = currentContent.value
    }
  })
})

function getChangeRate(cur, prev) {
  if (!prev || prev === 0) return cur > 0 ? '新增' : '-'
  return parseFloat(((cur - prev) / prev * 100).toFixed(1))
}

async function handleContentEdit(e) {
  const html = e.target.innerHTML
  if (version.value === 'summary') editedSummary.value = html
  else editedDetail.value = html
  if (report.value) {
    try {
      await updateReportContent(report.value.id, {
        summary_content: editedSummary.value || report.value.summary_content,
        detail_content: editedDetail.value || report.value.detail_content
      })
    } catch {}
  }
}

async function handlePublish() {
  if (!confirm('确认发布归档此周报？发布后可通过历史周报查看。')) return
  try {
    const res = await publishReport(report.value.id)
    if (res.code === 0) { alert('周报已发布归档'); report.value = res.data }
  } catch (err) { alert('发布失败：' + (err.msg || '未知错误')) }
}

function handleExportPDF() {
  exportToPDF(currentContent.value, `${report.value?.year}年第${report.value?.week_number}周周报.pdf`)
}

function handleExportWord() {
  exportToWord(currentContent.value, `${report.value?.year}年第${report.value?.week_number}周周报.docx`)
}

onMounted(async () => {
  const id = route.params.id
  if (!id) return router.push('/')

  // 获取模板标签映射
  try {
    const tplRes = await getTemplateList()
    if (tplRes.code === 0) {
      tplRes.data.forEach(t => { templateLabels.value[t.field_key] = t.field_label })
    }
  } catch {}

  try {
    const res = await getReportById(id)
    if (res.code === 0) {
      report.value = res.data
      if (res.data.status === 'submitted') {
        const genRes = await generateReport(id)
        if (genRes.code === 0) report.value = genRes.data
      }
    }
  } catch {}
})
</script>
