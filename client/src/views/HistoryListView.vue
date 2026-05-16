<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold">历史周报查询</h2>
      <button @click="handleBatchExport" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded text-sm">
        <i class="fa fa-download mr-1"></i>批量导出
      </button>
    </div>

    <!-- 筛选区 -->
    <div class="bg-gray-50 p-4 rounded-lg mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
          <input v-model="filters.start_date" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
          <input v-model="filters.end_date" type="date" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select v-model="filters.status" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">全部</option>
            <option value="draft">填报中</option>
            <option value="submitted">已提交</option>
            <option value="generated">已生成</option>
            <option value="published">已发布</option>
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
            <th class="py-3 px-4 text-left">周报周期</th>
            <th class="py-3 px-4 text-left">周数</th>
            <th class="py-3 px-4 text-left">填报人</th>
            <th class="py-3 px-4 text-left">发布时间</th>
            <th class="py-3 px-4 text-left">状态</th>
            <th class="py-3 px-4 text-center">操作</th>
          </tr>
        </thead>
        <tbody class="text-gray-600 text-sm">
          <tr v-for="item in list" :key="item.id" class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">{{ item.start_date }} ~ {{ item.end_date }}</td>
            <td class="py-3 px-4">第{{ item.week_number }}周</td>
            <td class="py-3 px-4">{{ item.filler?.display_name || '-' }}</td>
            <td class="py-3 px-4">{{ item.published_at ? formatDateTime(item.published_at) : '-' }}</td>
            <td class="py-3 px-4">
              <span class="px-2 py-1 rounded text-xs" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
            </td>
            <td class="py-3 px-4 text-center">
              <router-link :to="`/report/detail/${item.id}`" class="text-primary mr-2 hover:underline">
                <i class="fa fa-eye"></i> 查看
              </router-link>
              <button @click="exportOne(item)" class="text-gray-600 hover:underline">
                <i class="fa fa-download"></i> 导出
              </button>
            </td>
          </tr>
          <tr v-if="list.length === 0">
            <td colspan="6" class="py-8 text-center text-gray-400">暂无数据</td>
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
import { useRouter } from 'vue-router'
import { getReportList } from '@/api/report'
import { formatDateTime } from '@/utils/weekCalc'

const router = useRouter()

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10

const filters = reactive({
  start_date: '',
  end_date: '',
  status: ''
})

const totalPages = computed(() => Math.ceil(total.value / pageSize))

function statusLabel(status) {
  const map = { draft: '填报中', submitted: '已提交', generated: '已生成', published: '已发布' }
  return map[status] || status
}

function statusClass(status) {
  const map = {
    draft: 'bg-warning/10 text-warning',
    submitted: 'bg-primary/10 text-primary',
    generated: 'bg-success/10 text-success',
    published: 'bg-success/10 text-success'
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

async function fetchList() {
  try {
    const params = { page: page.value, page_size: pageSize }
    if (filters.start_date) params.start_date = filters.start_date
    if (filters.end_date) params.end_date = filters.end_date
    if (filters.status) params.status = filters.status
    const res = await getReportList(params)
    if (res.code === 0) {
      list.value = res.data.list
      total.value = res.data.total
    }
  } catch {}
}

function exportOne(item) {
  router.push(`/report/detail/${item.id}`)
}
function handleBatchExport() {
  alert('批量导出功能将在后续版本实现')
}

watch(page, () => fetchList())
onMounted(() => fetchList())
</script>
