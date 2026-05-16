<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.isLoggedIn) {
    try {
      await authStore.fetchUser()
    } catch {
      // fetchUser 内部已调用 clearAuth，这里只需确保导航到登录页
      // 注意：401 场景会由 api/index.js 的响应拦截器触发 redirectToLogin() 做整页跳转，
      // 此处的 router.push 用于覆盖非 401 异常或其他未触发整页跳转的错误场景
      if (!authStore.isLoggedIn) {
        router.push('/login')
      }
    }
  }
})
</script>
