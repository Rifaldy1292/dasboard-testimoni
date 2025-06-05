import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { AllMachineTimeline, GetPercentages } from '@/types/machine.type'
import type { PayloadWebsocket } from '@/types/websocket.type'
import type { OperatorMachine } from '@/types/user.type'

const loadingWebsocket = shallowRef<boolean>(false)
export const useWebsocketStore = defineStore('websocket', () => {
  // State
  const timelineMachines = ref<AllMachineTimeline | undefined>()
  const percentageMachines = ref<GetPercentages | undefined>(undefined)
  const operatorMachines = ref<OperatorMachine[]>([])
  const websocket = shallowRef<WebSocket | null>(null)

  const sendMessage = (payload: PayloadWebsocket) => {
    try {
      loadingWebsocket.value = true
      const newPayload = { close: payload.close || false, ...payload }

      if (!websocket.value || websocket.value.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket is not connected')
      }

      websocket.value.send(JSON.stringify(newPayload))
      // console.log('send message, payload:', newPayload)
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    } finally {
      loadingWebsocket.value = false
    }
  }

  const closeConnection = () => {
    try {
      if (websocket.value) {
        websocket.value.close()
        websocket.value = null
        // Reset all state
        timelineMachines.value = undefined
        percentageMachines.value = undefined
        operatorMachines.value = []
        console.log('WebSocket connection closed')
      }
    } catch (error) {
      console.error('Failed to close websocket:', error)
    } finally {
      loadingWebsocket.value = false
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
    closeConnection
  }
})
