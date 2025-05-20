<script setup lang="ts">
import DatePickerDay from '@/components/common/DatePickerDay.vue'
import ShiftSelector from '@/components/common/ShiftSelector.vue'
import type { ShiftValue } from '@/types/websocket.type'

interface ModelValue {
  shift: ShiftValue
  date: Date
}

const model = defineModel<ModelValue>('modelValue', {
  required: true
})
</script>

<template>
  <div class="flex justify-between gap-3">
    <ShiftSelector v-model:model-value="model.shift" />
    <div class="flex flex-col justify-center">
      <label class="text-sm font-medium text-black dark:text-white">Date</label>
      <DatePickerDay v-model:date-option="model.date" />
    </div>
  </div>
</template>
