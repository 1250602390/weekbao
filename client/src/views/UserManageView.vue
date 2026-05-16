<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold">用户管理</h2>
      <button @click="openCreateDialog" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded text-sm">
        <i class="fa fa-plus mr-1"></i>新增用户
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full bg-white">
        <thead>
          <tr class="bg-gray-100 text-gray-700 text-sm">
            <th class="py-3 px-4 text-left">用户名</th>
            <th class="py-3 px-4 text-left">姓名</th>
            <th class="py-3 px-4 text-left">角色</th>
            <th class="py-3 px-4 text-left">状态</th>
            <th class="py-3 px-4 text-left">最后登录</th>
            <th class="py-3 px-4 text-center">操作</th>
          </tr>
        </thead>
        <tbody class="text-gray-600 text-sm">
          <tr v-for="user in list" :key="user.id" class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">{{ user.username }}</td>
            <td class="py-3 px-4">{{ user.display_name }}</td>
            <td class="py-3 px-4">{{ roleLabel(user.role) }}</td>
            <td class="py-3 px-4">
              <span class="px-2 py-1 rounded text-xs" :class="user.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'">
                {{ user.status === 'active' ? '正常' : '已禁用' }}
              </span>
            </td>
            <td class="py-3 px-4">{{ user.last_login ? formatDateTime(user.last_login) : '-' }}</td>
            <td class="py-3 px-4 text-center">
              <button @click="openEditDialog(user)" class="text-primary mr-2 hover:underline"><i class="fa fa-edit"></i> 编辑</button>
              <button v-if="user.username !== 'admin'" @click="handleDelete(user)" class="text-danger hover:underline"><i class="fa fa-trash"></i> 删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 弹窗 -->
    <div v-if="showDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">{{ isEdit ? '编辑用户' : '新增用户' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input v-model="form.username" :disabled="isEdit" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ isEdit ? '新密码（留空不修改）' : '密码' }}</label>
            <input v-model="form.password" type="password" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" :required="!isEdit" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input v-model="form.display_name" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select v-model="form.role" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="admin">系统管理员</option>
              <option value="manager">生产管理者</option>
              <option value="viewer">查阅决策者</option>
            </select>
          </div>
          <div v-if="isEdit">
            <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select v-model="form.status" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="active">正常</option>
              <option value="disabled">禁用</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showDialog = false" class="bg-gray-200 px-4 py-2 rounded text-sm">取消</button>
          <button @click="handleSave" class="bg-primary text-white px-4 py-2 rounded text-sm">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUserList, createUser, updateUser, deleteUser } from '@/api/user'
import { formatDateTime } from '@/utils/weekCalc'

const list = ref([])
const showDialog = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const form = reactive({
  username: '',
  password: '',
  display_name: '',
  role: 'viewer',
  status: 'active'
})

function roleLabel(role) {
  const map = { admin: '系统管理员', manager: '生产管理者', viewer: '查阅决策者' }
  return map[role] || role
}

function openCreateDialog() {
  isEdit.value = false
  editingId.value = null
  Object.assign(form, { username: '', password: '', display_name: '', role: 'viewer', status: 'active' })
  showDialog.value = true
}

function openEditDialog(user) {
  isEdit.value = true
  editingId.value = user.id
  Object.assign(form, { username: user.username, password: '', display_name: user.display_name, role: user.role, status: user.status })
  showDialog.value = true
}

async function handleSave() {
  try {
    const data = { display_name: form.display_name, role: form.role }
    if (isEdit.value) {
      if (form.password) data.password = form.password
      data.status = form.status
      await updateUser(editingId.value, data)
    } else {
      data.username = form.username
      data.password = form.password
      await createUser(data)
    }
    showDialog.value = false
    await fetchList()
  } catch (err) {
    alert('保存失败：' + (err.msg || '未知错误'))
  }
}

async function handleDelete(user) {
  if (!confirm(`确认删除用户 ${user.display_name}？`)) return
  try {
    await deleteUser(user.id)
    await fetchList()
  } catch (err) {
    alert('删除失败：' + (err.msg || '未知错误'))
  }
}

async function fetchList() {
  try {
    const res = await getUserList({ page: 1, page_size: 100 })
    if (res.code === 0) list.value = res.data.list
  } catch {}
}

onMounted(() => fetchList())
</script>
