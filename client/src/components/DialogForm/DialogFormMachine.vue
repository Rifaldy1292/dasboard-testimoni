<script setup lang="ts">
import { watch } from 'vue'
import type { Machine } from '@/types/machine.type'
import { Button, Dialog, InputText, Message } from 'primevue'
import { useRoute } from 'vue-router'
import { Form, FormField } from '@primevue/forms'
import { z } from 'zod'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import useToast from '@/utils/useToast'

const visibleDialogForm = defineModel<boolean>('visibleDialogForm', {
  required: true
})
const selectedMachine = defineModel<Machine | undefined>('selectedMachine', {
  default: undefined
})

watch(
  [selectedMachine, visibleDialogForm],
  () => {
    // console.log(selectedMachine.value, 'machine')
    // console.log(visibleDialogForm.value, 'visibleDialogForm')
  },
  { immediate: true }
)

const route = useRoute()
const toast = useToast()
const page = route.name === 'manual' ? 'Machine' : 'Operator'

const resolver = zodResolver(
  z.object({
    status: z.string().nonempty('Status is required'),
    runningTime: z.string().nonempty('Running Time is required')
  })
)

const handleCloseModal = (): void => {
  selectedMachine.value = undefined
  visibleDialogForm.value = false
}

const submitForm = ({ valid }: { valid: boolean }) => {
  if (!valid) return
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Machine updated',
    life: 3000
  })
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
        :header="`Edit Machine ${selectedMachine?.machineName}`"
        :style="{ width: '25rem' }"
      >
        <span class="text-surface-500 dark:text-surface-400 block mb-8"
          >Update your information.</span
        >
        <Form
          v-slot="$form"
          :resolver="resolver"
          :initial-values="selectedMachine"
          @submit="submitForm"
          :validateOnBlur="true"
        >
          <FormField name="runningTime">
            <div class="gap-4 mb-8">
              <label for="runningTime" class="font-semibold w-24">Running Time (hour)</label>
              <InputText type="text" class="flex-auto" autocomplete="off" />
              <br />
              <Message
                v-if="$form.runningTime?.invalid"
                severity="error"
                size="small"
                variant="simple"
                >{{ $form.runningTime.error.message }}</Message
              >
            </div>
          </FormField>
          <FormField name="status">
            <div class="gap-4 mb-8">
              <label for="status" class="font-semibold w-24">Status</label>
              <br />
              <InputText name="status" class="flex-auto" autocomplete="off" />
              <Message
                v-if="$form.status?.invalid"
                severity="error"
                size="small"
                variant="simple"
                >{{ $form.status.error.message }}</Message
              >
            </div>
          </FormField>
          <div class="flex justify-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="handleCloseModal" />
            <Button type="submit" label="Save" :disabled="!$form.valid" />
          </div>
        </Form>
      </Dialog>
    </template>
  </div>
</template>
