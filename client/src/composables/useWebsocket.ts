import type { AllMachineTimeline, GetPercentages } from '@/types/machine.type'
import type { PayloadType, payloadWebsocket, WebsocketResponse } from '@/types/websocket.type'
import useToast from '@/utils/useToast'
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
const PORT = +import.meta.env.VITE_PORT || 3000
const SOCKET_URL = `ws://localhost:${PORT}`

const timelineMachines = ref<AllMachineTimeline | undefined>()
const messageWebsocket = shallowRef<string | undefined>()

const useWebSocket = (payloadType?: PayloadType) => {
  const toast = useToast()

  const socket = ref<WebSocket | null>(null)
  const percentageMachines = ref<GetPercentages | undefined>(undefined)
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
    socket.value = new WebSocket(SOCKET_URL, 'echo-protocol')

    socket.value.onopen = () => {
      console.log('Connected to WebSocket server')
      if (payloadType)
        sendMessage({
          type: payloadType
          // data: {
          //   date: new Date().toISOString()
          // }
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
        if (message) {
          messageWebsocket.value = message
          // console.log(messageWebsocket.value, 'from usews')
        }
        switch (type) {
          case 'error':
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
            console.log('from server timeline', parsedData)
            timelineMachines.value = data as AllMachineTimeline
            console.log('timelineMachines.value', timelineMachines.value)
            // if (data !== timelineMachines.value) {
            // }
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
    }

    socket.value.onclose = () => {
      percentageMachines.value = undefined
      timelineMachines.value = undefined
      socket.value?.close()
      console.log('Disconnected from WebSocket server')
    }
  })

  onUnmounted(() => {
    if (socket.value) {
      socket.value.close()
    }

    socket.value = null
  })

  return { sendMessage, messageWebsocket, loadingWebsocket, percentageMachines, timelineMachines }
}

export default useWebSocket
