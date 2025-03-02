import type { AxiosResponse } from 'axios'
import API from './API'
import type { ApiResponse, GetCuttingTimeMachine } from '@/types/apiResponse.type'
import type { MachineOption } from '@/types/machine.type'
import type { ParamsGetCuttingTime, TransferFiles } from '@/dto/machine.dto'

const MachineServices = {
  postFiles: (params: TransferFiles): Promise<AxiosResponse> => {
    const formData = new FormData()
    params.files.forEach((file) => {
      formData.append('files', file)
    })

    return API({
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { machine_id: params.machine_id, user_id: params.user_id }
    }).post('/machines/transfer', formData)
  },
  getCuttingTime: (params: ParamsGetCuttingTime): Promise<AxiosResponse<GetCuttingTimeMachine>> => {
    return API({ params }).get('/machines/cutting-time')
  },
  getMachineOptions: (): Promise<AxiosResponse<ApiResponse<MachineOption[]>>> => {
    return API().get('/machines/options')
  }
}

export default MachineServices
