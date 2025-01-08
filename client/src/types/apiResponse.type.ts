import type { UserLocalStorage } from './localStorage.type'
import type { User } from './user.type'

interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

export interface GetUsers extends ApiResponse<User[]> {}

export type ForgotPasswordData = Pick<UserLocalStorage, 'NIK' | 'name' | 'role'>
export type FindByNIk = ApiResponse<ForgotPasswordData>
