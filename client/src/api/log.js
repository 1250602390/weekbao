import api from './index'

export function getLogList(params) {
  return api.get('/logs', { params })
}
