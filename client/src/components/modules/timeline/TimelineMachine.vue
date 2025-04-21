<script setup lang="ts">
import Timeline from 'primevue/timeline'
import type { Machine, MachineTimeline, ObjMachineTimeline } from '@/types/machine.type'
import ModalEditDescription from './ModalEditDescription.vue'
import { shallowRef } from 'vue'
import ModalDocumentation from './ModalDocumentation.vue'

const { machine } = defineProps<{
  machine: MachineTimeline
}>()

const visibleDialogForm = shallowRef<boolean>(false)
const visibleDialogFormDocumentation = shallowRef<boolean>(false)
const selectedLog = shallowRef<ObjMachineTimeline | undefined>()
const handleClickIcon = (e: ObjMachineTimeline): void => {
  selectedLog.value = e
  visibleDialogForm.value = true
  console.log(selectedLog.value)
}

const iconTimeline = (
  status: Machine['status'],
  isNext?: boolean,
  description?: string | null
): { icon: string; color: string } => {
  if (description === null && status === 'Stopped') {
    return { icon: 'pi pi-minus-circle', color: '#DACA86' }
  }
  if (isNext) {
    return { color: '#adaaa0', icon: 'pi pi-spin pi-cog' }
  }
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

const handleTimeDifference = (obj: ObjMachineTimeline, index: number): string => {
  /**
   * @example obj.timeDifference: 1h 2m 3s
   * @example obj.timeDifference: 2m 3s
   * @example obj.timeDifference: 3s
   */
  // return index.toString()
  const isLastIndex = index === machine.MachineLogs.length - 1
  if (!isLastIndex) return obj.timeDifference
  const arr = obj.timeDifference.split(' ')
  // find h m s
  const indexH = arr.findIndex((item) => item.includes('h'))
  const indexM = arr.findIndex((item) => item.includes('m'))
  const indexS = arr.findIndex((item) => item.includes('s'))
  return obj.timeDifference
  // return 'next'
}
</script>

<template>
  <div class="card border border-gray-950 dark:border-gray-500">
    <span
      :style="{ color: iconTimeline(machine.status).color }"
      class="flex justify-center text-3xl font-bold tetx-black dark:text-white gap-2"
    >
      {{ machine.name }}
      <span class="cursor-pointer">
        <i
          @click="visibleDialogFormDocumentation = true"
          v-tooltip.top="'Documentation'"
          class="pi pi-info-circle cursor-pointer"
          style="font-size: 1rem"
      /></span>
    </span>

    <div class="overflow-x-auto">
      <Timeline :value="machine.MachineLogs" layout="horizontal" align="top">
        <template #marker="{ item }: { item: ObjMachineTimeline }">
          <span
            class="flex w-8 h-8 items-center justify-center text-white rounded-full z-10 shadow-sm"
            :style="{
              backgroundColor: iconTimeline(item.current_status, item.isNext).color
            }"
          >
            <i :class="iconTimeline(item.current_status, item.isNext).icon"></i>
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

        <template #content="{ item }: { item: ObjMachineTimeline; index: number }">
          <div
            :style="{
              backgroundColor: iconTimeline(item.current_status, item.isNext, item.description)
                .color,
              width: customWidthBoxTimeline(item)
            }"
            :class="`px-2 ml h-100 text-start flex flex-col`"
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
            <span class="font-medium text-white dark:text-black"
              >{{ item.isLastLog ? 'next' : item.timeDifference }}
            </span>

            <span class="font-medium text-yellow-300">{{ item.k_num }} </span>

            <span class="font-medium text-indigo-700"
              >{{ item.g_code_name }} - {{ item.output_wp }}</span
            >

            <span class="font-medium text-black dark:text-white">{{ item.operator ?? '-' }} </span>
            <!-- 
            <span>{{ convertStringDifferenceToMilisecond(item.timeDifference) }}</span>
            <span>test{{ customWidthBoxTimeline(item) }}</span> -->
          </div>
        </template>

        <template #connector="{ item }: { item: ObjMachineTimeline }">
          <div
            class="p-timeline-event-connector"
            :style="{ backgroundColor: iconTimeline(item.current_status, item.isNext).color }"
          ></div>
        </template>
      </Timeline>
    </div>

    <ModalEditDescription
      v-model:visible-dialog-form="visibleDialogForm"
      :selected-machine="selectedLog"
      :machine-name="machine.name"
    />

    <ModalDocumentation v-model:visible-dialog-form="visibleDialogFormDocumentation" />
  </div>
</template>
