import type { AllMachineTimeline, GetPercentages } from '@/types/machine.type'
import type { PayloadWebsocket, WebsocketResponse } from '@/types/websocket.type'
import useToast from '@/composables/useToast'
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import type { OperatorMachine } from '@/types/user.type'
const PORT = +import.meta.env.VITE_PORT || 3000
const SOCKET_URL = `ws://localhost:${PORT}`

export const timelineMachines = ref<AllMachineTimeline | undefined>()
const messageWebsocket = shallowRef<string | undefined>()
const operatorMachines = ref<OperatorMachine[]>([])
export const loadingWebsocket = shallowRef<boolean>(false)

const socket = ref<WebSocket | null>(null)
export const sendMessage = (payload: PayloadWebsocket) => {
  if (socket.value?.readyState === WebSocket.OPEN) {
    console.log('send message', { payload })
    loadingWebsocket.value = true
    return socket.value.send(JSON.stringify(payload))
  }
}

const useWebSocket = (payload: PayloadWebsocket) => {
  const toast = useToast()

  const percentageMachines = ref<GetPercentages | undefined>(undefined)

  onMounted(() => {
    loadingWebsocket.value = true
    socket.value = new WebSocket(SOCKET_URL, 'echo-protocol')

    socket.value.onopen = () => {
      console.log('Connected to WebSocket server')
      if (payload) sendMessage(payload)
    }
    socket.value.onmessage = (event) => {
      try {
        loadingWebsocket.value = true
        const parsedData = JSON.parse(event.data) as WebsocketResponse
        // console.log('Received WebSocket message', parsedData)
        const { type, data, message } = parsedData
        if (!type) return console.log('Unknown format', parsedData)
        if (message) {
          messageWebsocket.value = message
          // console.log(messageWebsocket.value, 'from usews')
        }
        switch (type) {
          case 'error':
            // reset state
            timelineMachines.value = undefined
            operatorMachines.value = []
            percentageMachines.value = undefined
            toast.add({
              severity: 'error',
              summary: 'Error',
              detail: message
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
            console.log('from server timeline', data)
            break
          case 'remaining':
            operatorMachines.value = data as OperatorMachine[]
            break
          case 'percentage': {
            console.log('from server percentage', data)
            percentageMachines.value = data as GetPercentages
            break
          }
          default:
            console.log('Unknown type', type, data)
            break
        }
      } catch (error) {
        console.error('Invalid WebSocket message', error)
      } finally {
        loadingWebsocket.value = false
      }
    }

    socket.value.onerror = (error) => {
      console.error('WebSocket error', error)
      // Attempt to reconnect after a delay
      setTimeout(() => {
        socket.value = new WebSocket(SOCKET_URL, 'echo-protocol')
      }, 1000) // Reconnect after 1 seconds
    }

    socket.value.onclose = () => {
      percentageMachines.value = undefined
      timelineMachines.value = undefined
      socket.value?.close()
      console.log('Disconnected from WebSocket server')
    }
    loadingWebsocket.value = false
  })

  onUnmounted(() => {
    if (socket.value) {
      socket.value.close()
    }

    socket.value = null
  })

  return {
    sendMessage,
    operatorMachines,
    messageWebsocket,
    loadingWebsocket,
    percentageMachines,
    timelineMachines
  }
}

export default useWebSocket
