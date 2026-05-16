import api from './index'

export function getTemplateList(params) {
  return api.get('/templates', { params })
}

export function updateTemplate(id, data) {
  return api.put(`/templates/${id}`, data)
}
