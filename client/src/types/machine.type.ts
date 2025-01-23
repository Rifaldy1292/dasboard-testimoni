type RunningCount = number
type StoppedCount = number

export type Machine = {
  name: string
  percentage: [RunningCount, StoppedCount]
  runningTime: string
  status: 'Running' | 'Stopped'
  quantity: number
}
