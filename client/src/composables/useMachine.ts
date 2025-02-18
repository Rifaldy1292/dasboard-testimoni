import type { ParamsGetCuttingTime } from '@/dto/machine.dto'
import MachineServices from '@/services/machine.service'
import type { CuttingTimeMachine, Machine, MachineOption } from '@/types/machine.type'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/utils/useToast'
import { ref, shallowRef } from 'vue'

export const useMachine = () => {
  const toast = useToast()

  const loadingFetch = shallowRef<boolean>(false)
  const cuttingTimeMachines = ref<CuttingTimeMachine | undefined>(undefined)

  const loadingDropdown = shallowRef<boolean>(false)
  const machineOptions = ref<MachineOption[]>([])
  const selectedMachine = ref<MachineOption[]>([])

  const getCuttingTime = async (params: ParamsGetCuttingTime) => {
    // console.log({ params })
    loadingFetch.value = true
    try {
      const { data } = await MachineServices.getCuttingTime(params)
      console.log(data?.data)
      cuttingTimeMachines.value = data?.data
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
      // console.log(data.data)
      machineOptions.value = data.data
    } catch (error) {
      handleErrorAPI(error, toast)
    } finally {
      loadingDropdown.value = false
    }
  }

  const handleSelectMachine = () => {
    if (!selectedMachine.value.length) return
    try {
      console.log('first', selectedMachine.value)
    } catch (error) {
      handleErrorAPI(error, toast)
    }
  }

  return {
    loadingFetch,
    getCuttingTime,
    cuttingTimeMachines,
    loadingDropdown,
    getMachineOptions,
    machineOptions,
    selectedMachine,
    handleSelectMachine
  }
}
