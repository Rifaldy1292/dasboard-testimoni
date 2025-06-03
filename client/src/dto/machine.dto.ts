export interface ParamsGetCuttingTime {
  period: Date
  machineIds?: Array<number>
}

export interface EditLogDescription {
  id: number
  description: string
}

export interface TransferFiles {
  machine_id: number
  files: File[]
}
