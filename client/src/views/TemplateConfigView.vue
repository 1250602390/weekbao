<template>
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold">模板配置</h2>
    </div>

    <!-- 模块Tab -->
    <div class="flex space-x-2 mb-6 overflow-x-auto pb-2">
      <button
        v-for="mod in modules"
        :key="mod.key"
        @click="activeModule = mod.key"
        class="px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors"
        :class="activeModule === mod.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
      >{{ mod.name }}</button>
    </div>

    <!-- 字段列表 -->
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white">
        <thead>
          <tr class="bg-gray-100 text-gray-700 text-sm">
            <th class="py-3 px-4 text-left">排序</th>
            <th class="py-3 px-4 text-left">字段标识</th>
            <th class="py-3 px-4 text-left">显示名称</th>
            <th class="py-3 px-4 text-left">类型</th>
            <th class="py-3 px-4 text-left">单位</th>
            <th class="py-3 px-4 text-center">必填</th>
            <th class="py-3 px-4 text-center">启用</th>
            <th class="py-3 px-4 text-center">操作</th>
          </tr>
        </thead>
        <tbody class="text-gray-600 text-sm">
          <tr v-for="field in currentFields" :key="field.id" class="border-b hover:bg-gray-50">
            <td class="py-3 px-4">{{ field.sort_order }}</td>
            <td class="py-3 px-4 font-mono text-xs">{{ field.field_key }}</td>
            <td class="py-3 px-4">
              <span v-if="editingId !== field.id">{{ field.field_label }}</span>
              <input v-else v-model="editForm.field_label" class="border rounded px-2 py-1 w-full text-sm" />
            </td>
            <td class="py-3 px-4">
              <span v-if="editingId !== field.id">{{ fieldTypeLabel(field.field_type) }}</span>
              <select v-else v-model="editForm.field_type" class="border rounded px-2 py-1 text-sm">
                <option value="number">数字</option>
                <option value="text">文本</option>
                <option value="textarea">长文本</option>
                <option value="select">下拉选择</option>
              </select>
            </td>
            <td class="py-3 px-4">
              <span v-if="editingId !== field.id">{{ field.unit || '-' }}</span>
              <input v-else v-model="editForm.unit" class="border rounded px-2 py-1 w-16 text-sm" />
            </td>
            <td class="py-3 px-4 text-center">
              <i v-if="field.required" class="fa fa-check text-success"></i>
              <i v-else class="fa fa-minus text-gray-300"></i>
            </td>
            <td class="py-3 px-4 text-center">
              <i v-if="field.is_active" class="fa fa-check-circle text-success"></i>
              <i v-else class="fa fa-times-circle text-gray-300"></i>
            </td>
            <td class="py-3 px-4 text-center">
              <button v-if="editingId !== field.id" @click="startEdit(field)" class="text-primary hover:underline">
                <i class="fa fa-edit"></i> 编辑
              </button>
              <template v-else>
                <button @click="saveEdit(field.id)" class="text-success hover:underline mr-2">
                  <i class="fa fa-check"></i> 保存
                </button>
                <button @click="cancelEdit" class="text-gray-500 hover:underline">取消</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTemplateList, updateTemplate } from '@/api/template'

const modules = [
  { key: 'road', name: '路网核实' },
  { key: 'poi', name: 'POI数据' },
  { key: 'cheat', name: '作弊审核' },
  { key: 'speed', name: '限速信息' },
  { key: 'camera', name: '电子眼' },
  { key: 'value', name: '核心价值概要' },
  { key: 'team', name: '团队总结' }
]

const activeModule = ref('road')
const allTemplates = ref([])
const editingId = ref(null)
const editForm = ref({})

const currentFields = computed(() => {
  return allTemplates.value
    .filter(t => t.module === activeModule.value)
    .sort((a, b) => a.sort_order - b.sort_order)
})

function fieldTypeLabel(type) {
  const map = { number: '数字', text: '文本', textarea: '长文本', select: '下拉选择' }
  return map[type] || type
}

function startEdit(field) {
  editingId.value = field.id
  editForm.value = {
    field_label: field.field_label,
    field_type: field.field_type,
    unit: field.unit || '',
    required: field.required,
    is_active: field.is_active
  }
}

function cancelEdit() {
  editingId.value = null
  editForm.value = {}
}

async function saveEdit(id) {
  try {
    await updateTemplate(id, editForm.value)
    editingId.value = null
    await fetchTemplates()
  } catch (err) {
    alert('保存失败：' + (err.msg || '未知错误'))
  }
}

async function fetchTemplates() {
  try {
    const res = await getTemplateList()
    if (res.code === 0) allTemplates.value = res.data
  } catch {}
}

onMounted(() => fetchTemplates())
</script>
