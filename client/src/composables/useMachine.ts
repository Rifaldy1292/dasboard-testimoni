import MachineServices from '@/services/machine.service'
import type { CuttingTimeMachine, MachineOption } from '@/types/machine.type'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/utils/useToast'
import { ref, shallowRef } from 'vue'

export const useMachine = () => {
  const toast = useToast()

  const loadingFetch = shallowRef<boolean>(false)
  const cuttingTimeMachines = ref<CuttingTimeMachine | undefined>(undefined)

  const loadingDropdown = shallowRef<boolean>(false)
  const machineOptions = ref<MachineOption[]>([])

  const getCuttingTime = async (period: Date) => {
    loadingFetch.value = true
    try {
      const { data } = await MachineServices.getCuttingTime({ period })
      cuttingTimeMachines.value = data?.data
      // console.log(data.data)
    } catch (error) {
      handleErrorAPI(error, toast)
    } finally {
      loadingFetch.value = false
    }
  }

  const getMachineOptions = async () => {
    loadingDropdown.value = true
    try {
      const { data } = await MachineServices.getMachineOptions()
      console.log(data.data)
      machineOptions.value = data.data
    } catch (error) {
      handleErrorAPI(error, toast)
    } finally {
      loadingDropdown.value = false
    }
  }

  return {
    loadingFetch,
    getCuttingTime,
    cuttingTimeMachines,
    loadingDropdown,
    getMachineOptions,
    machineOptions
  }
}
