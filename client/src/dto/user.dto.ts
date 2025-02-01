export interface RegisterPayload {
  name: string
  NIK: number
  password: string
  role_id?: number
}

export type LoginPayload = Omit<RegisterPayload, 'name'>

export interface EditProfile {
  name?: string
  profilePicture?: null | File
}
