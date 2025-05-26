import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AllMachineTimeline, MachineTimeline } from '@/types/machine.type'
import { useFTP } from '@/composables/useFTP'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/composables/useToast'
import { useDialogStore } from './dialog'
import MachineServices from '@/services/machine.service'

export const useTimelineStore = defineStore('timeline', () => {
  const { loadingUpload } = useFTP()
  const { openTimelineDialog, closeTimelineDialog } = useDialogStore()
  const toast = useToast()
  // State
  const timelineNullDescription = ref<MachineTimeline | undefined>()

  // Actions
  const setTimelineData = (data: AllMachineTimeline | undefined) => {
    timelineNullDescription.value = data?.data[0]
  }

  const fetchTimelineByMachineId = async (machine_id: number) => {
    try {
      loadingUpload.value = true
      const { data } = await MachineServices.getTimelineByMachineId(machine_id)
      setTimelineData(data.data)
      data.data?.data.length ? openTimelineDialog() : closeTimelineDialog()
    } catch (error) {
      handleErrorAPI(error, toast)
    } finally {
      loadingUpload.value = false
    }
  }

  return {
    // State
    timelineNullDescription,

    fetchTimelineByMachineId,
    setTimelineData
  }
})
