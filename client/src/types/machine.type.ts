type RunningCount = number
type StoppedCount = number

export type Machine = {
  name: string
  percentage: [RunningCount, StoppedCount]
  description: string
  runningTime: string
  status: 'Running' | 'Stopped'
  quantity: number
}

export type MachineTimeline = {
  name: string
  status: Machine['status']
  MachineLogs: Array<{ current_status: Machine['status']; timestamp: string }>
}

export type cuttingTimeInMonth = {
  name: string
  data: number[]
  actual?: number[]
}

export interface CuttingTimeMachine {
  allDayInMonth: number[]
  cuttingTime: {
    period: Date
    target: number
  }
  cuttingTimeInMonth: cuttingTimeInMonth[]
}

export type MachineOption = {
  id: number
  name: string
}
