<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { DialogFormProps } from '@/components/DialogForm/DialogForm.type'
import DialogForm from '@/components/DialogForm/DialogForm.vue'
import { Button, Select } from 'primevue'
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

// Daftar opsi untuk dropdown
const descriptionOptions = [
  { name: 'Manual Operation', value: 'Manual Operation' },
  { name: 'Dandori Part', value: 'Dandori Part' },
  { name: 'Dandori Tool', value: 'Dandori Tool' },
  { name: 'Cek Dimensi', value: 'Cek Dimensi' },
  { name: 'Setting Nol Set', value: 'Setting Nol Set' },
  { name: 'Break', value: 'Break' }
]

const handleSubmitForm = () => {
  if (!selectedMachine || !inputDescription.value?.trim()) return

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
        <Select
          v-model="inputDescription"
          :options="descriptionOptions"
          optionLabel="name"
          optionValue="value"
          placeholder="Pilih atau masukkan deskripsi"
          :editable="true"
          class="w-full"
          @keydown.enter="handleSubmitForm"
        />
        <Button label="Submit" @click="handleSubmitForm" />
      </div>
    </template>
  </DialogForm>
</template>
