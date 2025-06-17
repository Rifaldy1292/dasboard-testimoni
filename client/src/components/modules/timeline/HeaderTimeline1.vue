<script setup lang="ts">
import { Button } from 'primevue'

const { timelineMachines } = defineProps<{
  timelineMachines: {
    dateFrom: string
    dateTo: string
  } | null
}>()
</script>

<template>
  <div class="flex justify-between mb-2">
    <div class="flex items-center gap-2">
      <Button
        :disabled="resizeCount === 10"
        @click="updateResizeCount('increase')"
        :class="`p-button-rounded p-button-text ${resizeCount === 10 && 'opacity-50 cursor-not-allowed'}`"
        icon="pi pi-arrow-down"
      />
      <Button
        :disabled="resizeCount === 1"
        @click="updateResizeCount('decrease')"
        :class="`p-button-rounded p-button-text ${resizeCount === 1 && ' opacity-50 cursor-not-allowed'}`"
        icon="pi pi-arrow-up"
      />
    </div>
    <!-- show dateFrom - dateTo -->
    <span v-if="timelineMachines" class="text-gray-500">
      {{ new Date(timelineMachines.dateFrom).toLocaleString() }} -
      {{ new Date(timelineMachines.dateTo).toLocaleString() }}
    </span>
    <DateTimeShiftSelector v-model="dateTimeModel" />
  </div>
</template>
