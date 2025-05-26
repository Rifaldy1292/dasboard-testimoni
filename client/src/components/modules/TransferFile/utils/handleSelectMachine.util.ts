import { useFTP } from '@/composables/useFTP'
import useToast from '@/composables/useToast'
import MachineServices from '@/services/machine.service'
import { useTimelineStore } from '@/stores/timeline'
import type { MachineOption } from '@/types/machine.type'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import { AxiosError } from 'axios'
import type { useConfirm } from 'primevue'

const { loadingUpload, handleClearFile, selectedAction } = useFTP()

export const showConfirmTimeline = (
  machineValue: MachineOption,
  confirm: ReturnType<typeof useConfirm>,
  cbCancel?: () => void
) => {
  const { fetchTimelineByMachineId } = useTimelineStore()

  return confirm.require({
    header: 'Tidak dapat memilih mesin',
    message: `Ada deskripsi timeline di ${machineValue.name} yang belum diisi nih, isi dulu yuk`,
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      await fetchTimelineByMachineId(machineValue.id)
    },
    reject: () => {
      if (selectedAction.value === 'Upload File') return handleClearFile()
      return cbCancel?.()
    },
    acceptProps: {
      label: 'Edit',
      severity: 'success'
    },
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    }
  })
}

export const handleNullDescriptionTimeline = async (
  machineValue: MachineOption | undefined,
  confirm: ReturnType<typeof useConfirm>,
  toast: ReturnType<typeof useToast>,
  cbCancel?: () => void
) => {
  if (!machineValue) return
  try {
    loadingUpload.value = true
    await MachineServices.getIsReadyTransferFiles({ machine_id: machineValue.id })
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 422) {
      return showConfirmTimeline(machineValue, confirm, cbCancel)
    }
    handleErrorAPI(error, toast)
  } finally {
    loadingUpload.value = false
  }
}
