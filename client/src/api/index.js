import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 辅助函数：从 localStorage 获取 token（避免循环依赖 stores/auth.js）
function getToken() {
  return localStorage.getItem('token') || ''
}

function clearAuthData() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

let isRedirecting = false
function redirectToLogin() {
  if (isRedirecting) return
  isRedirecting = true
  clearAuthData()
  window.location.replace('/login')
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

export function isTokenExpired(token) {
  if (!token) return true
  try {
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1]))
    if (!payload.exp || typeof payload.exp !== 'number') {
      console.warn('[Auth] Token 缺少有效的 exp 字段，视为无效')
      return true
    }
    return payload.exp * 1000 < Date.now()
  } catch (err) {
    console.warn('[Auth] Token 格式异常，无法解析:', err.message)
    return true
  }
}

// 请求拦截：附带token + 过期检查
api.interceptors.request.use(config => {
  const token = getToken()
  if (token) {
    if (isTokenExpired(token)) {
      redirectToLogin()
      return Promise.reject(new Error('Token expired'))
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：统一错误处理
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      const currentToken = getToken()
      const requestToken = (error.config?.headers?.Authorization || '').replace('Bearer ', '')
      if (currentToken && requestToken && currentToken !== requestToken) {
        return Promise.reject(error.response?.data || error)
      }
      redirectToLogin()
      return Promise.reject(error.response?.data || error)
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default api
