export interface ShiftInfo {
  combine: string | null
  shift1: string | null
  shift2: string | null
}

interface CountInfo {
  shift1: number
  shift2: number
  combine: number
  calculate: {
    shift1: number
    shift2: number
    combine: number
  }
}

interface DayData {
  date: number
  shifts: ShiftInfo
  count: CountInfo
}

export interface MachineInfo {
  name: string
  data: DayData[]
}

export interface CuttingTimeMachine {
  period: string
  allDateInMonth: number[]
  data: MachineInfo[]
}
