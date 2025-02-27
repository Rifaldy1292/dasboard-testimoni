export type PayloadType = 'timeline' | 'percentage' | 'test' | 'cuttingTime' | 'editLogDescription'
export type payloadWebsocket = {
  type: PayloadType
  message?: string
  data?:
    | {
        date?: string
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
