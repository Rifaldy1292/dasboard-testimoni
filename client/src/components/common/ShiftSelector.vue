<script setup lang="ts">
import { Select } from 'primevue'
import { type ShiftValue } from '@/types/websocket.type'

type Shift = 'Combine' | 'Shift 1' | 'Shift2'
const selectedShift = defineModel<ShiftValue>('modelValue', {
  required: true
})

const shiftOptions: { name: Shift; value: ShiftValue }[] = [
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
</script>

<template>
  <div class="flex flex-col justify-center">
    <label class="text-sm font-medium text-black dark:text-white">Shift</label>
    <Select
      option-label="name"
      option-value="value"
      v-model="selectedShift"
      :default-value="selectedShift"
      :options="shiftOptions"
      placeholder="Select Shift"
      class="relative flex items-center"
    />
  </div>
</template>
