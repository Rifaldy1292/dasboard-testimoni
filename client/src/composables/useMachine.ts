import type { ParamsGetCuttingTime } from '@/dto/machine.dto'
import MachineServices from '@/services/machine.service'
import type { CuttingTimeMachine, MachineOption } from '@/types/machine.type'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/utils/useToast'
import { ref, shallowRef } from 'vue'

const loadingFetch = shallowRef<boolean>(false)
const cuttingTimeMachines = ref<CuttingTimeMachine | undefined>(undefined)
const selectedMachine = ref<MachineOption[]>([])
const loadingDropdown = shallowRef<boolean>(false)
const machineOptions = ref<MachineOption[]>([])

export const useMachine = () => {
  const toast = useToast()

  const getCuttingTime = async (params: ParamsGetCuttingTime) => {
    loadingFetch.value = true
    try {
      // console.log({ params }, 'from getCuttingTime fn')
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
