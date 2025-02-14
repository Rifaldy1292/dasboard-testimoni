import type { Machine, MachineTimeline } from '@/types/machine.type'
import useToast from '@/utils/useToast'
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
const PORT = +import.meta.env.VITE_PORT || 3000
const SOCKET_URL = `ws://localhost:${PORT}`

type PayloadType = 'timeline' | 'percentage' | 'test' | 'cuttingTime'
type payloadWebsocket = {
  type: PayloadType
  message?: string
  data?: {
    date?: string
  }
}

interface WebsocketResponse {
  type: PayloadType | 'error'
  data: Array<any>
  message?: string
}

const useWebSocket = (payloadType?: PayloadType) => {
  const toast = useToast()

  const socket = ref<WebSocket | null>(null)
  const percentageMachines = ref<Machine[]>([])
  const timelineMachines = ref<MachineTimeline[]>([])
  // const errorMessage = shallowRef<string | undefined>()
  const loadingWebsocket = shallowRef<boolean>(false)

  const sendMessage = (payload: payloadWebsocket) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      console.log('send message')
      return socket.value.send(JSON.stringify(payload))
    }
  }

  onMounted(() => {
    socket.value = new WebSocket(SOCKET_URL)

    socket.value.onopen = () => {
      console.log('Connected to WebSocket server')
      if (payloadType)
        sendMessage({
          type: payloadType,
          data: {
            date: new Date().toISOString()
          }
        })
    }
    socket.value.onmessage = (event) => {
      try {
        loadingWebsocket.value = true
        const parsedData = JSON.parse(event.data) as WebsocketResponse
        // console.log('Received WebSocket message', parsedData)
        const { type, data, message } = parsedData
        if (!type) return console.log('Unknown format', parsedData)
        switch (type) {
          case 'error':
            toast.add({
              severity: 'error',
              summary: 'Error',
              detail: message
            })
            break
          case 'timeline':
            console.log('from server timeline', data)
            timelineMachines.value = data
            break
          case 'percentage': {
            percentageMachines.value = data
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

    socket.value.onclose = () => {
      percentageMachines.value = []
      timelineMachines.value = []
      console.log('Disconnected from WebSocket server')
    }
  })

  onUnmounted(() => {
    if (socket.value) {
      socket.value.close()
    }
  })

  return { sendMessage, loadingWebsocket, percentageMachines, timelineMachines }
}

export default useWebSocket
