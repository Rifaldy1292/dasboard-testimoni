import type { AllMachineTimeline, Machine } from '@/types/machine.type'
import type { PayloadType, payloadWebsocket, WebsocketResponse } from '@/types/websocket.type'
import useToast from '@/utils/useToast'
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
const PORT = +import.meta.env.VITE_PORT || 3000
const SOCKET_URL = `ws://localhost:${PORT}`
const timelineMachines = ref<AllMachineTimeline | undefined>()

const useWebSocket = (payloadType?: PayloadType) => {
  const toast = useToast()

  const socket = ref<WebSocket | null>(null)
  const percentageMachines = ref<Machine[]>([])
  // const errorMessage = shallowRef<string | undefined>()
  const loadingWebsocket = shallowRef<boolean>(false)
  // const successMessage = shallowRef<string | undefined>()

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
        console.log({ type })
        switch (type) {
          case 'error':
            toast.add({
              severity: 'error',
              summary: 'Error',
              detail: message
            })
            break
          case 'success':
            if (message === 'Description updated successfully') {
              // refetch
              sendMessage({
                type: 'timeline',
                data: {
                  date: new Date().toISOString()
                }
              })
            }
            toast.add({
              severity: 'success',
              summary: 'Success',
              detail: message
            })
            break
          case 'timeline':
            console.log('from server timeline', parsedData)
            timelineMachines.value = data as AllMachineTimeline
            console.log('timelineMachines.value', timelineMachines.value)
            // if (data !== timelineMachines.value) {
            // }
            break
          case 'percentage': {
            percentageMachines.value = data as Machine[]
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
      timelineMachines.value = undefined
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
