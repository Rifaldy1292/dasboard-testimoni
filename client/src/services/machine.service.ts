import type { AxiosResponse } from 'axios'
import API from './API'
import type { ApiResponse, GetCuttingTimeMachine } from '@/types/apiResponse.type'
import type { MachineOption } from '@/types/machine.type'
import type { ParamsGetCuttingTime } from '@/dto/machine.dto'

const MachineServices = {
  getCuttingTime: (params: ParamsGetCuttingTime): Promise<AxiosResponse<GetCuttingTimeMachine>> => {
    return API({ params }).get('/machines/cutting-time')
  },
  getMachineOptions: (): Promise<AxiosResponse<ApiResponse<MachineOption[]>>> => {
    return API().get('/machines/options')
  }
}

export default MachineServices
