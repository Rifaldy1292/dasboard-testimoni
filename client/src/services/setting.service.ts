import type { AxiosResponse } from 'axios'
import API from './API'
import type { ApiResponse } from '@/types/apiResponse.type'

const SettingServices = {
  getStartTime: (): Promise<
    AxiosResponse<ApiResponse<{ startHour: number; startMinute: number; id: number | null }>>
  > => {
    return API().get('/settings/start-time')
  },

  putStartTIme: (body: {
    reqStartHour: number
    reqStartMinute: number
    id: number
  }): Promise<AxiosResponse> => {
    return API().put('settings/start-time', body)
  },

  getListConfig: (): Promise<
    AxiosResponse<ApiResponse<{ id: number; date: string; startFirstShift: string }[]>>
  > => {
    return API().get('/settings/list')
  },

  getListCuttingTime: (): Promise<
    AxiosResponse<ApiResponse<{ id: number; target: number; period: string }[]>>
  > => {
    return API().get('/settings/cutting-times')
  },
  getListMachine: (): Promise<
    AxiosResponse<ApiResponse<{ id: number; target: number; period: string }[]>>
  > => {
    return API().get('/settings/machines')
  }
}

export default SettingServices
