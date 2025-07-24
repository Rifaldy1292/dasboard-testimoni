<script setup lang="ts">
import useToast from '@/composables/useToast'
import { Column, DataTable, InputNumber, type DataTableCellEditCompleteEvent } from 'primevue'
import { inject, onMounted, shallowRef, watchEffect } from 'vue'
import SettingServices from '@/services/setting.service'
import { handleErrorAPI } from '@/utils/handleErrorAPI'

onMounted(async () => {
  await fetchStartTime()
})

type CuttingTime = { 
  id: number; 
  target: number; 
  target_shift: { green: number; yellow: number; red: number }; 
  period: string 
}

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
      field: keyof CuttingTime | string
      newValue: string | number
      data: CuttingTime
    }
    
    // Handle different field types
    let updateBody: { target?: number; target_shift?: { green: number; yellow: number; red: number } } = {}
    
    if (field === 'target') {
      if (data[field] === +newValue) return
      updateBody.target = +newValue
    } else if (field?.startsWith('target_shift.')) {
      const shiftField = field.split('.')[1] as 'green' | 'yellow' | 'red'
      if (data.target_shift[shiftField] === +newValue) return
      updateBody.target_shift = { ...data.target_shift, [shiftField]: +newValue }
    }

    await SettingServices.pacthEditCuttingTime(newData.id, updateBody)
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
      <Column field="target" header="Target (Monthly)">
        <template #editor="{ data, field }">
          <InputNumber v-model="data[field]" :min="1" />
        </template>
      </Column>
      
      <!-- Target Shift columns -->
      <Column field="target_shift.green" header="Target Green (≥)">
        <template #body="{ data }">
          <span class="inline-flex items-center gap-1">
            <div class="w-3 h-3 rounded bg-green-500"></div>
            {{ data.target_shift.green }}
          </span>
        </template>
        <template #editor="{ data }">
          <InputNumber v-model="data.target_shift.green" :min="1" :max="100" />
        </template>
      </Column>
      
      <Column field="target_shift.yellow" header="Target Yellow (≥)">
        <template #body="{ data }">
          <span class="inline-flex items-center gap-1">
            <div class="w-3 h-3 rounded bg-yellow-500"></div>
            {{ data.target_shift.yellow }}
          </span>
        </template>
        <template #editor="{ data }">
          <InputNumber v-model="data.target_shift.yellow" :min="1" :max="100" />
        </template>
      </Column>
      
      <Column field="target_shift.red" header="Target Red (<)">
        <template #body="{ data }">
          <span class="inline-flex items-center gap-1">
            <div class="w-3 h-3 rounded bg-red-500"></div>
            {{ data.target_shift.red }}
          </span>
        </template>
        <template #editor="{ data }">
          <InputNumber v-model="data.target_shift.red" :min="1" :max="100" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
