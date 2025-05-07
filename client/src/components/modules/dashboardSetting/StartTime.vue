<script setup lang="ts">
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/composables/useToast'
import { Column, DataTable, InputText, type DataTableCellEditCompleteEvent } from 'primevue'
import { inject, ref, shallowRef, watchEffect } from 'vue'
import SettingServices from '@/services/setting.service'
import type { DailyConfig } from '@/types/dailyConfig.type'
import DatePickerMonth from '@/components/common/DatePickerMonth.vue'

type TableField = keyof Omit<DailyConfig, 'id'>
type TableCollumn = {
  field: TableField
  header: string
  sortable?: boolean
}

const columns: TableCollumn[] = [
  { field: 'date', header: 'Date' },
  { field: 'startFirstShift', header: 'Start 1' },
  { field: 'endFirstShift', header: 'End 1' },
  { field: 'startSecondShift', header: 'Start 2' },
  { field: 'endSecondShift', header: 'End 2' }
]

const toast = useToast()
const configs = ref<DailyConfig[]>([])
const activeTab = inject('activeTab', shallowRef(0))
const selectedMonth = shallowRef<Date>(new Date())
const loading = shallowRef<boolean>(false)

const fetchDailyConfig = async (date: Date) => {
  try {
    loading.value = true
    const { data } = await SettingServices.getListConfig({
      period: date.toISOString()
    })
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
    const { newData, field, newValue } = event as {
      newData: DailyConfig
      field: TableField
      newValue: string
    }
    const { data } = await SettingServices.patchDailyConfig({
      id: newData.id,
      field,
      value: newValue
    })
    toast.add({ severity: 'success', summary: 'Success', detail: data.message })
    await fetchDailyConfig(selectedMonth.value)
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
}

watchEffect(() => {
  if (activeTab.value === 0) {
    return fetchDailyConfig(selectedMonth.value)
  }
  configs.value = []
})
</script>

<template>
  <div class="mb-0.5 p-5 flex justify-between">
    <DatePickerMonth v-model:month-value="selectedMonth" />
  </div>

  <!-- DataTable untuk menampilkan konfigurasi -->
  <div class="p-4">
    <DataTable
      :value="configs"
      stripedRows
      editable
      editMode="cell"
      :loading="loading"
      lazy
      @cell-edit-complete="handleEditTable"
    >
      <Column v-for="col in columns" :field="col.field" :header="col.header" :key="col.field">
        <template v-if="col.field !== 'date'" #editor="{ data, field }">
          <InputText v-model="data[field]" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
