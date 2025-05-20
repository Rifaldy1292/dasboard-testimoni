export type PayloadType = 'timeline' | 'percentage' | 'remaining' | 'test'
export type ShiftValue = 0 | 1 | 2
export type PayloadWebsocket = {
  type: PayloadType
  close?: boolean
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
    | Array<Record<string, unknown>>
    | {
        data: Array<Record<string, unknown>>
        date: string
      }
  message?: string
  date?: string
}
