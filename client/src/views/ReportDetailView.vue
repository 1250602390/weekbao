<template>
  <div>
    <!-- 顶部操作栏 -->
    <div class="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center">
      <div class="flex items-center space-x-2">
        <button @click="router.push('/history')" class="text-gray-400 hover:text-gray-600 mr-2"><i class="fa fa-arrow-left"></i></button>
        <h2 class="text-lg font-bold">周报详情</h2>
      </div>
      <div class="flex items-center space-x-3">
        <div class="flex border rounded-lg overflow-hidden">
          <button @click="version = 'summary'" class="px-4 py-1.5 text-sm" :class="version === 'summary' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-50'">执行摘要版</button>
          <button @click="version = 'detail'" class="px-4 py-1.5 text-sm" :class="version === 'detail' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-50'">详细分析版</button>
        </div>
        <button @click="handleExportPDF" class="bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300 text-sm"><i class="fa fa-file-pdf-o mr-1"></i>PDF</button>
        <button @click="handleExportWord" class="bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300 text-sm"><i class="fa fa-file-word-o mr-1"></i>Word</button>
        <button @click="handleShare" class="bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300 text-sm"><i class="fa fa-share-alt mr-1"></i>分享</button>
      </div>
    </div>

    <div v-if="report" class="max-w-4xl mx-auto">
      <!-- 标题区 -->
      <div class="bg-white rounded-lg shadow p-8 mb-4">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-800">{{ report.year }}年第{{ report.week_number }}周基础数据生产周报</h1>
          <p class="text-gray-500 mt-2">统计周期：{{ report.start_date }} 至 {{ report.end_date }}</p>
          <p v-if="report.published_at" class="text-gray-400 text-sm mt-1">发布时间：{{ formatDateTime(report.published_at) }}</p>
        </div>

        <!-- 核心数字卡片 -->
        <MetricCards :metrics="keyMetrics" />
      </div>

      <!-- 周报内容 -->
      <div class="bg-white rounded-lg shadow p-8">
        <div class="prose max-w-none" v-html="currentContent"></div>
      </div>
    </div>

    <div v-else class="text-center py-20 text-gray-400">
      <i class="fa fa-spinner fa-spin text-4xl"></i>
      <p class="mt-4">加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getReportById } from '@/api/report'
import { formatDateTime } from '@/utils/weekCalc'
import { exportToPDF, exportToWord } from '@/utils/export'
import MetricCards from '@/components/MetricCards.vue'

const route = useRoute()
const router = useRouter()
const report = ref(null)
const version = ref('summary')

const keyMetrics = computed(() => {
  if (!report.value?.moduleData) return []
  const result = []
  report.value.moduleData.forEach(d => {
    if (d.module === 'road' && d.data.road_verified_count !== undefined && d.data.road_verified_count !== null) {
      result.push({ label: '路网核实条数', value: d.data.road_verified_count, rate: '-' })
    }
    if (d.module === 'poi' && d.data.poi_new_count !== undefined && d.data.poi_new_count !== null) {
      result.push({ label: '新增POI数量', value: d.data.poi_new_count, rate: '-' })
    }
    if (d.module === 'cheat' && d.data.cheat_confirmed_count !== undefined && d.data.cheat_confirmed_count !== null) {
      result.push({ label: '作弊确认条数', value: d.data.cheat_confirmed_count, rate: '-' })
    }
    if (d.module === 'camera' && d.data.camera_new_count !== undefined && d.data.camera_new_count !== null) {
      result.push({ label: '电子眼新增', value: d.data.camera_new_count, rate: '-' })
    }
  })
  return result.slice(0, 4)
})

const currentContent = computed(() => {
  if (version.value === 'summary') return report.value?.summary_content || '<p class="text-gray-400">暂无摘要内容</p>'
  return report.value?.detail_content || '<p class="text-gray-400">暂无详细内容</p>'
})

function handleExportPDF() {
  exportToPDF(currentContent.value, `${report.value?.year}年第${report.value?.week_number}周周报.pdf`)
}

function handleExportWord() {
  exportToWord(currentContent.value, `${report.value?.year}年第${report.value?.week_number}周周报.docx`)
}

function handleShare() {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => alert('分享链接已复制到剪贴板')).catch(() => prompt('请手动复制分享链接：', url))
}

onMounted(async () => {
  const id = route.params.id
  if (!id) return router.push('/')
  try {
    const res = await getReportById(id)
    if (res.code === 0) report.value = res.data
  } catch {}
})
</script>
