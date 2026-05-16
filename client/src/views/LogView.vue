<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold">操作日志</h2>
      <button @click="handleExport" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm">
        <i class="fa fa-download mr-1"></i>导出日志
      </button>
    </div>

    <!-- 筛选区 -->
    <div class="bg-gray-50 p-4 rounded-lg mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">操作时间</label>
          <input v-model="filters.start_date" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">操作类型</label>
          <select v-model="filters.action" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">全部</option>
            <option value="POST">新增</option>
            <option value="PUT">修改</option>
            <option value="DELETE">删除</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="fetchList" class="w-full bg-primary hover:bg-primary/90 text-white py-2 rounded-lg text-sm">查询</button>
        </div>
      </div>
    </div>

    <!-- 列表 -->
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white">
        <thead>
          <tr class="bg-gray-100 text-gray-700 text-sm">
            <th class="py-3 px-4 text-left">操作时间</th>
            <th class="py-3 px-4 text-left">操作类型</th>
            <th class="py-3 px-4 text-left">操作对象</th>
            <th class="py-3 px-4 text-left">操作内容</th>
            <th class="py-3 px-4 text-left">IP地址</th>
          </tr>
        </thead>
        <tbody class="text-gray-600 text-sm">
          <tr v-for="log in list" :key="log.id" class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">{{ formatDateTime(log.created_at) }}</td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded text-xs" :class="actionClass(log.action)">{{ log.action }}</span>
            </td>
            <td class="py-3 px-4">{{ log.target }}</td>
            <td class="py-3 px-4">{{ log.detail }}</td>
            <td class="py-3 px-4">{{ log.ip }}</td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="5" class="py-8 text-center text-gray-400">暂无日志</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="flex justify-center mt-6 space-x-2">
      <button
        v-for="p in totalPages"
        :key="p"
        @click="page = p"
        class="px-3 py-1 rounded text-sm"
        :class="page === p ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'"
      >{{ p }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { getLogList } from '@/api/log'
import { formatDateTime } from '@/utils/weekCalc'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

const filters = reactive({
  start_date: '',
  action: ''
})

const totalPages = computed(() => Math.ceil(total.value / pageSize))

function actionClass(action) {
  const map = {
    POST: 'bg-success/10 text-success',
    PUT: 'bg-primary/10 text-primary',
    DELETE: 'bg-danger/10 text-danger'
  }
  return map[action] || 'bg-gray-100 text-gray-600'
}

function handleExport() {
  alert('日志导出功能将在后续版本实现')
}

async function fetchList() {
  try {
    const params = { page: page.value, page_size: pageSize }
    if (filters.start_date) params.start_date = filters.start_date
    if (filters.action) params.action = filters.action
    const res = await getLogList(params)
    if (res.code === 0) {
      list.value = res.data.list
      total.value = res.data.total
    }
  } catch {}
}

watch(page, () => fetchList())
onMounted(() => fetchList())
</script>
