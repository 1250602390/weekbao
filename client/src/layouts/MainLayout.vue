<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <header class="bg-white shadow-md sticky top-0 z-50">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <i class="fa fa-map-marker text-primary text-xl"></i>
          <h1 class="text-lg font-bold text-gray-800">基础数据生产周报平台</h1>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-600">欢迎，{{ authStore.displayName }}</span>
          <span v-if="authStore.userRole" class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{{ roleLabel }}</span>
          <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer" @click="handleLogout">
            <i class="fa fa-sign-out text-gray-500"></i>
          </div>
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- 侧边菜单 -->
      <aside class="w-56 bg-white shadow-sm min-h-[calc(100vh-52px)] py-4 hidden lg:block flex-shrink-0">
        <nav class="space-y-1 px-3">
          <router-link
            v-for="item in menuItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors"
            :class="isActive(item.path) ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-100'"
          >
            <i :class="item.icon" class="w-5 mr-3 text-center"></i>
            {{ item.label }}
          </router-link>
        </nav>
      </aside>

      <!-- 主内容区 -->
      <main class="flex-1 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const roleLabel = computed(() => {
  const map = { admin: '系统管理员', manager: '生产管理者', viewer: '查阅决策者' }
  return map[authStore.userRole] || ''
})

const menuItems = computed(() => {
  const items = [
    { path: '/', label: '工作台', icon: 'fa fa-home' },
    { path: '/history', label: '历史周报', icon: 'fa fa-history' }
  ]
  if (authStore.isManager) {
    items.splice(1, 0, { path: '/report/fill', label: '周报填报', icon: 'fa fa-pencil' })
  }
  if (authStore.isAdmin) {
    items.push(
      { path: '/admin/users', label: '用户管理', icon: 'fa fa-users' },
      { path: '/admin/templates', label: '模板配置', icon: 'fa fa-cog' },
      { path: '/admin/logs', label: '操作日志', icon: 'fa fa-list-alt' }
    )
  }
  return items
})

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
