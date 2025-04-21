export type PayloadType = 'timeline' | 'percentage' | 'test' | 'cuttingTime' | 'editLogDescription'
export type payloadWebsocket = {
  type: PayloadType
  data?:
    | {
        date?: string
        id?: number
      }
    | Record<string, any>
}

type ResponseType = 'success' | 'error'
export interface WebsocketResponse {
  type: PayloadType | ResponseType
  data:
    | Array<any>
    | {
        data: Array<any>
        date: string
      }
  message?: string
  date?: string
}
