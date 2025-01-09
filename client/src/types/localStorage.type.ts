import type { User } from './user.type'

export interface UserLocalStorage extends User {
  token: string
  iat: number
  exp: number
}
