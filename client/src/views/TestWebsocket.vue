<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';


const ws = ref<WebSocket | null>(null)

const connectWebsocket = () => {
    ws.value = new WebSocket('ws://localhost:3333')

    ws.value.onmessage = (event) => {
        console.log('Connected')
        console.log(event.data)
    }
}

onMounted(() => {
    connectWebsocket()
    console.log(22)
})

onUnmounted(() => {
    ws.value?.close()
})
</script>

<template>
    <h1>Test Websocket</h1>
</template>