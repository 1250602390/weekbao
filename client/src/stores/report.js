import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCurrentReport, saveModuleData as saveApi, saveDraft as saveDraftApi, submitReport as submitApi, generateReport as generateApi, publishReport as publishApi, updateReportContent as updateContentApi } from '@/api/report'

export const useReportStore = defineStore('report', () => {
  const currentReport = ref(null)
  const loading = ref(false)

  async function fetchCurrentReport() {
    loading.value = true
    try {
      const res = await getCurrentReport()
      if (res.code === 0) {
        currentReport.value = res.data
      }
      return res
    } finally {
      loading.value = false
    }
  }

  async function saveModule(reportId, module, data) {
    const res = await saveApi(reportId, { module, data })
    return res
  }

  async function saveDraftData(reportId, module, data) {
    const res = await saveDraftApi(reportId, module, data)
    return res
  }

  async function submit(id) {
    const res = await submitApi(id)
    return res
  }

  async function generate(id) {
    const res = await generateApi(id)
    return res
  }

  async function publish(id) {
    const res = await publishApi(id)
    return res
  }

  async function updateContent(id, data) {
    const res = await updateContentApi(id, data)
    return res
  }

  return { currentReport, loading, fetchCurrentReport, saveModule, saveDraftData, submit, generate, publish, updateContent }
})
