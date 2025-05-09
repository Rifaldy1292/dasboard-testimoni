import type { AxiosResponse } from 'axios'
import API from './API'
import type { ApiResponse } from '@/types/apiResponse.type'
import type { DailyConfig } from '@/types/dailyConfig.type'

const SettingServices = {
  patchDailyConfig: (
    body: Pick<DailyConfig, 'id'> & { field: keyof Omit<DailyConfig, 'id'>; value: string }
  ): Promise<AxiosResponse> => {
    return API().patch('settings/daily-config', body)
  },
  getListConfig: (params: {
    period: string
  }): Promise<AxiosResponse<ApiResponse<DailyConfig[]>>> => {
    return API({ params }).get('/settings/daily-config')
  },

  deleteDailyConfig: (id: number): Promise<AxiosResponse> => {
    return API().delete(`/settings/daily-config/${id}`)
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
  },

  createDailyConfig: (data: Omit<DailyConfig, 'id'>): Promise<AxiosResponse> => {
    return API().post('/settings/daily-config', data)
  }
}

export default SettingServices
