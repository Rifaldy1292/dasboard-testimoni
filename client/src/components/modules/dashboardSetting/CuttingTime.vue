<script setup lang="ts">
import useToast from '@/composables/useToast'
import { Column, DataTable, InputText, type DataTableCellEditCompleteEvent } from 'primevue'
import { inject, onMounted, shallowRef, watchEffect } from 'vue'
import SettingServices from '@/services/setting.service'
import { handleErrorAPI } from '@/utils/handleErrorAPI'

onMounted(async () => {
  await fetchStartTime()
})

type CuttingTime = { id: number; target: number; period: string }

const configs = shallowRef<CuttingTime[]>([])
const activeTab = inject('activeTab', shallowRef(0))
const toast = useToast()
const loading = shallowRef<boolean>(false)

watchEffect(async () => {
  if (activeTab.value === 1) {
    return await fetchStartTime()
  }

  configs.value = []
})

const fetchStartTime = async () => {
  try {
    loading.value = true
    const { data } = await SettingServices.getListCuttingTime()
    // console.log(data)
    configs.value = data.data
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
}

const handleEditTable = async (event: DataTableCellEditCompleteEvent) => {
  try {
    loading.value = true
    const { newData, field, newValue, data } = event as DataTableCellEditCompleteEvent & {
      newData: CuttingTime
      field: keyof CuttingTime
      newValue: string
      data: CuttingTime
    }
    if (newData) if (data[field] === +newValue) return

    await SettingServices.pacthEditCuttingTime(newData.id, { target: +newValue })
    toast.add({ severity: 'success', summary: 'Success', detail: 'Update success' })
    await fetchStartTime()
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- DataTable untuk menampilkan konfigurasi -->
  <div class="p-4">
    <DataTable
      :value="configs"
      stripedRows
      :loading
      editMode="cell"
      @cell-edit-complete="handleEditTable"
    >
      <Column field="period" header="Period"></Column>
      <Column field="target" header="Target">
        <template #editor="{ data, field }">
          <InputText v-model="data[field]" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
