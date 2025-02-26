<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import type { DialogFormProps } from '@/components/DialogForm/DialogForm.type'
import DialogForm from '@/components/DialogForm/DialogForm.vue'
import useToast from '@/utils/useToast'
import { Button, InputText } from 'primevue'
import type { ObjMachineTimeline } from '@/types/machine.type'
import type { EditLogDescription } from '@/dto/machine.dto'
import useWebSocket from '@/composables/useWebsocket'

const { selectedMachine, machineName } = defineProps<{
  selectedMachine?: ObjMachineTimeline
  machineName: string
}>()

const visibleDialogForm = defineModel<boolean>('visibleDialogForm', {
  required: true
})

const { sendMessage } = useWebSocket()

const toast = useToast()

const dataDialogConfirm = computed<DialogFormProps>(() => ({
  header: `Edit Description ${machineName || ''} ${selectedMachine?.timestamp || ''}`
}))

const inputDescription = shallowRef<string>(selectedMachine?.description as string)
// watch(visibleDialogForm, (value) => {
//   if (value === true) {

// }})

const handleSubmitForm = () => {
  if (
    !selectedMachine ||
    inputDescription.value === selectedMachine.description ||
    !inputDescription.value.trim()
  )
    return
  const payload: EditLogDescription = {
    description: inputDescription.value,
    id: selectedMachine?.id as number
  }
  sendMessage({
    type: 'editLogDescription',
    data: payload
  })
  toast.add({
    severity: 'success',
    summary: 'copied!'
  })
}
</script>

<template>
  <DialogForm v-model:visibleDialogForm="visibleDialogForm" :data="dataDialogConfirm">
    <template #body>
      <div class="flex flex-col gap-4">
        <InputText v-model="inputDescription" />
        <Button label="Submit" @click="handleSubmitForm" />
      </div>
    </template>
  </DialogForm>
</template>
