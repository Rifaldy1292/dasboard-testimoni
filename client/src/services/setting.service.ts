import type { AxiosResponse } from 'axios'
import API from './API'
import type { ApiResponse } from '@/types/apiResponse.type'
import type { DailyConfig } from '@/types/dailyConfig.type'

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

  getListConfig: (params: {
    period: string
  }): Promise<AxiosResponse<ApiResponse<DailyConfig[]>>> => {
    return API({ params }).get('/settings/list')
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
