import type { AxiosResponse } from 'axios'
import API from './API'
import type { GetCuttingTimeMachine } from '@/types/apiResponse.type'

const MachineServices = {
  getCuttingTime: (params: { period: Date }): Promise<AxiosResponse<GetCuttingTimeMachine>> => {
    return API({ params }).get('/machines/cutting-time')
  }
}

export default MachineServices
