export interface RegisterPayload {
  name: string
  NIK: string
  password: string
  role_id?: number
}

export type LoginPayload = Omit<RegisterPayload, 'name'>

export interface EditProfile {
  name?: string
  profilePicture?: null | File
  password?: string
}

export interface ParamsGetUsers {
  role?: 'Operator' | 'Reviewer' | 'Admin'
}
