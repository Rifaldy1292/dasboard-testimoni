<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { DialogFormProps } from '@/components/DialogForm/DialogForm.type'
import DialogForm from '@/components/DialogForm/DialogForm.vue'
import { Button, Select } from 'primevue'
import type { ObjMachineTimeline } from '@/types/machine.type'
import type { EditLogDescription } from '@/dto/machine.dto'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/composables/useToast'
import MachineServices from '@/services/machine.service'
import { useRoute } from 'vue-router'
import { useMachine } from '@/composables/useMachine'
import { loadingWebsocket, sendMessage, timelineMachines } from '@/composables/useWebsocket'

const { selectedMachine, machineName } = defineProps<{
  selectedMachine?: ObjMachineTimeline
  machineName: string
}>()

const visibleDialogForm = defineModel<boolean>('visibleDialogForm', {
  required: true
})

const { selectedOneMachine } = useMachine()

const toast = useToast()
const route = useRoute()

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

const fetchTimelineByMachineId = async (machine_id: number) => {
  try {
    loadingWebsocket.value = true
    const { data } = await MachineServices.getTimelineByMachineId(machine_id)
    timelineMachines.value = data.data
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loadingWebsocket.value = false
  }
}

const handleEditDescription = async () => {
  try {
    if (!selectedMachine || !inputDescription.value?.trim()) return
    const payload: EditLogDescription = {
      description: inputDescription.value,
      id: selectedMachine?.id as number
    }
    const { data } = await MachineServices.patchMachineLogDescription(payload)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: data.message
    })

    // refetch
    switch (route.name) {
      case 'timeline':
        console.log('refetch all')
        return sendMessage({
          type: 'timeline'
        })
      case 'transferFile':
        console.log('refecth 1')
        return fetchTimelineByMachineId(selectedOneMachine.value?.id as number)
    }

    // refetch by id(in transfer file)
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    visibleDialogForm.value = false
  }
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
          autofocus
          editable
          auto-option-focus
          class="w-full"
          @keydown.enter="handleEditDescription"
        />
        <Button label="Submit" @click="handleEditDescription" />
      </div>
    </template>
  </DialogForm>
</template>
