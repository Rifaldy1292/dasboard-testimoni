export type Role = 'Admin' | 'Operator' | 'Reviewer'

export type RoleOption = {
  id: number
  name: Role
}
export interface User {
  id: number
  name: string
  NIK: number
  machine_id: null | number
  createdAt: Date
  updatedAt: Date
  role: Role
  role_id: number
  machineName: null | string
  allowDelete: boolean
}
