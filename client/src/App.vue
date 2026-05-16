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
  // 启动时验证 token 有效性，避免带着过期 token 进入页面后闪跳
  if (authStore.isLoggedIn) {
    try {
      await authStore.fetchUser()
    } catch {
      // fetchUser 内部已处理 clearAuth，token 无效时清理并跳转登录
      if (!authStore.isLoggedIn) {
        router.push('/login')
      }
    }
  }
})
</script>
