import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getCurrentUser, logout as logoutApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  // 会话版本号：login 时递增，fetchUser 用旧版本号调用 clearAuth 时忽略
  let sessionVersion = token.value ? 0 : -1

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')
  const displayName = computed(() => user.value?.display_name || '')
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isManager = computed(() => user.value?.role === 'manager' || user.value?.role === 'admin')

  async function login(username, password) {
    const res = await loginApi({ username, password })
    if (res.code === 0) {
      sessionVersion++  // 递增版本号，使旧的 fetchUser 失效
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
    }
    return res
  }

  async function fetchUser() {
    const versionAtStart = sessionVersion
    try {
      const res = await getCurrentUser()
      if (sessionVersion !== versionAtStart) return
      if (res.code === 0) {
        user.value = res.data
        localStorage.setItem('user', JSON.stringify(res.data))
      }
    } catch (err) {
      if (sessionVersion === versionAtStart) {
        clearAuth()
      }
      throw err
    }
  }

  function clearAuth() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function logout() {
    try { await logoutApi() } catch {}
    clearAuth()
  }

  return { token, user, isLoggedIn, userRole, displayName, isAdmin, isManager, login, fetchUser, logout, clearAuth }
})
