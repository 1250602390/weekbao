<template>
  <div>
    <!-- 顶部操作栏 -->
    <div class="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold">
          {{ report ? `${report.year}年第${report.week_number}周周报填报` : '加载中...' }}
          <span v-if="report" class="text-sm font-normal text-gray-500 ml-2">
            ({{ report.start_date }} ~ {{ report.end_date }})
          </span>
        </h2>
      </div>
      <div class="flex items-center space-x-3">
        <CountdownTimer v-if="report" :deadline="deadline" />
        <button @click="handleSaveDraft" class="bg-gray-200 px-3 py-1.5 rounded hover:bg-gray-300 text-sm">
          <i class="fa fa-save mr-1"></i>保存草稿
        </button>
        <button @click="handleSubmit" class="bg-primary text-white px-4 py-1.5 rounded hover:bg-primary/90 text-sm">
          <i class="fa fa-check mr-1"></i>生成周报
        </button>
      </div>
    </div>

    <div v-if="report" class="flex flex-col lg:flex-row gap-6">
      <!-- 左侧模块导航 -->
      <aside class="lg:w-56 lg:sticky lg:top-20 flex-shrink-0">
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="font-semibold mb-3 text-gray-800">填报模块导航</h3>
          <nav class="space-y-1">
            <a
              v-for="(mod, idx) in modules"
              :key="mod.key"
              :href="`#mod-${mod.key}`"
              class="flex items-center px-3 py-2 rounded text-sm transition-colors"
              :class="activeModule === mod.key ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100 text-gray-600'"
              @click.prevent="scrollToModule(mod.key)"
            >
              <span class="w-5 text-center mr-2 text-xs">{{ idx + 1 }}</span>
              {{ mod.name }}
              <i v-if="moduleFilled[mod.key]" class="fa fa-check-circle text-success ml-auto text-xs"></i>
            </a>
          </nav>
          <div class="mt-4 pt-3 border-t">
            <div class="flex justify-between text-sm text-gray-500">
              <span>填报进度</span>
              <span class="text-primary font-semibold">{{ filledCount }}/{{ modules.length }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div class="bg-primary rounded-full h-1.5 transition-all" :style="{ width: `${(filledCount / modules.length) * 100}%` }"></div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧表单区域 -->
      <div class="flex-1">
        <div class="bg-white rounded-lg shadow p-6">
          <div v-for="(mod, modIdx) in modules" :key="mod.key" :id="`mod-${mod.key}`" class="mb-8">
            <h3 class="text-lg font-semibold mb-4 pb-2 border-b flex items-center">
              <span class="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm mr-2">{{ modIdx + 1 }}</span>
              {{ mod.name }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="field in getModuleFields(mod.key)" :key="field.field_key" :class="field.field_type === 'textarea' ? 'md:col-span-2' : ''">
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  {{ field.field_label }}
                  <span v-if="field.required" class="text-danger">*</span>
                </label>

                <!-- number 类型 -->
                <div v-if="field.field_type === 'number'" class="flex">
                  <input
                    v-model.number="formData[mod.key][field.field_key]"
                    type="number"
                    class="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                    :placeholder="`请输入${field.field_label}`"
                  />
                  <span v-if="field.unit" class="px-3 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-500">{{ field.unit }}</span>
                </div>

                <!-- text 类型 -->
                <div v-else-if="field.field_type === 'text'" class="flex">
                  <input
                    v-model="formData[mod.key][field.field_key]"
                    type="text"
                    class="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                    :placeholder="`请输入${field.field_label}`"
                  />
                  <span v-if="field.unit" class="px-3 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-500">{{ field.unit }}</span>
                </div>

                <!-- select 类型 -->
                <select
                  v-else-if="field.field_type === 'select'"
                  v-model="formData[mod.key][field.field_key]"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                >
                  <option value="">请选择</option>
                  <option v-for="opt in (field.options || [])" :key="opt" :value="opt">{{ opt }}</option>
                </select>

                <!-- textarea 类型 -->
                <textarea
                  v-else-if="field.field_type === 'textarea'"
                  v-model="formData[mod.key][field.field_key]"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                  rows="3"
                  :placeholder="`请填写${field.field_label}`"
                ></textarea>

                <!-- 上周数据参考 -->
                <div v-if="getLastWeekValue(mod.key, field.field_key) !== null" class="mt-1 text-xs text-gray-400 flex items-center">
                  <i class="fa fa-info-circle mr-1"></i>
                  上周：{{ getLastWeekValue(mod.key, field.field_key) }}{{ field.unit ? field.unit : '' }}
                  <span v-if="getChangeDisplay(mod.key, field.field_key)" class="ml-2" :class="getChangeDisplay(mod.key, field.field_key).cls">
                    {{ getChangeDisplay(mod.key, field.field_key).text }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-between pt-6 border-t mt-8">
            <button @click="handleSaveDraft" class="bg-gray-200 px-5 py-2 rounded hover:bg-gray-300 text-sm">
              <i class="fa fa-save mr-1"></i>保存草稿
            </button>
            <button @click="handleSubmit" class="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 text-sm">
              <i class="fa fa-check mr-1"></i>提交并生成周报
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20 text-gray-400">
      <i class="fa fa-spinner fa-spin text-4xl"></i>
      <p class="mt-4">加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useReportStore } from '@/stores/report'
import { getReportById, saveModuleData, saveDraft as saveDraftApi, getDrafts, submitReport } from '@/api/report'
import { getTemplateList } from '@/api/template'
import { getDeadline, getWeekPeriod } from '@/utils/weekCalc'
import { startDraftAutoSave, stopDraftAutoSave, saveBeforeUnload } from '@/utils/draft'
import CountdownTimer from '@/components/CountdownTimer.vue'

const router = useRouter()
const route = useRoute()
const reportStore = useReportStore()

const report = ref(null)
const templates = ref([])
const formData = reactive({})
const lastWeekData = ref({})
const activeModule = ref('road')

const deadline = computed(() => {
  if (!report.value) return new Date()
  return new Date(report.value.start_date + 'T09:00:00')
})

const modules = [
  { key: 'road', name: '路网核实模块' },
  { key: 'poi', name: 'POI数据模块' },
  { key: 'cheat', name: '作弊审核模块' },
  { key: 'speed', name: '限速信息模块' },
  { key: 'camera', name: '电子眼模块' },
  { key: 'value', name: '核心价值概要' },
  { key: 'team', name: '团队总结与下周计划' }
]

function getModuleFields(moduleKey) {
  return templates.value
    .filter(t => t.module === moduleKey && t.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
}

const moduleFilled = computed(() => {
  const result = {}
  modules.forEach(mod => {
    const data = formData[mod.key]
    const fields = getModuleFields(mod.key)
    const requiredFields = fields.filter(f => f.required)
    result[mod.key] = requiredFields.length > 0 && requiredFields.every(f => data[f.field_key] !== undefined && data[f.field_key] !== '' && data[f.field_key] !== null)
  })
  return result
})

const filledCount = computed(() => Object.values(moduleFilled.value).filter(Boolean).length)

function getLastWeekValue(moduleKey, fieldKey) {
  const lwd = lastWeekData.value[moduleKey]
  if (!lwd || lwd[fieldKey] === undefined) return null
  return lwd[fieldKey]
}

function getChangeDisplay(moduleKey, fieldKey) {
  const cur = formData[moduleKey]?.[fieldKey]
  const prev = getLastWeekValue(moduleKey, fieldKey)
  if (cur === undefined || cur === '' || prev === null || prev === 0) return null
  const rate = ((cur - prev) / prev * 100).toFixed(1)
  if (rate === 0) return null
  return {
    text: rate > 0 ? `↑${rate}%` : `↓${Math.abs(rate)}%`,
    cls: rate > 0 ? 'text-success' : 'text-danger'
  }
}

function scrollToModule(key) {
  activeModule.value = key
  const el = document.getElementById(`mod-${key}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 草稿保存提示（静默）
let lastDraftSaveTime = 0
async function handleSaveDraft(silent = false) {
  if (!report.value) return
  try {
    for (const mod of modules) {
      const data = { ...formData[mod.key] }
      Object.keys(data).forEach(k => { if (data[k] === '' || data[k] === null) delete data[k] })
      if (Object.keys(data).length > 0) {
        await saveDraftApi(report.value.id, mod.key, data)
      }
    }
    lastDraftSaveTime = Date.now()
    if (!silent) alert('草稿已保存')
  } catch (err) {
    if (!silent) alert('保存失败：' + (err.msg || '未知错误'))
  }
}

async function handleSubmit() {
  if (!report.value) return
  // 保存各模块数据
  try {
    for (const mod of modules) {
      const data = { ...formData[mod.key] }
      Object.keys(data).forEach(k => { if (data[k] === '' || data[k] === null) delete data[k] })
      if (Object.keys(data).length > 0) {
        await saveModuleData(report.value.id, { module: mod.key, data })
      }
    }
    await submitReport(report.value.id)
    router.push(`/report/preview/${report.value.id}`)
  } catch (err) {
    alert('提交失败：' + (err.msg || '未知错误'))
  }
}

onMounted(async () => {
  // 获取模板配置
  try {
    const tplRes = await getTemplateList()
    if (tplRes.code === 0) templates.value = tplRes.data
  } catch {}

  modules.forEach(mod => { formData[mod.key] = {} })

  const id = route.params.id
  try {
    let res
    if (id) {
      res = await getReportById(id)
    } else {
      res = await reportStore.fetchCurrentReport()
    }
    if (res.code === 0) {
      report.value = res.data
      if (res.data.moduleData) {
        res.data.moduleData.forEach(md => {
          Object.assign(formData[md.module], md.data)
        })
      }
      // C9: 加载未提交的草稿（草稿优先级低于已保存的moduleData，但覆盖空字段）
      if (report.value.id) {
        try {
          const draftRes = await getDrafts(report.value.id)
          if (draftRes.code === 0 && draftRes.data) {
            draftRes.data.forEach(d => {
              if (d.module && d.data) {
                Object.keys(d.data).forEach(key => {
                  if (formData[d.module][key] === undefined || formData[d.module][key] === '' || formData[d.module][key] === null) {
                    formData[d.module][key] = d.data[key]
                  }
                })
              }
            })
          }
        } catch {}
      }
      if (res.data.last_week_data) {
        res.data.last_week_data.forEach(lwd => {
          lastWeekData.value[lwd.module] = lwd.data
        })
      }
    }
  } catch {}

  // 启动草稿自动保存
  startDraftAutoSave(() => handleSaveDraft(true), 30000)

  // C8: 页面关闭前保存草稿
  cleanupBeforeUnload = saveBeforeUnload(() => handleSaveDraft(true))
})

let cleanupBeforeUnload = null
onUnmounted(() => {
  stopDraftAutoSave()
  if (cleanupBeforeUnload) cleanupBeforeUnload()
})
</script>
