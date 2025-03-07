import type { ParamsGetCuttingTime } from '@/dto/machine.dto'
import MachineServices from '@/services/machine.service'
import type { CuttingTimeMachine, MachineOption } from '@/types/machine.type'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/utils/useToast'
import { ref, shallowRef } from 'vue'

type Key =
  | 'programNumberOptions'
  | 'workPositionOptions'
  | 'coordinateOptions'
  | 'coolantOptions'
  | 'startPointOptions'
const additionalOptions: Record<Key, Array<number>> = {
  programNumberOptions: [1000, 2000, 3000, 4000, 5000],
  workPositionOptions: [50, 52, 54, 56],
  coordinateOptions: [43, 143],
  coolantOptions: [8, 50],
  startPointOptions: Array.from({ length: 100 }, (_, i) => i + 1)
}

const {
  programNumberOptions,
  workPositionOptions,
  coordinateOptions,
  coolantOptions,
  startPointOptions
} = additionalOptions

const loadingFetch = shallowRef<boolean>(false)
const cuttingTimeMachines = ref<CuttingTimeMachine | undefined>(undefined)
const selectedMachine = ref<MachineOption[]>([])
const selectedOneMachine = ref<MachineOption | undefined>(undefined)
const loadingDropdown = shallowRef<boolean>(false)
const machineOptions = ref<MachineOption[]>([])

const selectedProgramNumber = shallowRef<number>(programNumberOptions[0])
const selectedWorkPosition = shallowRef<number>(workPositionOptions[2])
const selectedCoordinate = shallowRef<number>(coordinateOptions[0])
const selectedStartPoint = shallowRef<number>(startPointOptions[50])
const selectedCoolant = shallowRef<number>(coolantOptions[1])
const inputFileName = shallowRef<string>('O1234')

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
    handleSelectMachine,
    selectedOneMachine,
    additionalOptions,
    selectedCoolant,
    selectedCoordinate,
    selectedProgramNumber,
    selectedWorkPosition,
    inputFileName,
    selectedStartPoint
  }
}
