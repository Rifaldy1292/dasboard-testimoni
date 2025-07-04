export type ContentFile = {
  content: string
  transfer_file_id: number
  name: string
  toolNumber: number
  kNum: string | number
  gCodeName: string | number
  outputWP: string | number
  toolName: string | number
  totalCuttingTime: string | number
  workPosition: number
  calculateTotalCuttingTime?: number
  totalProgram?: number
}

export type ValueFromContent = {
  transfer_file_id: number
  kNum: string
  gCodeName: string
  outputWP: string
  toolName: string
  totalCuttingTime: string
  calculateTotalCuttingTime: string
  nextProjects: ValueFromContent[]
}
