<script setup lang="ts">
import { useFTP } from '@/composables/useFTP'
import { useMachine } from '@/composables/useMachine'
import useToast from '@/composables/useToast'
import MachineServices from '@/services/machine.service'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import { Button, Column, DataTable, useConfirm } from 'primevue'
import { ref, shallowRef, watch } from 'vue'

const toast = useToast()
const confirm = useConfirm()

const { selectedOneMachine } = useMachine()
const { selectedAction } = useFTP()

const fileList = ref<string[]>([])
const loading = shallowRef(false)

watch(
  [() => selectedOneMachine.value?.id, () => selectedAction.value],
  ([machine_id, action]) => {
    console.log(123)
    if (machine_id && action === 'Remove File') {
      fetchFileList(machine_id)
    } else {
      fileList.value = []
    }
  },
  { deep: true }
)

const fetchFileList = async (machine_id: number): Promise<void> => {
  try {
    loading.value = true
    const { data } = await MachineServices.getFileList(machine_id)
    fileList.value = data.data
    console.log(fileList.value)
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
}

const handleRemoveFile = async (
  button: 'removeAll' | 'remove',
  fileName?: string
): Promise<void> => {
  try {
    loading.value = true
    let message = ''
    if (button === 'removeAll') {
      const { data } = await MachineServices.deleteFile({
        machine_id: selectedOneMachine.value?.id as number
      })
      message = data.message
    } else {
      const { data } = await MachineServices.deleteFile({
        fileName: fileName as string,
        machine_id: selectedOneMachine.value?.id as number
      })
      message = data.message
    }
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: message
    })

    fetchFileList(selectedOneMachine.value?.id as number)
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
}

const handleClickButton = (button: 'removeAll' | 'remove', fileName?: string): void => {
  if (!fileList.value.length) return
  const header =
    button === 'removeAll'
      ? `Remove All file from ${selectedOneMachine.value?.name}`
      : `Remove file ${fileName} from ${selectedOneMachine.value?.name}`
  confirm.require({
    header,
    message: 'This action cannot be undo',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      handleRemoveFile(button, fileName)
    },
    reject: () => {},
    acceptProps: {
      label: 'Remove',
      severity: 'danger'
    },
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    }
  })
}
</script>

<template>
  <Button
    v-if="fileList.length"
    @click="handleClickButton('removeAll')"
    label="Remove All files"
    severity="warn"
  />
  <DataTable :loading :value="fileList" :size="'large'" lazy showGridlines selection-mode="single">
    <Column header="File Name" field="fileName"> </Column>
    <Column :header="'Actions'" class="!text-end">
      <template #body="{ data }: { data: { fileName: string } }">
        <div class="flex gap-3">
          <i
            v-tooltip.top="'delete'"
            @click="handleClickButton('remove', data.fileName)"
            class="pi pi-trash !text-red-500"
            style="font-size: 1rem"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
