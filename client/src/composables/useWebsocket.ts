import type { AllMachineTimeline, GetPercentages } from '@/types/machine.type'
import type { PayloadWebsocket, WebsocketResponse } from '@/types/websocket.type'
import useToast from '@/composables/useToast'
import { ref, onMounted, onUnmounted, shallowRef, computed } from 'vue'
import type { OperatorMachine } from '@/types/user.type'

const PORT = +import.meta.env.VITE_PORT || 3000
const SOCKET_URL = `ws://localhost:${PORT}`

export const timelineMachines = ref<AllMachineTimeline | undefined>()
const messageWebsocket = shallowRef<string | undefined>()
const percentageMachines = ref<GetPercentages | undefined>(undefined)

const operatorMachines = ref<OperatorMachine[]>([])
export const loadingWebsocket = shallowRef<boolean>(false)

// Global WebSocket instance and state
const websocket = shallowRef<WebSocket | null>(null)
const isConnectedWebsocket = computed(
  () => !!websocket.value && websocket.value.readyState === WebSocket.OPEN
)

// Create WebSocket connection
const createSocket = (): Promise<WebSocket> => {
  if (isConnectedWebsocket.value) {
    return Promise.resolve(websocket.value as WebSocket)
  }

  return new Promise((resolve) => {
    const ws = new WebSocket(SOCKET_URL, 'echo-protocol')

    ws.onopen = () => {
      console.log('Connected to WebSocket server')
      resolve(ws)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error', error)
    }

    ws.onclose = () => {
      console.log('WebSocket closed')
      websocket.value = null
      resetState()
    }

    websocket.value = ws
  })
}

// Message handler with toast access
const handleMessage = (parsedData: WebsocketResponse, toast: ReturnType<typeof useToast>) => {
  const { type, data, message } = parsedData
  console.log(`from server ${type}`, data)

  switch (type) {
    case 'error':
      timelineMachines.value = undefined
      operatorMachines.value = []
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

// Reset all state
const resetState = () => {
  timelineMachines.value = undefined
  operatorMachines.value = []
  messageWebsocket.value = undefined
  loadingWebsocket.value = false
}

const useWebSocket = (payload: PayloadWebsocket) => {
  const toast = useToast()

  onMounted(async () => {
    try {
      loadingWebsocket.value = true

      // Create or get WebSocket connection
      if (!isConnectedWebsocket.value) {
        const ws = await createSocket()
        ws.onmessage = (event) => {
          const parsedData = JSON.parse(event.data) as WebsocketResponse
          handleMessage(parsedData, toast)
        }
      }

      await sendMessage(payload)
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    } finally {
      loadingWebsocket.value = false
    }
  })

  onUnmounted(() => {
    sendMessage({ ...payload, close: true })
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

// Close WebSocket connection (logout)
export const closeConnection = () => {
  if (websocket.value) {
    websocket.value.close()
    websocket.value = null
  }

  // Reset all state
  timelineMachines.value = undefined
  operatorMachines.value = []
  messageWebsocket.value = undefined
  loadingWebsocket.value = false
}

export const sendMessage = async (payload: PayloadWebsocket) => {
  try {
    loadingWebsocket.value = true

    if (!websocket.value || !isConnectedWebsocket.value) {
      websocket.value = await createSocket()
    }

    const newPayload = { close: payload.close || false, ...payload }
    console.log('send message, payload:', newPayload)
    websocket.value.send(JSON.stringify(newPayload))
  } catch (error) {
    console.error('Failed to send message:', error)
    throw error
  } finally {
    loadingWebsocket.value = false
  }
}

export default useWebSocket
