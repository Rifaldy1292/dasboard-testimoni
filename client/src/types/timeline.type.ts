import type { Machine, ObjMachineTimeline } from './machine.type'

export type MonthlyLogs = Pick<
  ObjMachineTimeline,
  'current_status' | 'g_code_name' | 'k_num' | 'operator' | 'output_wp' | 'description'
> &
  Pick<Machine, 'name'> & { total: number; date: string; start: string; end: string }
