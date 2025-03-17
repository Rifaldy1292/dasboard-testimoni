export type ContentFile = {
  content: string
  name: string
  toolNumber: number
  kNum: string | number
  gCodeName: string | number
  outputWP: string | number
  toolName: string | number
  totalCuttingTime: string | number
  calculateTotalCuttingTime?: number
}

export type ValueFromContent = {
  kNum: string
  gCodeName: string
  outputWP: string
  toolName: string
  totalCuttingTime: string
}
