import { useWebsocketStore } from '@/stores/websocket'
import type { PayloadWebsocket, WebsocketResponse } from '@/types/websocket.type'
import useToast from '@/composables/useToast'
import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'

const PORT = +import.meta.env.VITE_PORT || 3000
const SOCKET_URL = `ws://localhost:${PORT}`

export default function useWebSocket(payload: PayloadWebsocket) {
  const store = useWebsocketStore()
  const toast = useToast()
  const { sendMessage, handleMessage } = store
  const { websocket } = storeToRefs(store)

  const isConnectedWebsocket = computed<boolean>(
    () => !!websocket.value && websocket.value.readyState === WebSocket.OPEN
  )

  // Destructure state dan method

  // Create WebSocket connection
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
          detail: 'Failed to connect to WebSocket server'
        })
      }

      ws.onclose = () => {
        console.log('WebSocket closed')
        websocket.value = null
      }

      ws.onmessage = (event) => {
        const parsedData = JSON.parse(event.data) as WebsocketResponse
        handleMessage(parsedData)
      }
    })
  }

  // Setup WebSocket on component mount
  onMounted(async () => {
    try {
      // Wait for socket to connect before sending message
      await createSocket()
      // Only send message if we have a connection
      if (isConnectedWebsocket.value) {
        store.sendMessage(payload)
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  })

  // Cleanup on component unmount
  onUnmounted(() => {
    store.sendMessage({ ...payload, close: true })
  })
  // return store state dan method
  return {
    ...storeToRefs(store),
    sendMessage
  }
}
