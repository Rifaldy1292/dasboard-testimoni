import type { AxiosResponse } from 'axios'
import API from './API'
import type { EditProfile, LoginPayload, ParamsGetUsers, RegisterPayload } from '@/dto/user.dto'
import type { ApiResponse, FindByNIk, GetUsers } from '@/types/apiResponse.type'
import type { User } from '@/types/user.type'

const UserServices = {
  register: (body: RegisterPayload): Promise<AxiosResponse> => {
    return API().post('/users/register', body)
  },

  login: (body: LoginPayload): Promise<AxiosResponse<{ data: { token: string } }>> => {
    return API().post('/users/login', body)
  },
  getUsers: (params?: ParamsGetUsers): Promise<AxiosResponse<GetUsers>> => {
    return API({ params }).get('/users')
  },
  findById: (): Promise<AxiosResponse<ApiResponse<User>>> => {
    return API().get(`/users/find`)
  },
  findByNIk: (nik: number): Promise<AxiosResponse<FindByNIk>> => {
    return API().get(`/users/find/${nik}`)
  },
  deleteById: (id: number): Promise<AxiosResponse> => {
    return API().delete(`/users/${id}`)
  },
  resetPassword: (id: number): Promise<AxiosResponse<{ data: { token: string } }>> => {
    return API().get(`/users/reset-password/${id}`)
  },
  changePassword: (token: string, body: { password: string }): Promise<AxiosResponse> => {
    return API({ token }).patch('/users/change-password', body)
  },
  checkToken: (token: string): Promise<AxiosResponse> => {
    return API({ token }).get('/users/check-token')
  },
  editprofile: (body: EditProfile): Promise<AxiosResponse<ApiResponse<{ imageUrl: string }>>> => {
    const headers = {
      'Content-Type': 'multipart/form-data'
    }
    return API({ headers }).patch('/users/edit-profile', body)
  }
}

export default UserServices
