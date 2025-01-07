import type { AxiosResponse } from 'axios'
import API from './API'
import type { LoginPayload, RegisterPayload } from '@/dto/user.dto'

const UserServices = {
  register: (body: RegisterPayload): Promise<AxiosResponse> => {
    return API().post('/users/register', body)
  },

  login: (body: LoginPayload): Promise<AxiosResponse<{ data: { token: string } }>> => {
    return API().post('/users/login', body)
  }
}

export default UserServices
