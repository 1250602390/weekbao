<template>
  <div class="bg-gray-50 min-h-screen flex items-center justify-center m-0">
    <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <i class="fa fa-map-marker text-primary text-2xl"></i>
        </div>
        <h1 class="text-2xl font-bold text-gray-800">基础数据生产周报平台</h1>
        <p class="text-gray-500 mt-2">智能生成 · 价值呈现 · 标准化汇报</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
          <input
            v-model="form.username"
            type="text"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="请输入用户名"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="请输入密码"
            required
          />
        </div>
        <div v-if="errorMsg" class="text-danger text-sm">{{ errorMsg }}</div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
        >
          <i v-if="loading" class="fa fa-spinner fa-spin mr-2"></i>
          <i v-else class="fa fa-user-circle mr-2"></i>
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-gray-500">
        <p>登录即同意<a href="#" class="text-primary hover:underline">用户协议</a>与<a href="#" class="text-primary hover:underline">隐私政策</a></p>
      </div>

      <div class="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-400">
        <p>测试账号：admin / admin123（管理员）</p>
        <p>测试账号：manager / manager123（管理者）</p>
        <p>测试账号：viewer / viewer123（查阅者）</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  username: '',
  password: ''
})

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await authStore.login(form.username, form.password)
    if (res.code === 0) {
      router.push('/')
    } else {
      errorMsg.value = res.msg || '登录失败'
    }
  } catch (err) {
    errorMsg.value = err.msg || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>
