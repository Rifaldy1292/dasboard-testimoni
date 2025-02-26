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

export interface WebsocketResponse {
  type: PayloadType | 'error'
  data: Array<any>
  message?: string
}
