export type Role = 'Admin' | 'Operator'

export interface User {
  id: number
  name: string
  password: string
  NIK: number
  machine_id: null | number
  createdAt: Date
  updatedAt: Date
  roleName: Role
  machineName: null | string
}
