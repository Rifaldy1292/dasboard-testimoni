<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { DialogFormProps } from '@/components/DialogForm/DialogForm.type'
import DialogForm from '@/components/DialogForm/DialogForm.vue'
import { Button, InputText } from 'primevue'
import type { ObjMachineTimeline } from '@/types/machine.type'
import type { EditLogDescription } from '@/dto/machine.dto'
import useWebSocket from '@/composables/useWebsocket'

const { selectedMachine, machineName, isDocs } = defineProps<{
  selectedMachine?: ObjMachineTimeline
  machineName: string
  isDocs?: boolean
}>()

const visibleDialogForm = defineModel<boolean>('visibleDialogForm', {
  required: true
})

const { sendMessage } = useWebSocket()

const dataDialogConfirm = computed<DialogFormProps>(() => ({
  header: `Edit Description ${machineName || ''} ${selectedMachine?.createdAt || ''}`
}))

const inputDescription = shallowRef<string>(selectedMachine?.description as string)
watch(
  () => selectedMachine,
  () => {
    inputDescription.value = selectedMachine?.description as string
  }
)

const handleSubmitForm = () => {
  if (
    !selectedMachine ||
    inputDescription.value === selectedMachine.description ||
    !inputDescription.value.trim() ||
    !isDocs
  )
    return undefined

  const payload: EditLogDescription = {
    description: inputDescription.value,
    id: selectedMachine?.id as number
  }
  sendMessage({
    type: 'editLogDescription',
    data: payload
  })

  visibleDialogForm.value = false
}
</script>

<template>
  <DialogForm v-model:visibleDialogForm="visibleDialogForm" :data="dataDialogConfirm">
    <template #body>
      <div class="flex flex-col gap-4">
        <InputText
          v-model="inputDescription"
          :defaultValue="inputDescription"
          @keydown.enter="handleSubmitForm"
        />
        <Button label="Submit" @click="handleSubmitForm" />
      </div>
    </template>
  </DialogForm>
</template>
