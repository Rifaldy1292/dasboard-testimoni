<script setup lang="ts">
import Timeline from 'primevue/timeline'
import type { Machine, MachineTimeline, ObjMachineTimeline } from '@/types/machine.type'
import ModalEditDescription from './ModalEditDescription.vue'
import { shallowRef } from 'vue'
import ModalDocumentation from './ModalDocumentation.vue'

const { machine, resizeCount } = defineProps<{
  machine: MachineTimeline
  resizeCount: number
}>()

const visibleDialogForm = shallowRef<boolean>(false)
const visibleDialogFormDocumentation = shallowRef<boolean>(false)
const isHover = shallowRef<boolean>(true)
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
    return { icon: 'pi pi-minus-circle', color: '#6C0B0C' }
  }
  if (isNext) {
    return { color: '#adaaa0', icon: 'pi pi-spin pi-cog' }
  }
  if (status === 'Running') {
    return { icon: 'pi pi-check', color: '#25c205' }
  }
  // status disconnect white
  if (status === 'DISCONNECT') {
    return { icon: 'pi pi-times', color: '#ffff' }
  }
  return { icon: 'pi pi-minus-circle', color: '#de2902' }
}

// 20 * 5 = 100
const customWidthBoxTimeline = (obj: ObjMachineTimeline): string => {
  const milisecond = obj.timeDifferenceMs
  const minute = Math.round(milisecond / (1000 * 60))
  const width = minute * 10
  const DEFAULT_WIDTH = 50
  if (minute <= 5) return isHover.value ? `${DEFAULT_WIDTH / resizeCount}px` : `${DEFAULT_WIDTH}px`

  return isHover.value ? `${width / resizeCount}px` : `${width}px`
  // return `${width}px`
  // if (minute <= 20) {
  //   return DEFAULT_WIDTH
  // }
  // if (minute > 20) {
  //   return `${width}px`
  // }
  // return DEFAULT_WIDTH

  // return DEFAULT_WIDTH
}
</script>

<template>
  <div class="border border-gray-950 dark:border-gray-500">
    <span
      :style="{ color: iconTimeline(machine.status).color }"
      class="flex justify-center text-lg font-bold text-black dark:text-white gap-2"
    >
      <span>{{ machine.name }}</span>
      <span class="cursor-pointer">
        <i
          @click="visibleDialogFormDocumentation = true"
          v-tooltip.top="'Documentation'"
          class="pi pi-info-circle cursor-pointer"
          style="font-size: 1rem"
      /></span>
    </span>

    <div :class="`overflow-x-auto ${isHover ? 'h-25' : ''}`">
      <Timeline
        :value="machine.MachineLogs"
        layout="horizontal"
        align="top"
        class="[&_.p-timeline-event-opposite]:hidden"
      >
        <template #marker="{ item }: { item: ObjMachineTimeline }">
          <span
            class="flex w-4.5 h-4.5 items-center justify-center text-white rounded-full z-10 shadow-sm"
            :style="{
              backgroundColor: iconTimeline(item.current_status, item.isNext).color
            }"
          >
            <i :class="iconTimeline(item.current_status, item.isNext).icon"></i>
          </span>
        </template>

        <template #content="{ item }: { item: ObjMachineTimeline; index: number }">
          <!-- <h1>{{ customWidthBoxTimeline(item) }}</h1> -->
          <div
            @click="isHover = !isHover"
            :style="{
              backgroundColor: iconTimeline(item.current_status, item.isNext, item.description)
                .color,
              width: customWidthBoxTimeline(item)
            }"
            :class="`text-md ${isHover ? 'h-20' : 'h-70'} text-start flex flex-col  break-words`"
          >
            <i :class="`${isHover ? 'text-xs' : ''} font-bold text-black dark:text-white`"
              >{{
                new Date(item.createdAt).toLocaleTimeString('id-ID', {
                  hour: 'numeric',
                  minute: '2-digit'
                })
              }}
              -
              <span class="font-medium text-white dark:text-black">{{ item.timeDifference }} </span>
            </i>
            <i
              v-if="item.current_status === 'Stopped'"
              @click="handleClickIcon(item)"
              v-tooltip.top="'Edit'"
              class="pi pi-pencil cursor-pointer"
              style="font-size: 1rem"
            />
            <template v-if="!isHover">
              <span class="font-medium text-white dark:text-black">{{ item.description }} </span>
              <span class="font-medium text-yellow-300">{{ item.k_num }} </span>

              <span class="font-medium text-indigo-700"
                >{{ item.g_code_name }} - {{ item.output_wp }}</span
              >
              <span class="font-medium text-black dark:text-white"
                >{{ item.operator ?? '-' }}
              </span>
            </template>
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

<style scoped>
.p-timeline-event-opposite {
  display: none !important;
}

/* m-0 for timeline */
.p-timeline-event-opposite {
  margin: 0 !important;
  padding: 0 !important;
}
</style>
