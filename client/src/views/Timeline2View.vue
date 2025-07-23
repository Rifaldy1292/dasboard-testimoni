<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import useWebsocket from '@/composables/useWebsocket'
import type { PayloadWebsocket, ShiftValue } from '@/types/websocket.type'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DateTimeShiftSelector from '@/components/common/DateTimeShiftSelector.vue'
import DataNotFound from '@/components/common/DataNotFound.vue'
import Dropdown from 'primevue/dropdown'
import DownloadTimeline from '@/components/modules/timeline/DownloadTimeline.vue'
import FullCalendarTimeline from '@/components/modules/timeline2/FullCalendarTimeline.vue'


interface SlotLabelOption {
  label: string
  value: number
}


const showDetailsInTitle = shallowRef<boolean>(false)
const slotLabelInterval = shallowRef<number>(1_800_000) // Default 30mnt

const slotLabelOptions: SlotLabelOption[] = [
  { label: '5 menit', value: 300_000 },
  { label: '10 menit', value: 600_000 },
  { label: '15 menit', value: 900_000 },
  { label: '30 menit', value: 1_800_000 },
  { label: '1 jam', value: 3_600_000 },
  { label: '2 jam', value: 7_200_000 }
]

const dateTimeModel = ref<{
  date: Date
  shift: ShiftValue
}>({
  date: new Date(),
  shift: 0 as ShiftValue
})

const payloadWs = computed<PayloadWebsocket>(() => {
  return {
    type: 'timeline',
    data: {
      date: dateTimeModel.value.date.toISOString(),
      shift: dateTimeModel.value.shift
    }
  }
})

// Menggunakan composable useWebsocket untuk mendapatkan data
const { loadingWebsocket, timelineMachines, sendMessage } = useWebsocket(payloadWs.value)

const calendarKey = shallowRef<number>(0)

const isNowDate = computed(() => {
  const dateFrom = timelineMachines.value?.dateFrom
    ? new Date(timelineMachines.value.dateFrom)
    : new Date()
  const dateTo = timelineMachines.value?.dateTo
    ? new Date(timelineMachines.value.dateTo)
    : new Date()
  return (
    dateFrom.toLocaleDateString() === new Date().toLocaleDateString() ||
    dateTo.toLocaleDateString() === new Date().toLocaleDateString()
  )
})

// Watch perubahan pada payload untuk mengirim ulang request
watch(
  () => payloadWs.value,
  (newPayload) => {
    sendMessage(newPayload)
  }
)

// Watch perubahan pada toggle untuk memperbarui tampilan
watch([() => showDetailsInTitle.value, () => timelineMachines.value, () => slotLabelInterval.value], () => {
  calendarKey.value += 1 // Ubah key untuk memicu re-render
})
</script>
<template>
  <DefaultLayout>
    <BreadcrumbDefault pageTitle="Timeline2" />
    <LoadingAnimation :state="loadingWebsocket" />
    <DataNotFound :condition="!timelineMachines?.data?.length" />
    <div class="p-4">
      <div class="flex justify-between mb-4">
        <div class="flex items-center">
          <!-- <div class="flex items-center mr-4">
              <label for="toggleDetails" class="mr-2">Show Details:</label>
              <ToggleSwitch id="toggleDetails" v-model="showDetailsInTitle" />
            </div> -->
          <div class="flex flex-col">
            <label for="slotInterval" class="text:black dark:text-white">Gap:</label>
            <Dropdown
              v-model="slotLabelInterval"
              :options="slotLabelOptions"
              optionLabel="label"
              optionValue="value"
              class="border border-gray-300 rounded px-2 py-1"
            />
          </div>
        </div>
        <DateTimeShiftSelector v-model="dateTimeModel">
          <template #right>
            <DownloadTimeline :date="dateTimeModel.date" />
          </template>
        </DateTimeShiftSelector>
      </div>
      <FullCalendarTimeline
        v-if="timelineMachines?.data?.length"
        v-model="timelineMachines"
        :show-details-in-title="showDetailsInTitle"
        :slot-label-interval="slotLabelInterval"
        :calendar-key="calendarKey"
        :is-now-date="isNowDate"
      />
    </div>
  </DefaultLayout>
</template>

