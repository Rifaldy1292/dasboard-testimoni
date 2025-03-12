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

export type GetPercentages = {
  data: Machine[]
  date: string
}

export type ObjMachineTimeline = {
  id: number
  current_status: Machine['status']
  createdAt: string
  timeDifference: string
  description: string | null
  operator: string | null
  output_wp: string
  total_cutting_time: string
  g_code_name: string
}

export type MachineTimeline = {
  name: string
  status: Machine['status']
  MachineLogs: Array<ObjMachineTimeline>
}

export type AllMachineTimeline = {
  date: string
  data: MachineTimeline[]
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
  startMacro: 500 | 540 | 560
}
