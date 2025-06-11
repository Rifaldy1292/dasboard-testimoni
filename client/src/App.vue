<script setup lang="ts">
import { ConfirmDialog, Toast } from 'primevue'
import { RouterView } from 'vue-router'
import haitod from '@/assets/sounds/haitod.mp3'
import { computed, onMounted, shallowRef } from 'vue'
import axios from 'axios'

const handleOpenDialogConfirm = () => {
  const audio = new Audio(haitod)
  audio.currentTime = 1
  audio.play()
}

const publicIp = shallowRef<string | null>(null)

onMounted(async () => {
  try {
    const { data } = await axios.get('https://api.ipify.org?format=json')
    publicIp.value = data.ip as string
  } catch (error) {
    console.error('Error fetching public IP:', error)
  }
})

const NODE_ENV: string = import.meta.env.VITE_NODE_ENV || 'development'

// protect using public IP and device width moble, if mobile return false
const isAllowed = computed<boolean>(() => {
  if (window.innerWidth < 768) return false
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
