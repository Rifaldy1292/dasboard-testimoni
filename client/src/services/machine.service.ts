import type { AxiosResponse } from 'axios'
import API from './API'
import type {
  ApiResponse,
  DownloadMachineLogsMonthly,
  EncryptContent,
  GetCuttingTimeMachine
} from '@/types/apiResponse.type'
import type { AllMachineTimeline, MachineOption } from '@/types/machine.type'
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

  getFileList(
    machine_id: number
  ): Promise<AxiosResponse<ApiResponse<{ fileName: string; isDeleted: boolean }[]>>> {
    return API().get(`/machines/list-files/${machine_id}`)
  },
  deleteFile(params: { fileName?: string; machine_id: number }): Promise<AxiosResponse> {
    return API({ params }).delete(`/machines/remove-files`)
  },

  undoDeleteFile(params: {
    fileName: string
    machine_id: number
  }): Promise<AxiosResponse<ApiResponse<unknown>>> {
    return API({ params }).post(`/machines/undo-delete-files`)
  },

  deleteClearCache(): Promise<AxiosResponse> {
    return API().delete('/machines/clear-cache')
  },

  getIsReadyTransferFiles(params: {
    machine_id: number
  }): Promise<AxiosResponse<ApiResponse<unknown>>> {
    return API({ params }).get('/machines/is-ready-transfer-files')
  },

  patchMachineLogDescription(body: {
    id: number
    description: string
  }): Promise<AxiosResponse<ApiResponse<unknown>>> {
    return API().patch('/machines/machine-log', body)
  },
  getTimelineByMachineId(
    machine_id: number
  ): Promise<AxiosResponse<ApiResponse<AllMachineTimeline>>> {
    return API().get(`/machines/machine-log/${machine_id}`)
  },

  downloadMachineLogsMonthly(params: {
    date: string
  }): Promise<AxiosResponse<DownloadMachineLogsMonthly>> {
    return API({ params }).get('/machines/monthly-logs')
  }
}

export default MachineServices
