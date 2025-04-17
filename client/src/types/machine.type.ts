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
  total_cutting_time: number
  g_code_name: string
  k_num: string
  calculate_total_cutting_time: string
  isNext?: boolean
  isLastLog?: boolean
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
  name: MachineName
  startMacro: 500 | 540 | 560
}

export type MachineName =
  | 'MC-1'
  | 'MC-2'
  | 'MC-3'
  | 'MC-4'
  | 'MC-5'
  | 'MC-6'
  | 'MC-14'
  | 'MC-15'
  | 'MC-16'
