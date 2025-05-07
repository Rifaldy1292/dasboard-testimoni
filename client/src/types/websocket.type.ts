export type PayloadType = 'timeline' | 'percentage' | 'remaining' | 'test'
export type ShiftValue = 0 | 1 | 2
export type payloadWebsocket = {
  type: PayloadType
  data?:
    | {
        date?: string
        id?: number
        shift?: ShiftValue
      }
    | Record<string, unknown>
}

type ResponseType = 'success' | 'error'
export interface WebsocketResponse {
  type: PayloadType | ResponseType
  data:
    | Array<unknown>
    | {
        data: Array<unknown>
        date: string
      }
  message?: string
  date?: string
}
