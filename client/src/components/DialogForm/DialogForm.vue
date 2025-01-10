<script setup lang="ts">
import { Dialog } from 'primevue'
import type { DialogFormProps } from './DialogForm.type'

defineProps<{
  data: DialogFormProps
}>()

const emit = defineEmits<{
  hide: []
}>()

const visibleDialogForm = defineModel<boolean>('visibleDialogForm', {
  required: true
})

const handleCloseModal = () => {
  visibleDialogForm.value = false
  emit('hide')
}
</script>

<template>
  <div class="card flex justify-center">
    <!-- Edit machine -->
    <Dialog
      v-model:visible="visibleDialogForm"
      modal
      @hide="handleCloseModal"
      :header="data.header"
      :style="{ width: '25rem' }"
    >
      <span class="text-surface-500 dark:text-surface-400 block mb-8">{{ data.description }}</span>
      <slot name="body" />
    </Dialog>
  </div>
</template>
