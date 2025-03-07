export type FileWithContent = File & {
  content: string
  toolNumber: number
  kNum: string
  gCodeName: string
  outputWP: string
  toolName: string
  totalCuttingTime: string
}
