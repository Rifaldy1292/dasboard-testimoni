<script setup lang="ts">
import useToast from '@/composables/useToast'
import MachineServices from '@/services/machine.service'
import { exportTimelineToExcel } from '@/utils/excelExport'
import { Button } from 'primevue'
import { shallowRef } from 'vue'

const props = defineProps<{ date: Date }>()

const toast = useToast()
const loadingDownload = shallowRef<boolean>(false)

const downloadTimeline = async () => {
  try {
    loadingDownload.value = true

    const response = await MachineServices.downloadMachineLogsMonthly({
      date: props.date.toISOString()
    })

    const monthlyLogs = response.data.data

    // Generate filename based on selected date
    const selectedDate = new Date(props.date)
    const monthName = selectedDate.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric'
    })
    const filename = `timeline-${monthName.replace(' ', '-').toLowerCase()}`

    // Export to Excel using existing MonthlyLogs type
    exportTimelineToExcel(monthlyLogs, filename)
    toast.add({
      severity: 'success',
      summary: 'Download Successful',
      detail: `${filename}.xlsx downloaded successfully`,
      life: 3000
    }) // Show success toast
  } catch (error) {
    console.error('Error downloading timeline:', error)
    toast.add({
      severity: 'error',
      summary: 'Download Failed',
      detail: 'Failed to download timeline. Please try again later.',
      life: 3000
    }) // Show error toast
  } finally {
    loadingDownload.value = false
  }
}
</script>

<template>
  <Button
    @click="downloadTimeline"
    :loading="loadingDownload"
    class="p-button-rounded"
    icon="pi pi-download"
    :label="`Download Timeline ${new Date(date).toLocaleString('default', { month: 'long' })}`"
  />
</template>
