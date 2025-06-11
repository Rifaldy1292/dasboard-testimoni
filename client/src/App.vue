<script setup lang="ts">
import { ConfirmDialog, Toast } from 'primevue'
import { RouterView } from 'vue-router'
import haitod from '@/assets/sounds/haitod.mp3'
import { computed, onMounted, shallowRef, onUnmounted } from 'vue'
import axios from 'axios'

const handleOpenDialogConfirm = () => {
  const audio = new Audio(haitod)
  audio.currentTime = 1
  audio.play()
}

// Add a reactive ref for the window width
const windowWidth = shallowRef<number>(window.innerWidth)
const publicIp = shallowRef<string | null>(null)

// Handle window resize event
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(async () => {
  try {
    const { data } = await axios.get('https://api.ipify.org?format=json')
    publicIp.value = data.ip as string
  } catch (error) {
    console.error('Error fetching public IP:', error)
  }

  // Add event listener for window resize
  window.addEventListener('resize', handleResize)
})

// Clean up event listener on component unmount
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const NODE_ENV: string = import.meta.env.VITE_NODE_ENV || 'development'

// protect using public IP and device width mobile, if mobile return false
// Now using the reactive windowWidth instead of directly accessing window.innerWidth
const isAllowed = computed<boolean>(() => {
  if (windowWidth.value < 768) return false
  if (NODE_ENV !== 'production') return true
  return publicIp.value === import.meta.env.VITE_INTERNAL_IP
})
</script>

<template>
  <template v-if="!isAllowed">
    <div class="flex flex-col items-center justify-center h-screen">
      <h1 class="text-2xl font-bold mb-4">Access Denied</h1>
      <p class="text-lg">This application is not available in your region.</p>
    </div>
  </template>
  <template v-else>
    <Toast />
    <ConfirmDialog @show="handleOpenDialogConfirm" />
    <RouterView />
  </template>
</template>
