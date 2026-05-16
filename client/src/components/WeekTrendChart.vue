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
  title: { type: String, default: '环比趋势' },
  weeks: { type: Array, default: () => [] },
  height: { type: String, default: '300px' }
})

const chartOption = computed(() => {
  const weekLabels = props.weeks.map(w => `第${w.week}周`)
  const seriesMap = {}
  const metrics = props.weeks.length > 0 ? Object.keys(props.weeks[0].metrics) : []

  props.weeks.forEach(w => {
    metrics.forEach(m => {
      if (!seriesMap[m]) seriesMap[m] = []
      seriesMap[m].push(w.metrics[m])
    })
  })

  const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return {
    tooltip: { trigger: 'axis' },
    legend: { data: metrics, bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: weekLabels, boundaryGap: false },
    yAxis: { type: 'value' },
    series: metrics.map((m, i) => ({
      name: m,
      type: 'line',
      data: seriesMap[m],
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2 },
      itemStyle: { color: colors[i % colors.length] }
    }))
  }
})
</script>
