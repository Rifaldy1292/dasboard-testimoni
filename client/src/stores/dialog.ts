import { defineStore } from 'pinia'
import { ref } from 'vue'

interface DialogState {
  visibleTimelineDialog: boolean
}

export const useDialogStore = defineStore('dialog', () => {
  // Single ref with object containing dialog state
  const dialogState = ref<DialogState>({
    visibleTimelineDialog: false
  })

  // Actions for timeline dialog
  const openTimelineDialog = () => {
    dialogState.value.visibleTimelineDialog = true
  }

  const closeTimelineDialog = () => {
    dialogState.value.visibleTimelineDialog = false
  }

  const toggleTimelineDialog = () => {
    dialogState.value.visibleTimelineDialog = !dialogState.value.visibleTimelineDialog
  }

  return {
    // State
    dialogState,

    // Actions
    openTimelineDialog,
    closeTimelineDialog,
    toggleTimelineDialog
  }
})
