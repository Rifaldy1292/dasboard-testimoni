import type { Machine } from '@/types/machine.type'
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
const PORT = +import.meta.env.VITE_PORT || 3000
const SOCKET_URL = `ws://localhost:${PORT}`

type payloadWebsocket = {
  type: string
  message: string
}

const useWebSocket = () => {
  const socket = ref<WebSocket | null>(null)
  const percentageMachines = ref<Machine[]>([])
  const loadingWebsocket = shallowRef<boolean>(false)

  const sendMessage = (payload: payloadWebsocket) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(payload))
    }
  }

  onMounted(() => {
    socket.value = new WebSocket(SOCKET_URL)

    socket.value.onopen = () => console.log('Connected to WebSocket server')

    socket.value.onmessage = (event) => {
      try {
        loadingWebsocket.value = true
        const parsedData = JSON.parse(event.data)
        const { type, data } = parsedData
        if (type) {
          switch (type) {
            case 'timeline':
              console.log('from server timeline', data)
              break
            case 'percentage': {
              const sortedData = data.sort((a: Machine, b: Machine) => {
                const numberA = parseInt(a.name.slice(3))
                const numberB = parseInt(b.name.slice(3))
                return numberA - numberB
              })
              percentageMachines.value = sortedData
              break
            }
          }
        }
        console.log('Received WebSocket message', parsedData)
      } catch (error) {
        console.error('Invalid WebSocket message', error)
      } finally {
        loadingWebsocket.value = false
      }
    }

    socket.value.onclose = () => console.log('Disconnected from WebSocket server')
  })

  onUnmounted(() => {
    if (socket.value) {
      socket.value.close()
    }
  })

  return { sendMessage, loadingWebsocket, percentageMachines }
}

export default useWebSocket
