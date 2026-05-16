<template>
  <div v-if="timeLeft" class="inline-flex items-center text-sm" :class="urgent ? 'text-danger font-bold' : 'text-gray-600'">
    <i class="fa fa-clock-o mr-1"></i>
    {{ timeLeft }}
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  deadline: { type: [String, Date], required: true }
})

const now = ref(new Date())
let timer = null

const urgent = computed(() => {
  const diff = new Date(props.deadline) - now.value
  return diff > 0 && diff < 3600000 // 小于1小时
})

const timeLeft = computed(() => {
  const diff = new Date(props.deadline) - now.value
  if (diff <= 0) return '已截止'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (h > 24) return `剩余 ${Math.floor(h / 24)}天${h % 24}小时`
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
