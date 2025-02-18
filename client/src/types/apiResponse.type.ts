import type { UserLocalStorage } from './localStorage.type'
import type { CuttingTimeMachine, Machine, MachineTimeline } from './machine.type'
import type { User } from './user.type'

export interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

export interface GetUsers extends ApiResponse<User[]> {}

export type ForgotPasswordData = Pick<UserLocalStorage, 'NIK' | 'name' | 'role' | 'exp'>
export type FindByNIk = ApiResponse<ForgotPasswordData>

export interface GetTimeLineMachine extends ApiResponse<MachineTimeline[]> {}

export type GetCuttingTimeMachine = ApiResponse<CuttingTimeMachine>
