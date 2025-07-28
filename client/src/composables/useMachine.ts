import type { ParamsGetCuttingTime } from '@/dto/machine.dto'
import MachineServices from '@/services/machine.service'
import type { MachineOption } from '@/types/machine.type'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/composables/useToast'
import { ref, shallowRef } from 'vue'
import type { CuttingTimeMachine } from '@/types/cuttingTime.type'

type ProcessType = 'NC' | 'Drill'

interface AdditionalOptions {
  workPositionOptions: Array<number>
  coordinateOptions: Array<number>
  coolantOptions: Array<number>
  processTypeOptions: Array<ProcessType>
  zoolerOptions: Array<{ label: string; value: boolean }>
}

const additionalOptions: AdditionalOptions = {
  // 1000, 1111, 2000, 2222
  // 54-59
  workPositionOptions: Array.from({ length: 6 }, (_, i) => i + 54),
  coordinateOptions: [43, 143],
  coolantOptions: [8, 36, 50],
  processTypeOptions: ['NC', 'Drill'],
  zoolerOptions: [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
  ]
}

const { coordinateOptions, coolantOptions, processTypeOptions, zoolerOptions } = additionalOptions

const loadingFetch = shallowRef<boolean>(false)
const cuttingTimeMachines = ref<CuttingTimeMachine | undefined>(undefined)
const colorThresholds = ref({
  green: 10,
  yellow: 8,
  red: 8
})
const selectedMachines = ref<MachineOption[]>([])
const selectedOneMachine = ref<MachineOption | undefined>(undefined)
const loadingDropdown = shallowRef<boolean>(false)
const machineOptions = ref<MachineOption[]>([])
const selectedZooler = ref<boolean>(false)

const defaultMainProgram = 30

const selectedProgramNumber = shallowRef<number>(defaultMainProgram)
const selectedCoordinate = shallowRef<number>(coordinateOptions[0])
const inputStartPoint = shallowRef<number>(52)
const selectedCoolant = shallowRef<number>(coolantOptions[2])
const selectedProcessType = shallowRef<'NC' | 'Drill'>(processTypeOptions[0])

export const useMachine = () => {
  const toast = useToast()

  const getCuttingTime = async (params: ParamsGetCuttingTime) => {
    loadingFetch.value = true
    try {
      const { data } = await MachineServices.getCuttingTime(params)
      console.log(data.data)
      cuttingTimeMachines.value = data.data
      
      // Update color thresholds from backend
      if (data.data.target_shift) {
        colorThresholds.value = {
          green: data.data.target_shift.green,
          yellow: data.data.target_shift.yellow,
          red: data.data.target_shift.red
        }
      }
    } catch (error) {
      handleErrorAPI(error, toast)
    } finally {
      loadingFetch.value = false
    }
  }

  const getMachineOptions = async () => {
    loadingDropdown.value = true
    try {
      const { data } = await MachineServices.getMachineOptions({
        is_zooler: selectedZooler.value
      })
      // console.log(data.data)
      machineOptions.value = data.data
    } catch (error) {
      handleErrorAPI(error, toast)
    } finally {
      loadingDropdown.value = false
    }
  }

  return {
    loadingFetch,
    cuttingTimeMachines,
    colorThresholds,
    getCuttingTime,
    loadingDropdown,
    getMachineOptions,
    machineOptions,
    selectedMachines,
    selectedOneMachine,
    additionalOptions,
    selectedCoolant,
    selectedCoordinate,
    selectedProgramNumber,
    inputStartPoint,
    selectedProcessType,
    selectedZooler,
    zoolerOptions
  }
}
