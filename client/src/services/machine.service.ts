import type { AxiosResponse } from 'axios'
import API from './API'
import type { GetTimeLineMachine } from '@/types/apiResponse.type'

const MachineServices = {
  getTimeline: (): Promise<AxiosResponse<GetTimeLineMachine>> => {
    return API().get('/machines/timeline')
  }
}

export default MachineServices
