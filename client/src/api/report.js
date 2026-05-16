import api from './index'

export function getCurrentReport() {
  return api.get('/reports/current')
}

export function getReportList(params) {
  return api.get('/reports', { params })
}

export function getReportById(id) {
  return api.get(`/reports/${id}`)
}

export function saveModuleData(id, data) {
  return api.post(`/reports/${id}/data`, data)
}

export function saveDraft(reportId, module, data) {
  return api.put(`/reports/${reportId}/drafts/${module}`, { data })
}

export function getDrafts(reportId) {
  return api.get(`/reports/${reportId}/drafts`)
}

export function submitReport(id) {
  return api.post(`/reports/${id}/submit`)
}

export function generateReport(id) {
  return api.post(`/reports/${id}/generate`)
}

export function updateReportContent(id, data) {
  return api.put(`/reports/${id}/content`, data)
}

export function publishReport(id) {
  return api.post(`/reports/${id}/publish`)
}
