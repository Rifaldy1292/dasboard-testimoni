export interface RegisterPayload {
  name: string
  NIK: number
  password: string
}

export type LoginPayload = Omit<RegisterPayload, 'name'>
