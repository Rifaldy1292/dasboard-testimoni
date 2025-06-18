import type { CuttingTimeMachine } from './cuttingTime.type'
import type { ValueFromContent } from './ftp.type'
import type { UserLocalStorage } from './localStorage.type'
import type { MachineTimeline } from './machine.type'
import type { MonthlyLogs } from './timeline.type'
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

type EncryptedContent = Record<keyof ValueFromContent, number>
export type EncryptContent = ApiResponse<Omit<EncryptedContent, 'totalCuttingTimes'>>

export type GetCuttingTimeMachine = ApiResponse<CuttingTimeMachine>

export type DownloadMachineLogsMonthly = ApiResponse<MonthlyLogs[]>
