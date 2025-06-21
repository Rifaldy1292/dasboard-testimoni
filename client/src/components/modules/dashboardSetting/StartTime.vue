<script setup lang="ts">
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/composables/useToast'
import {
  Button,
  Column,
  DataTable,
  InputText,
  useConfirm,
  type DataTableCellEditCompleteEvent
} from 'primevue'
import { inject, ref, shallowRef, watchEffect } from 'vue'
import SettingServices from '@/services/setting.service'
import type { DailyConfig } from '@/types/dailyConfig.type'
import DatePickerMonth from '@/components/common/DatePickerMonth.vue'
import CreateDailyConfigModal from './CreateDailyConfigModal.vue'

type TableField = keyof Omit<DailyConfig, 'id'>
type TableCollumn = {
  field: TableField
  header: string
  sortable?: boolean
}

const toast = useToast()
const confirm = useConfirm()

const columns: TableCollumn[] = [
  { field: 'date', header: 'Date', sortable: true },
  { field: 'startFirstShift', header: 'Start 1' },
  { field: 'endFirstShift', header: 'End 1' },
  { field: 'startSecondShift', header: 'Start 2' },
  { field: 'endSecondShift', header: 'End 2' }
]

const configs = ref<DailyConfig[]>([])
const activeTab = inject('activeTab', shallowRef(0))
const selectedMonth = shallowRef<Date>(new Date())
const loading = shallowRef<boolean>(false)
const showCreateModal = ref<boolean>(false)

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
    const { newData, field, newValue, data } = event as DataTableCellEditCompleteEvent & {
      newData: DailyConfig
      field: TableField
      newValue: string
      data: DailyConfig
    }
    if (newData) if (data[field] === newValue) return

    await SettingServices.patchDailyConfig({
      id: newData.id,
      field,
      value: newValue
    })
    toast.add({ severity: 'success', summary: 'Success', detail: 'Update success' })
    await fetchDailyConfig(selectedMonth.value)
    if (new Date(data.date as string).toLocaleDateString() === new Date().toLocaleDateString()) {
      confirm.require({
        header: 'Restart PC',
        message: 'Please restart your PC to apply the changes',
        icon: 'pi pi-info-circle',
        acceptProps: {
          label: 'Okay',
          severity: 'success'
        },
        rejectProps: {
          label: 'Later',
          severity: 'secondary',
          outlined: true
        }
      })
    }
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
}

const openDeleteConfirmation = (config: DailyConfig) => {
  confirm.require({
    header: `Delete ${config.date} ?`,
    message: 'Are you sure ?',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        loading.value = true
        await SettingServices.deleteDailyConfig(config.id)
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Configuration deleted successfully'
        })
        await fetchDailyConfig(selectedMonth.value)
      } catch (error) {
        handleErrorAPI(error, toast)
      } finally {
        loading.value = false
      }
    },
    acceptProps: {
      label: 'Yes',
      severity: 'danger'
    },
    rejectProps: {
      label: 'No',
      severity: 'secondary',
      outlined: true
    }
  })
}

const handleCreateSuccess = () => {
  fetchDailyConfig(selectedMonth.value)
  showCreateModal.value = false
}

watchEffect(() => {
  if (activeTab.value === 0) {
    return fetchDailyConfig(selectedMonth.value)
  }
  configs.value = []
})
</script>

<template>
  <CreateDailyConfigModal
    v-model:visible="showCreateModal"
    :selected-month="selectedMonth"
    @create-success="handleCreateSuccess"
  />
  <div class="mb-0.5 p-5 flex justify-between items-center">
    <DatePickerMonth v-model:month-value="selectedMonth" />
    <Button
      icon="pi pi-plus"
      label="Add Config"
      severity="success"
      @click="showCreateModal = true"
    />
  </div>

  <!-- DataTable untuk menampilkan konfigurasi -->
  <div class="p-4">
    <DataTable
      :value="configs"
      stripedRows
      editable
      editMode="cell"
      :loading="loading"
      @cell-edit-complete="handleEditTable"
    >
      <template #empty> No configurations found </template>
      <Column v-for="col in columns" v-bind="col" :key="col.field">
        <template v-if="col.field !== 'date'" #editor="{ data, field }">
          <InputText v-model="data[field]" />
        </template>
      </Column>
      <Column header="Actions" :exportable="false" style="min-width: 8rem">
        <template #body="{ data }">
          <Button
            v-tooltip="`Delete ${data.date}`"
            icon="pi pi-trash"
            severity="danger"
            rounded
            aria-label="Delete"
            @click="openDeleteConfirmation(data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
