<script setup lang="ts">
import { Select } from 'primevue'
import { type ShiftValue } from '@/types/websocket.type'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

type Options = 'Combine' | 'Shift 1' | 'Shift2' | 'Monthly'

const route = useRoute()

const selectedShift = defineModel<ShiftValue>('modelValue', {
  required: true
})

const shiftOptions: { name: Options; value: ShiftValue }[] = [
  {
    name: 'Combine',
    value: 0
  },
  {
    name: 'Shift 1',
    value: 1
  },
  {
    name: 'Shift2',
    value: 2
  }
]

const extendedOptions = computed(() => {
  if (route.path.includes('running-time')) {
    return [...shiftOptions, { name: 'Monthly', value: true }]
  }
  return shiftOptions
})
</script>

<template>
  <div class="flex flex-col justify-center">
    <label class="text-sm font-medium text-black dark:text-white">Shift</label>
    <Select
      option-label="name"
      option-value="value"
      v-model="selectedShift"
      :default-value="selectedShift"
      :options="extendedOptions"
      placeholder="Select Shift"
      class="relative flex items-center"
    />
  </div>
</template>
