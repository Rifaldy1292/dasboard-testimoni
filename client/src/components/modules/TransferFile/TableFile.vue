<script setup lang="ts">
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import { useFTP } from '@/composables/useFTP'
import { useMachine } from '@/composables/useMachine'
import useToast from '@/composables/useToast'
import MachineServices from '@/services/machine.service'
import type { Machine } from '@/types/machine.type'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import { Button, Column, DataTable } from 'primevue'
import { ref, shallowRef, watch } from 'vue'

interface Columns {
  field: string
  header: string
  sortable?: boolean
}

const toast = useToast()

const { selectedOneMachine } = useMachine()
const { selectedAction } = useFTP()

const fileList = ref<string[]>([])
const loading = shallowRef(false)

watch([() => selectedOneMachine.value?.id, () => selectedAction.value], ([machine_id, action]) => {
  if (machine_id && action === 'Remove File') {
    fetchFileList(machine_id)
  } else {
    fileList.value = []
  }
})

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

const columns: Columns[] = [{ field: 'fileName', header: 'file name' }]

const handleRemoveAll = async (): Promise<void> => {
  try {
    loading.value = true
    const { data } = await MachineServices.deleteAllFiles(selectedOneMachine.value?.id as number)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: data.message
    })
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <LoadingAnimation :state="loading" />
  <Button @click="handleRemoveAll" label="Remove All files" severity="warn" />
  <DataTable :value="fileList" :size="'large'" lazy showGridlines selection-mode="single">
    <Column header="File Name" field="fileName"> </Column>
    <Column :header="'Actions'" class="!text-end">
      <template #body="{ data }: { data: Machine }">
        <div class="flex gap-3">
          <i
            v-tooltip.top="'Edit'"
            @click="console.log(data)"
            class="pi pi-pencil"
            style="font-size: 1rem"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
