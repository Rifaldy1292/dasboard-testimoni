<script setup lang="ts">
import Timeline from 'primevue/timeline'
import type { Machine, MachineTimeline, ObjMachineTimeline } from '@/types/machine.type'
import ModalEditDescription from './ModalEditDescription.vue'
import { shallowRef, ref } from 'vue'
import ModalDocumentation from './ModalDocumentation.vue'
import { useToast } from 'primevue/usetoast'
import MachineServices from '@/services/machine.service'

const { machine, resizeCount } = defineProps<{
  machine: MachineTimeline
  resizeCount: number
}>()

const emit = defineEmits(['log-deleted'])

const toast = useToast()
const visibleDialogForm = shallowRef<boolean>(false)
const visibleDialogFormDocumentation = shallowRef<boolean>(false)
const isHover = shallowRef<boolean>(true)
const selectedLog = shallowRef<ObjMachineTimeline | undefined>()
const selectedLogIds = ref<number[]>([])

const handleClickIcon = (e: ObjMachineTimeline): void => {
  selectedLog.value = e
  visibleDialogForm.value = true
  console.log(selectedLog.value)
}

const toggleSelectionForDelete = (log: ObjMachineTimeline) => {
  if (!log.id) return
  const index = selectedLogIds.value.indexOf(log.id)
  if (index > -1) {
    selectedLogIds.value.splice(index, 1)
  } else {
    selectedLogIds.value.push(log.id)
  }
}

const handleBulkDelete = async () => {
  if (selectedLogIds.value.length === 0) return
  try {
    for (const id of selectedLogIds.value) {
      await MachineServices.deleteMachineLog(id)
    }
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${selectedLogIds.value.length} logs deleted successfully`,
      life: 3000
    })
    selectedLogIds.value = []
    emit('log-deleted')
  } catch (error) {
    console.error(error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete logs', life: 3000 })
  }
}

const isSelectedForDeletion = (log: ObjMachineTimeline): boolean => {
  return !!log.id && selectedLogIds.value.includes(log.id)
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
      class="flex justify-center text-lg font-bold text-black dark:text-white gap-2 items-center"
    >
      <span>{{ machine.name }}</span>
      <span class="cursor-pointer">
        <i
          @click="visibleDialogFormDocumentation = true"
          v-tooltip.top="'Documentation'"
          class="pi pi-info-circle cursor-pointer"
          style="font-size: 1rem"
      /></span>
      <button
        v-if="selectedLogIds.length > 0"
        @click="handleBulkDelete"
        class="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm font-bold"
      >
        Bulk Delete ({{ selectedLogIds.length }})
      </button>
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
            :class="`text-md ${isHover ? 'h-20' : 'h-70'} ${
              isSelectedForDeletion(item) ? 'ring-2 ring-red-500' : ''
            } text-start flex flex-col break-words`"
          >
            <i :class="`${isHover ? 'text-xs' : ''} font-bold text-white dark:text-black`"
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
              @click.stop="toggleSelectionForDelete(item)"
              v-tooltip.top="'Select for Deletion'"
              class="pi pi-trash cursor-pointer text-red-500"
              style="font-size: 1rem"
            />
            <div v-if="item.current_status === 'Stopped'" class="flex items-center gap-3 mt-2">
              <i
                @click="handleClickIcon(item)"
                v-tooltip.top="'Edit'"
                class="pi pi-pencil cursor-pointer"
                style="font-size: 1rem"
              />
            </div>
            <template v-if="!isHover">
              <span class="font-medium text-white dark:text-black">{{ item.description }} </span>
              <span class="font-medium text-yellow-300">{{ item.k_num }} </span>

              <span class="font-medium text-indigo-700"
                >{{ item.g_code_name }} - {{ item.output_wp }}</span
              >
              <span class="font-medium text-black dark:text-white"
                >{{ item.operator ?? '-' }}
              </span>
              <span class="font-medium text-black dark:text-white"
                >{{ item.remaining ?? '-' }}
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
