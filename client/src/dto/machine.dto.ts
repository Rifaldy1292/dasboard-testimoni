import type { MachineOption } from '@/types/machine.type'

export interface ParamsGetCuttingTime {
  period?: Date
  machineIds?: MachineOption[]
}

export interface EditLogDescription {
  id: number
  description: string
}

export interface TransferFiles {
  machine_id: number
  files: File[]
}
