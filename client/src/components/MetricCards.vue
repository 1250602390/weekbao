<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div v-for="m in metrics" :key="m.label" class="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
      <div class="text-2xl font-bold" :class="m.color || 'text-primary'">{{ m.value }}</div>
      <div class="text-sm text-gray-600 mt-1">{{ m.label }}</div>
      <div v-if="m.rate !== undefined && m.rate !== '-' && m.rate !== '新增'" class="text-xs mt-1" :class="m.rate > 0 ? 'text-success' : 'text-danger'">
        <i :class="m.rate > 0 ? 'fa fa-arrow-up' : 'fa fa-arrow-down'"></i> {{ Math.abs(m.rate) }}%
        <span v-if="m.anomaly" class="text-warning ml-1">⚠️</span>
      </div>
      <div v-else-if="m.rate === '新增'" class="text-xs mt-1 text-primary">新增指标</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  metrics: { type: Array, default: () => [] }
})
</script>
