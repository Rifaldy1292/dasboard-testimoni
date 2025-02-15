import type { AxiosResponse } from 'axios'
import API from './API'
import type { ApiResponse } from '@/types/apiResponse.type'

const MachineServices = {
  getCuttingTime: (params: { period: Date }): Promise<AxiosResponse<ApiResponse<any>>> => {
    return API({ params }).get('/machines/cutting-time')
  }
}

export default MachineServices
