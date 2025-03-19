import type { AxiosResponse } from 'axios'
import API from './API'
import type { ApiResponse, EncryptContent, GetCuttingTimeMachine } from '@/types/apiResponse.type'
import type { MachineOption } from '@/types/machine.type'
import type { ParamsGetCuttingTime, TransferFiles } from '@/dto/machine.dto'
import type { ValueFromContent } from '@/types/ftp.type'

const MachineServices = {
  postFiles: (params: TransferFiles): Promise<AxiosResponse> => {
    const formData = new FormData()
    params.files.forEach((file) => {
      formData.append('files', file)
    })
    formData.append('machine_id', params.machine_id.toString())

    return API({
      headers: { 'Content-Type': 'multipart/form-data' }
    }).post('/machines/transfer', formData)
  },
  getCuttingTime: (params: ParamsGetCuttingTime): Promise<AxiosResponse<GetCuttingTimeMachine>> => {
    return API({ params }).get('/machines/cutting-time')
  },
  getMachineOptions: (): Promise<AxiosResponse<ApiResponse<MachineOption[]>>> => {
    return API().get('/machines/options')
  },

  postEncryptContentValue: (
    body: Omit<ValueFromContent, 'totalCuttingTime'>
  ): Promise<AxiosResponse<EncryptContent>> => {
    return API().post('/machines/encrypt-content', body)
  },

  getStartTime: (): Promise<
    AxiosResponse<ApiResponse<{ startHour: number; startMinute: number }>>
  > => {
    return API().get('/machines/start-time')
  },

  putStartTIme: (body: {
    reqStartHour: number
    reqStartMinute: number
  }): Promise<AxiosResponse> => {
    return API().put('machines/start-time', body)
  },

  getFileList(machine_id: number): Promise<AxiosResponse<ApiResponse<string[]>>> {
    return API().get(`/machines/list-files/${machine_id}`)
  },
  deleteFile(params: { fileName?: string; machine_id: number }): Promise<AxiosResponse> {
    return API({ params }).delete(`/machines/remove-files`)
  },

  deleteClearCache(): Promise<AxiosResponse> {
    return API().delete('/machines/clear-cache')
  }
}

export default MachineServices
