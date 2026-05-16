<template>
  <div class="bg-white rounded-lg shadow p-6">
    <h3 class="font-semibold text-gray-800 mb-4">{{ title }}</h3>
    <EChartsWrap :option="chartOption" :height="height" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import EChartsWrap from './EChartsWrap.vue'

const props = defineProps({
  title: { type: String, default: '数据对比' },
  currentData: { type: Object, default: () => ({}) },
  lastData: { type: Object, default: () => ({}) },
  fieldLabels: { type: Object, default: () => ({}) },
  height: { type: String, default: '350px' }
})

const chartOption = computed(() => {
  const labels = []
  const curValues = []
  const prevValues = []

  Object.keys(props.currentData).forEach(key => {
    if (typeof props.currentData[key] === 'number') {
      labels.push(props.fieldLabels[key] || key)
      curValues.push(props.currentData[key])
      prevValues.push(typeof props.lastData[key] === 'number' ? props.lastData[key] : 0)
    }
  })

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['本周', '上周'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: labels, axisLabel: { rotate: labels.length > 4 ? 30 : 0, fontSize: 11 } },
    yAxis: { type: 'value' },
    series: [
      {
        name: '本周',
        type: 'bar',
        data: curValues,
        itemStyle: { color: '#2563eb' },
        barMaxWidth: 30
      },
      {
        name: '上周',
        type: 'bar',
        data: prevValues,
        itemStyle: { color: '#93c5fd' },
        barMaxWidth: 30
      }
    ]
  }
})
</script>
