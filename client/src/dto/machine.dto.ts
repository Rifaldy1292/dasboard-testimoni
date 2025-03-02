import type { FileWithContent } from '@/types/ftp.type'
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
  user_id: number
  files: FileWithContent[]
}
