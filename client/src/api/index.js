import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// H8: 客户端token过期检查
function isTokenExpired(token) {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

// 请求拦截：附带token + 过期检查
api.interceptors.request.use(config => {
  const authStore = useAuthStore()
  if (authStore.token) {
    if (isTokenExpired(authStore.token)) {
      authStore.clearAuth()
      router.push('/login')
      return Promise.reject(new Error('Token expired'))
    }
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

// 响应拦截：统一错误处理
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.clearAuth()
      router.push('/login')
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default api
