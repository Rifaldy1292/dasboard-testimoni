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
const updateResizeCount = (type: 'increase' | 'decrease') => {
  if (type === 'increase' && resizeCount.value < 10) {
    resizeCount.value++
  } else if (type === 'decrease' && resizeCount.value > 1) {
    resizeCount.value--
  }
}

const isDownloadLoading = ref(false)

const downloadMachineLogsCSV = async () => {
  try {
    isDownloadLoading.value = true

    const response = await MachineServices.downloadMachineLogsMonthly({
      date: dateTimeModel.value.date.toISOString()
    })

    const { logs, period } = response.data.data

    // Convert to CSV format
    const csvHeaders = [
      'Machine ID',
      'Machine Name',
      'Machine Type',
      'Machine IP',
      'Log ID',
      'User ID',
      'G Code Name',
      'K Number',
      'Output WP',
      'Total Cutting Time',
      'Calculate Total Cutting Time',
      'Previous Status',
      'Current Status',
      'Description',
      'Log Created At',
      'Log Updated At',
      'User Name',
      'User NIK',
      'User Role ID'
    ].join(',')

    // const csvRows = logs.map((log) =>
    //   [
    //     log.machine_id,
    //     `"${log.machine_name}"`,
    //     `"${log.machine_type}"`,
    //     `"${log.machine_ip}"`,
    //     log.log_id,
    //     log.user_id || '',
    //     `"${log.g_code_name || ''}"`,
    //     log.k_num || '',
    //     log.output_wp || '',
    //     log.total_cutting_time || '',
    //     log.calculate_total_cutting_time || '',
    //     `"${log.previous_status || ''}"`,
    //     `"${log.current_status}"`,
    //     `"${log.description || ''}"`,
    //     `"${new Date(log.log_created_at).toLocaleString('id-ID')}"`,
    //     `"${new Date(log.log_updated_at).toLocaleString('id-ID')}"`,
    //     `"${log.user_name || ''}"`,
    //     `"${log.user_nik || ''}"`,
    //     log.user_role_id || ''
    //   ].join(',')
    // )

    // // const csvContent = [csvHeaders, ...csvRows].join('\n')

    // // // Create and download file
    // // // const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    // // // const link = document.createElement('a')
    // // // const url = URL.createObjectURL(blob)
    // // // link.setAttribute('href', url)
    // // // link.setAttribute('download', `machine-logs-${period.month.replace(' ', '-')}.csv`)
    // // // link.style.visibility = 'hidden'
    // // // document.body.appendChild(link)
    // // // link.click()
    // // // document.body.removeChild(link)
  } catch (error) {
    console.error('Error downloading machine logs:', error)
  } finally {
    isDownloadLoading.value = false
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
            class="p-button-rounded"
            icon="pi pi-download"
            :label="`Download Timeline ${new Date(dateTimeModel.date).toLocaleString('default', { month: 'long' })}`"
            :loading="isDownloadLoading"
            :disabled="isDownloadLoading"
            @click="downloadMachineLogsCSV"
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
