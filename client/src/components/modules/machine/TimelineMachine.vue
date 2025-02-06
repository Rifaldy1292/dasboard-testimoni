<script setup lang="ts">
import Timeline from 'primevue/timeline'
import type { Machine, MachineTimeline } from '@/types/machine.type'

const { machine } = defineProps<{
  machine: MachineTimeline
}>()
console.log({ length: machine.MachineLogs.length })

const iconTimeline = (status: Machine['status']): { icon: string; color: string } => {
  if (status === 'Running') {
    return { icon: 'pi pi-check', color: '#25c205' }
  }
  return { icon: 'pi pi-minus-circle', color: '#de2902' }
}
</script>

<template>
  <div class="card">
    <span class="text-xl font-semibold text-black dark:text-white"> {{ machine.name }}</span>
    <Timeline :value="machine.MachineLogs" layout="horizontal" align="bottom">
      <template #marker="{ item }">
        <span
          class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow-sm"
          :style="{ backgroundColor: iconTimeline(item.current_status).color }"
        >
          <i :class="iconTimeline(item.current_status).icon"></i>
        </span>
      </template>
      <template #opposite="slotProps">
        <small class="text-surface-500 dark:text-surface-400">{{ slotProps.item.timestamp }}</small>
      </template>
      <template #content="slotProps">
        <span :style="{ color: iconTimeline(slotProps.item.current_status).color }"
          >{{ slotProps.item.current_status }}
        </span>
      </template>
    </Timeline>
  </div>
</template>
