import type { User } from './user.type'

interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

export interface GetUsers extends ApiResponse<User[]> {}
