<script setup lang="ts">
import { DatePicker } from 'primevue'

const dateOption = defineModel<Date>('dateOption', {
  required: true
})
</script>

<template>
  <DatePicker
    v-model="dateOption"
    inputId="over_label"
    showIcon
    iconDisplay="input"
    date-format="dd/mm/yy"
  />
</template>
