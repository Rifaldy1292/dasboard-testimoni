import type { AxiosResponse } from 'axios'
import API from './API'
import type { LoginPayload, RegisterPayload } from '@/dto/user.dto'
import type { FindByNIk, GetUsers } from '@/types/apiResponse.type'

const UserServices = {
  register: (body: RegisterPayload): Promise<AxiosResponse> => {
    return API().post('/users/register', body)
  },

  login: (body: LoginPayload): Promise<AxiosResponse<{ data: { token: string } }>> => {
    return API().post('/users/login', body)
  },
  getUsers: (): Promise<AxiosResponse<GetUsers>> => {
    return API().get('/users')
  },
  findByNIk: (nik: number): Promise<AxiosResponse<FindByNIk>> => {
    return API().get(`/users/${nik}`)
  },
  deleteById: (id: number): Promise<AxiosResponse> => {
    return API().delete(`/users/${id}`)
  }
}

export default UserServices
