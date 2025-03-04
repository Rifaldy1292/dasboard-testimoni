<script setup lang="ts">
import { DatePicker, FloatLabel } from 'primevue'

const dateOption = defineModel<Date>('dateOption', {
  required: true
})
</script>

<template>
  <FloatLabel>
    <DatePicker
      v-model="dateOption"
      inputId="over_label"
      showIcon
      iconDisplay="input"
      date-format="dd/mm/yy"
    />
    <label for="over_label">Select Date</label>
  </FloatLabel>
</template>
