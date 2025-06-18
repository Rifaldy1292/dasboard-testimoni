<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import useWebsocket from '@/composables/useWebsocket'
import DataNotFound from '@/components/common/DataNotFound.vue'
import TimelineMachine from '@/components/modules/timeline/TimelineMachine.vue'
import DateTimeShiftSelector from '@/components/common/DateTimeShiftSelector.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import { Button } from 'primevue'
import { type PayloadWebsocket, type ShiftValue } from '@/types/websocket.type'
import MachineServices from '@/services/machine.service'
import { exportTimelineToExcel } from '@/utils/excelExport'

const dateTimeModel = ref({
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
const { loadingWebsocket, timelineMachines, sendMessage } = useWebsocket(payloadWs.value)

const resizeCount = shallowRef<number>(2)
const loadingDownload = shallowRef<boolean>(false)
const updateResizeCount = (type: 'increase' | 'decrease') => {
  if (type === 'increase' && resizeCount.value < 10) {
    resizeCount.value++
  } else if (type === 'decrease' && resizeCount.value > 1) {
    resizeCount.value--
  }
}

const downloadTimeline = async () => {
  try {
    loadingDownload.value = true

    const response = await MachineServices.downloadMachineLogsMonthly({
      date: dateTimeModel.value.date.toISOString()
    })

    const monthlyLogs = response.data.data

    // Generate filename based on selected date
    const selectedDate = new Date(dateTimeModel.value.date)
    const monthName = selectedDate.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric'
    })
    const filename = `timeline-${monthName.replace(' ', '-').toLowerCase()}`

    // Export to Excel using existing MonthlyLogs type
    exportTimelineToExcel(monthlyLogs, filename)
  } catch (error) {
    console.error('Error downloading timeline:', error)
  } finally {
    loadingDownload.value = false
  }
}
watch(
  () => payloadWs.value,
  (newPayoad) => {
    sendMessage(newPayoad)
  }
)
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Timeline" />
    <LoadingAnimation :state="loadingWebsocket" />
    <template v-if="!loadingWebsocket">
      <div class="flex justify-between mb-2">
        <DateTimeShiftSelector v-model="dateTimeModel" />

        <!-- show dateFrom - dateTo -->
        <span v-if="timelineMachines" class="text-gray-500">
          {{ new Date(timelineMachines.dateFrom).toLocaleString() }} -
          {{ new Date(timelineMachines.dateTo).toLocaleString() }}
        </span>
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

          <Button
            @click="downloadTimeline"
            :loading="loadingDownload"
            class="p-button-rounded"
            icon="pi pi-download"
            :label="`Download Timeline ${new Date(dateTimeModel.date).toLocaleString('default', { month: 'long' })}`"
          />
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <DataNotFound :condition="!timelineMachines?.data?.length" />
        <template v-if="timelineMachines?.data?.length">
          <template v-for="machine in timelineMachines.data" :key="machine.name">
            <TimelineMachine :machine="machine" :resize-count />
          </template>
        </template>
      </div>
    </template>
  </DefaultLayout>
</template>
