import { useWebsocketStore } from '@/stores/websocket'
import type { PayloadWebsocket, WebsocketResponse } from '@/types/websocket.type'
import useToast from '@/composables/useToast'
import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import type { AllMachineTimeline, GetPercentages } from '@/types/machine.type'
import type { OperatorMachine } from '@/types/user.type'

const SOCKET_URL =
  import.meta.env.VITE_NODE_ENV === 'production'
    ? import.meta.env.VITE_SOCKET_PRODUCTION
    : import.meta.env.VITE_SOCKET_DEVELOPMENT || 'ws://localhost:3000'

export default function useWebSocket(payload: PayloadWebsocket) {
  const store = useWebsocketStore()
  const toast = useToast()
  const { sendMessage, closeConnection } = store
  const { websocket, timelineMachines, operatorMachines, percentageMachines } = storeToRefs(store)

  const isConnectedWebsocket = computed<boolean>(
    () => !!websocket.value && websocket.value.readyState === WebSocket.OPEN
  )

  const createSocket = (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      if (isConnectedWebsocket.value) {
        resolve(websocket.value as WebSocket)
        return
      }

      const ws = new WebSocket(SOCKET_URL, 'echo-protocol')

      ws.onopen = () => {
        console.log('Connected to WebSocket server')
        websocket.value = ws
        resolve(ws)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error', error)
        reject(error)
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Connection error, please refresh the page'
        })
      }

      ws.onclose = () => closeConnection()

      // Handle incoming messages
      ws.onmessage = (event) => {
        const parsedData = JSON.parse(event.data) as WebsocketResponse
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
    })
  }

  // Setup WebSocket on component mount
  onMounted(async () => {
    try {
      await createSocket()
      if (isConnectedWebsocket.value) {
        sendMessage(payload)
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  })

  // Cleanup on component unmount
  onUnmounted(() => {
    if (isConnectedWebsocket.value) {
      sendMessage({ ...payload, close: true })
    }
  })

  return {
    ...storeToRefs(store),
    sendMessage,
    createSocket
  }
}
