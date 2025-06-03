<script setup lang="ts">
import { computed } from 'vue'

type ColorCount = {
  green: number
  yellow: number
  red: number
}
const colorCount = defineModel<ColorCount>({
  required: true
})
const colorInformation = computed<{ color: string; label: string }[]>(() => [
  {
    color: '#22c55e',
    label: `Target >= ${colorCount.value.green}`
  },
  {
    color: '#f59e0b',
    label: `Mendekati >= ${colorCount.value.yellow}`
  },
  {
    color: '#ef4444',
    label: `Tidak Target < ${colorCount.value.red}`
  }
])
</script>

<template>
  <div class="flex gap-15 border-y border-stroke px-6 py-7.5 dark:border-strokedark">
    <div v-for="item of colorInformation" :key="item.label" class="flex gap-2 cursor-pointer">
      <div class="w-10 h-10" :style="{ backgroundColor: item.color }" />
      <span>{{ item.label }}</span>
    </div>
  </div>
</template>
