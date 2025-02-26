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

export type ObjMachineTimeline = {
  id: number
  current_status: Machine['status']
  timestamp: string
  timeDifference: string
  description: string | null
}

export type MachineTimeline = {
  name: string
  status: Machine['status']
  MachineLogs: Array<ObjMachineTimeline>
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
