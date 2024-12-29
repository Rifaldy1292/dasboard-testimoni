<script setup lang="ts">
import type { Machine } from '@/types/machine.type'
import { Button, Dialog, InputText } from 'primevue'
import { defineModel, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Form } from '@primevue/forms'

const visibleDialogForm = defineModel<boolean>('visibleDialogForm', {
  required: true
})

const selectedMachine = defineModel<Machine | undefined>('selectedMachine', {
  default: undefined
})

watch(
  [selectedMachine, visibleDialogForm],
  () => {
    console.log(selectedMachine.value, 'machine')
    console.log(visibleDialogForm.value, 'visibleDialogForm')
  },
  { immediate: true }
)

const route = useRoute()
const page = route.name === 'manual' ? 'Machine' : 'Operator'

const handleCloseModal = (): void => {
  selectedMachine.value = undefined
  visibleDialogForm.value = false
}
</script>

<template>
  <div class="card flex justify-center">
    <!-- Edit machine -->
    <template v-if="page === 'Machine'">
      <Dialog
        v-model:visible="visibleDialogForm"
        modal
        @hide="handleCloseModal"
        :header="`Edit ${page}`"
        :style="{ width: '25rem' }"
      >
        <span class="text-surface-500 dark:text-surface-400 block mb-8"
          >Update your information.</span
        >
        <Form />
        <div class="flex items-center gap-4 mb-4">
          <label for="username" class="font-semibold w-24">Username</label>
          <InputText id="username" class="flex-auto" autocomplete="off" />
        </div>
        <div class="flex items-center gap-4 mb-8">
          <label for="email" class="font-semibold w-24">Email</label>
          <InputText id="email" class="flex-auto" autocomplete="off" />
        </div>
        <div class="flex justify-end gap-2">
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            @click="handleCloseModal"
          ></Button>
          <Button type="button" label="Save" @click="handleCloseModal"></Button>
        </div>
      </Dialog>
    </template>
  </div>
</template>
