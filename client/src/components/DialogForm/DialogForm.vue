<script setup lang="ts">
defineProps<{
  description: string
  header: string
}>()

const visibleDialogForm = defineModel<boolean>('visibleDialogForm', {
  required: true
})

const handleCloseModal = () => {
  visibleDialogForm.value = false
}
</script>

<template>
  <div class="card flex justify-center">
    <!-- Edit machine -->
    <Dialog
      v-model:visible="visibleDialogForm"
      modal
      @hide="handleCloseModal"
      :header="header"
      :style="{ width: '25rem' }"
    >
      <span class="text-surface-500 dark:text-surface-400 block mb-8">{{ description }}</span>
    </Dialog>
  </div>
</template>
