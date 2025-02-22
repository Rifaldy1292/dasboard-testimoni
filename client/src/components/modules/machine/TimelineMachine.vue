<script setup lang="ts">
import Timeline from 'primevue/timeline'
import type { Machine, MachineTimeline, ObjMachineTimeline } from '@/types/machine.type'

const { machine } = defineProps<{
  machine: MachineTimeline
}>()

const iconTimeline = (status: Machine['status']): { icon: string; color: string } => {
  if (status === 'Running') {
    return { icon: 'pi pi-check', color: '#25c205' }
  }
  return { icon: 'pi pi-minus-circle', color: '#de2902' }
}
</script>

<template>
  <div class="card">
    <span class="flex justify-center text-3xl font-bold tetx-black dark:text-white">
      {{ machine.name }} &nbsp;
      <span :style="{ color: iconTimeline(machine.status).color }"> {{ machine.status }}</span>
    </span>

    <Timeline :value="machine.MachineLogs" layout="horizontal" align="top">
      <template #marker="{ item }">
        <span
          class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow-sm"
          :style="{ backgroundColor: iconTimeline(item.current_status).color }"
        >
          <i :class="iconTimeline(item.current_status).icon"></i>
        </span>
      </template>
      <!-- <template #opposite="slotProps">
        <div :style="{ backgroundColor: iconTimeline(slotProps.item.current_status).color }">
          <span class="font-bold text-black dark:text-white">{{ slotProps.item.timestamp }}</span>
          <br />

          <span class="font-medium text-black dark:text-white"> 1h 20min 5s </span>
          <br />

          <span>dandeling</span>
          &nbsp;

          <span>operator: Basri</span>
        </div>
      </template> -->

      <template #content="{ item }: { item: ObjMachineTimeline }">
        <div :style="{ backgroundColor: iconTimeline(item.current_status).color }" class="p-1">
          <span class="font-bold text-black dark:text-white">{{ item.timestamp }} dandeling </span>

          <br />

          <span class="font-medium text-black dark:text-white">{{ item.timeDifference }} </span>
          <br />
          <span class="font-medium text-black dark:text-white">Operator: Basri </span>
        </div>
      </template>

      <template #connector="slotProps">
        <div
          class="p-timeline-event-connector"
          :style="{ backgroundColor: iconTimeline(slotProps.item.current_status).color }"
        ></div>
      </template>
    </Timeline>
  </div>
</template>
