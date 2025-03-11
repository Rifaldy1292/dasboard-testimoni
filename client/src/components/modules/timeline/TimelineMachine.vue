<script setup lang="ts">
import Timeline from 'primevue/timeline'
import type { Machine, MachineTimeline, ObjMachineTimeline } from '@/types/machine.type'
import ModalEditDescription from './ModalEditDescription.vue'
import { shallowRef } from 'vue'

const { machine } = defineProps<{
  machine: MachineTimeline
}>()

const visibleDialogForm = shallowRef<boolean>(false)
const selectedLog = shallowRef<ObjMachineTimeline | undefined>()
const handleClickIcon = (e: ObjMachineTimeline): void => {
  selectedLog.value = e
  visibleDialogForm.value = true
  console.log(selectedLog.value)
}

const iconTimeline = (status: Machine['status']): { icon: string; color: string } => {
  if (status === 'Running') {
    return { icon: 'pi pi-check', color: '#25c205' }
  }
  return { icon: 'pi pi-minus-circle', color: '#de2902' }
}

// str ex: '1h 2m 3s'
// expect : 3600000
const convertStringDifferenceToMilisecond = (str: string): number => {
  const arr = str.split(' ')
  let total = 0
  for (let i = 0; i < arr.length; i++) {
    const num = parseInt(arr[i].replace('h', '').replace('m', '').replace('s', ''))
    if (arr[i].includes('h')) {
      total += num * 3600000
    } else if (arr[i].includes('m')) {
      total += num * 60000
    } else if (arr[i].includes('s')) {
      total += num * 1000
    }
  }
  return total
}

const customWidthBoxTimeline = (obj: ObjMachineTimeline): string => {
  const milisecond = convertStringDifferenceToMilisecond(obj.timeDifference)
  const minute = Math.round(milisecond / (1000 * 60))
  const width = minute * 5
  const defaultWidth = '100px'
  if (minute <= 20) {
    return defaultWidth
  }
  if (minute > 20) {
    return `${width}px`
  }
  return defaultWidth
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
        <div
          :style="{
            backgroundColor: iconTimeline(item.current_status).color,
            width: customWidthBoxTimeline(item)
          }"
          :class="`p-1 h-100`"
        >
          <i class="font-bold text-black dark:text-white"
            >{{ item.createdAt }} - {{ item.description }}
          </i>
          <i
            v-if="item.current_status === 'Stopped'"
            @click="handleClickIcon(item)"
            v-tooltip.top="'Edit'"
            class="pi pi-pencil"
            style="font-size: 1rem"
          />
          <br />
          <span class="font-medium text-white dark:text-black">{{ item.timeDifference }} </span>
          <br />

          <span class="font-medium text-white dark:text-black"
            >{{ item.g_code_name }} - {{ item.output_wp }}</span
          >
          <br />

          <span class="font-medium text-white dark:text-black"
            >total cutting time: {{ item.total_cutting_time }}</span
          >

          <br />
          <span class="font-medium text-black dark:text-white"
            >Operator: {{ item.operator ?? '-' }}
          </span>
          <!-- 
          <span>{{ convertStringDifferenceToMilisecond(item.timeDifference) }}</span>
          <span>test{{ customWidthBoxTimeline(item) }}</span> -->
        </div>
      </template>

      <template #connector="slotProps">
        <div
          class="p-timeline-event-connector"
          :style="{ backgroundColor: iconTimeline(slotProps.item.current_status).color }"
        ></div>
      </template>
    </Timeline>

    <ModalEditDescription
      v-model:visible-dialog-form="visibleDialogForm"
      :selected-machine="selectedLog"
      :machine-name="machine.name"
    />
  </div>
</template>
