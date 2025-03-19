import type { ObjMachineTimeline } from './machine.type'

export type Role = 'Admin' | 'Operator' | 'Reviewer'

export type RoleOption = {
  id: number
  name: Role
}
export interface User {
  id: number
  name: string
  NIK: string
  machine_id: null | number
  createdAt: Date
  updatedAt: Date
  role: Role
  role_id: number
  machineName: null | string
  allowDelete?: boolean
  imageUrl: null | string
}

export interface OperatorMachine {
  detail: Omit<ObjMachineTimeline & { calculate_total_cutting_time: string }, 'timeDifference' | 'description'> & { Machine: { name: string, type?: string } }
  name: string
  profile_image: null | string
}


