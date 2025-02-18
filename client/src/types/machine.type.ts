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

export interface CuttingTimeMachine {
  allDayInMonth: number[]
  cuttingTime: {
    period: Date
    target: number
  }
  cuttingTimeInMonth: {
    name: string
    data: number[]
  }[]
}

export type MachineOption = {
  id: number
  name: string
}
