<script setup lang="ts">
import { DatePicker, FloatLabel } from 'primevue'

const monthValue = defineModel<Date>('monthValue', {
  required: true,
  default: new Date()
})
</script>

<template>
  <FloatLabel>
    <DatePicker
      v-model:model-value="monthValue"
      :default-value="monthValue"
      inputId="over_label"
      view="month"
      showIcon
      iconDisplay="input"
      date-format="mm/yy"
    />
    <label v-if="!monthValue" for="over_label">Select Month</label>
  </FloatLabel>
</template>
