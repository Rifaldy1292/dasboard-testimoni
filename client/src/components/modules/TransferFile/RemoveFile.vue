<script setup lang="ts">
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import { useFTP } from '@/composables/useFTP'
import { useMachine } from '@/composables/useMachine'
import useToast from '@/composables/useToast'
import MachineServices from '@/services/machine.service'
import type { MachineName } from '@/types/machine.type'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import { Button, Column, DataTable, useConfirm } from 'primevue'
import { computed, ref, shallowRef, watch } from 'vue'
import { handleNullDescriptionTimeline } from './utils/handleSelectMachine.util'

const toast = useToast()
const confirm = useConfirm()

const { selectedOneMachine } = useMachine()
const { selectedAction, inputFiles } = useFTP()

type FileList = {
  fileName: string
  isDeleted: boolean
}
const fileList = ref<FileList[]>([])
const loading = shallowRef(false)

watch(
  [() => selectedOneMachine.value?.id, () => selectedAction.value],
  ([machine_id, action]) => {
    if (action !== 'Remove File') {
      inputFiles.value = []
    }
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
    fileList.value = []
    loading.value = true
    const { data } = await MachineServices.getFileList(machine_id)
    fileList.value = data.data
    // console.log(fileList.value)
  } catch (error) {
    fileList.value = []
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
}

const handleSuccessOpeeration = async (message: string): Promise<void> => {
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: message
  })
  return await fetchFileList(selectedOneMachine.value?.id as number)
}

const handleClickIcon = async (
  button: 'removeAll' | 'remove' | 'undo',
  fileName?: string
): Promise<void> => {
  try {
    loading.value = true
    await handleNullDescriptionTimeline(selectedOneMachine.value, confirm, toast, () => {
      fileList.value = []
      console.log('fileList.value', fileList.value)
    })
    const machine_id = selectedOneMachine.value?.id as number
    switch (button) {
      case 'removeAll': {
        const { data } = await MachineServices.deleteFile({ machine_id })
        return handleSuccessOpeeration(data.message)
      }
      case 'remove': {
        const { data } = await MachineServices.deleteFile({
          fileName: fileName as string,
          machine_id
        })
        return handleSuccessOpeeration(data.message)
      }
      case 'undo': {
        const { data } = await MachineServices.undoDeleteFile({
          fileName: fileName as string,
          machine_id
        })
        return handleSuccessOpeeration(data.message)
      }
    }
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
}

const handleClickButton = (button: 'removeAll' | 'remove' | 'undo', fileName?: string): void => {
  if (!fileList.value.length) return
  let header = ''
  switch (button) {
    case 'removeAll':
      header = 'Remove All Files'
      break
    case 'remove':
      header = 'Remove File'
      break
    case 'undo':
      header = 'Undo Remove File'
      break
  }
  confirm.require({
    header,
    message: 'Are you sure?',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      handleClickIcon(button, fileName)
    },
    reject: () => {},
    acceptProps: {
      label: button === 'undo' ? 'Undo' : 'Remove',
      severity: 'danger'
    },
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true
    }
  })
}

const isDisableRemoveAll = computed<boolean>(() => {
  const name = selectedOneMachine.value?.name as MachineName
  // const disabled = name !== 'MC-16' && name !== 'MC-6'
  return name !== 'MC-3'
  // return disabled
})
</script>

<template>
  <LoadingAnimation :state="loading" />
  <Button
    v-if="fileList.length"
    :disabled="isDisableRemoveAll"
    @click="handleClickButton('removeAll')"
    label="Remove All files"
    :class="`${isDisableRemoveAll && 'cursor-not-allowed'}`"
    severity="warn"
  />
  <DataTable :loading :value="fileList" :size="'large'" lazy showGridlines selection-mode="single">
    <Column header="File Name" field="fileName"> </Column>
    <Column :header="'Actions'" class="!text-end">
      <template #body="{ data }: { data: FileList }">
        <div class="flex gap-5">
          <i
            v-if="!data.isDeleted"
            v-tooltip.top="'delete'"
            @click="handleClickButton('remove', data.fileName)"
            class="pi pi-trash !text-red-500"
            style="font-size: 1rem"
          />
          <i
            v-if="data.isDeleted"
            v-tooltip.top="'undo'"
            @click="handleClickButton('undo', data.fileName)"
            class="pi pi-undo !text-blue-500"
            style="font-size: 1rem"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
