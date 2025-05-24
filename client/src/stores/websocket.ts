import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { AllMachineTimeline, GetPercentages } from '@/types/machine.type'
import type { PayloadWebsocket, WebsocketResponse } from '@/types/websocket.type'
import type { OperatorMachine } from '@/types/user.type'
import useToast from '@/composables/useToast'

export const useWebsocketStore = defineStore('websocket', () => {
  // Import toast
  const toast = useToast()

  // State
  const timelineMachines = ref<AllMachineTimeline | undefined>()
  const percentageMachines = ref<GetPercentages | undefined>(undefined)
  const operatorMachines = ref<OperatorMachine[]>([])
  const loadingWebsocket = shallowRef<boolean>(false)
  const websocket = shallowRef<WebSocket | null>(null)

  const sendMessage = (payload: PayloadWebsocket) => {
    try {
      loadingWebsocket.value = true
      const newPayload = { close: payload.close || false, ...payload }

      // Check if websocket exists and is connected
      if (!websocket.value || websocket.value.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket is not connected')
      }

      websocket.value.send(JSON.stringify(newPayload))
      console.log('send message, payload:', newPayload)
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    } finally {
      loadingWebsocket.value = false
    }
  }

  // Message handler with toast access
  const handleMessage = (parsedData: WebsocketResponse) => {
    const { type, data, message } = parsedData
    console.log(`from server ${type}`, data)

    switch (type) {
      case 'error':
        timelineMachines.value = undefined
        operatorMachines.value = []
        percentageMachines.value = undefined
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: message || 'An error occurred'
        })
        break
      case 'success':
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: message
        })
        break
      case 'timeline':
        timelineMachines.value = data as AllMachineTimeline
        break
      case 'remaining':
        operatorMachines.value = data as Array<unknown> as OperatorMachine[]
        break
      case 'percentage':
        percentageMachines.value = data as GetPercentages
        break
      default:
        console.log('Unknown type', type, data)
    }
  }

  return {
    // State
    timelineMachines,
    percentageMachines,
    operatorMachines,
    loadingWebsocket,
    websocket,
    // Actions
    sendMessage,
    handleMessage
  }
})
