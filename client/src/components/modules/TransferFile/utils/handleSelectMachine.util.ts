import { useFTP } from '@/composables/useFTP'
import MachineServices from '@/services/machine.service'
import type { MachineOption } from '@/types/machine.type'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import { AxiosError } from 'axios'

export const handleNullDescriptionTimeline = async (
  machineValue: MachineOption | undefined,
  confirm: any,
  toast: any
) => {
  const { loadingUpload } = useFTP()
  if (!machineValue) return
  const { id, name } = machineValue
  try {
    loadingUpload.value = true
    await MachineServices.getIsReadyTransferFiles({ machine_id: id })
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 422) {
      return confirm.require({
        header: 'Tidak dapat memilih mesin',
        message: `Ada deskripsi timeline di ${name} yang belum diisi nih, isi dulu yuk`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          await MachineServices.getTimelineByMachineId(id)
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
    handleErrorAPI(error, toast)
  } finally {
    loadingUpload.value = false
  }
}
