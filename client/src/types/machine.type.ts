type RunningCount = number
type StoppedCount = number

export type Machine = {
  name: string
  percentage: [RunningCount, StoppedCount]
  description: string
  runningTime: string
  status: 'Running' | 'Stopped' | 'DISCONNECT'
  quantity: number
}

export type GetPercentages = {
  data: Machine[]
  date: string
  dateFrom: string
  dateTo: string
}

export type ObjMachineTimeline = {
  id: number
  current_status: Machine['status']
  createdAt: string
  timeDifference: string
  timeDifferenceMs: number
  description: string | null
  operator: string | null
  output_wp: string
  total_cutting_time: number
  g_code_name: string
  k_num: string
  calculate_total_cutting_time: string
  isNext?: boolean
  remaining: string | null
}

export type MachineTimeline = {
  name: string
  status: Machine['status']
  MachineLogs: Array<ObjMachineTimeline>
}

export type AllMachineTimeline = {
  date: string
  data: MachineTimeline[]
  dateFrom: string
  dateTo: string
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
  | 'MC-9'
  | 'MC-14'
  | 'MC-15'
  | 'MC-16'
