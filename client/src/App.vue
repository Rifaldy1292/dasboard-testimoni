<script setup lang="ts">
import { ConfirmDialog, Toast } from 'primevue'
import { RouterView } from 'vue-router'
import haitod from '@/assets/sounds/haitod.mp3'

const handleOpenDialogConfirm = () => {
  const audio = new Audio(haitod)
  audio.currentTime = 1
  audio.play()
}
</script>

<template>
  <Toast />
  <ConfirmDialog @show="handleOpenDialogConfirm" />
  <RouterView />
</template>
