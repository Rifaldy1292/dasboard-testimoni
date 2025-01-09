import type { AxiosResponse } from 'axios'
import API from './API'
import type { ApiResponse } from '@/types/apiResponse.type'
import type { RoleOption } from '@/types/user.type'

const RoleServices = {
  getAll: (): Promise<AxiosResponse<ApiResponse<RoleOption[]>>> => {
    return API().get('/roles')
  }
}

export default RoleServices
