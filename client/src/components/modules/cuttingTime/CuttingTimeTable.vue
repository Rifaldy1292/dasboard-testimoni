<script setup lang="ts">
import Test2View from '@/components/Test2View.vue'
import { useMachine } from '@/composables/useMachine'
import type { cuttingTimeInMonth } from '@/types/machine.type'
import { Column, DataTable, Divider, Button } from 'primevue'
import { computed, ref } from 'vue'
import * as XLSX from 'xlsx'

type Obj = {
  data: number
  actual?: number
}

/**
 * 
 * @example 
 * {
   name: 'Machine 1',
   1: { actual: 30, data: 10 },
   2: { actual: 40, data: 20 }
 }
 */
type FormatValueDataTable = { name: string } & Record<number, Obj>

const { loadingFetch, cuttingTimeMachines } = useMachine()

const dataTableValue = computed<{ key: string[]; value: FormatValueDataTable[] } | undefined>(
  () => {
    if (!cuttingTimeMachines.value) return undefined
    const { allDayInMonth, cuttingTimeInMonth } = cuttingTimeMachines.value
    const stringAllDay = allDayInMonth.map((item) => item.toString())
    const key: string[] = ['name', ...stringAllDay]
    const value: FormatValueDataTable[] = cuttingTimeInMonth.map((item) =>
      formatValueDataTable(item)
    )
    return { key, value }
  }
)

function formatValueDataTable(cuttingTimeInMonth: cuttingTimeInMonth): FormatValueDataTable {
  const result: FormatValueDataTable = { name: cuttingTimeInMonth.name }

  cuttingTimeInMonth.data.forEach((item, index) => {
    result[index + 1] = {
      ...result[index + 1],
      data: item
    }
  })
  cuttingTimeInMonth.actual?.forEach((item, index) => {
    result[index + 1].actual = item
  })
  return result
}

const getColorColumn = (value: number) => {
  // green
  if (value >= 16) return '#22c55e'
  // yellow
  if (value >= 14) return '#f59e0b'
  // red
  if (value < 14) return '#ef4444'
}

const dt = ref()

const exportCSV = () => {
  dt.value?.exportCSV()
}

const exportXLSX = () => {
  if (!dataTableValue.value) return

  const exportData = dataTableValue.value.value.map((row) => {
    const formattedRow: Record<string, any> = {}
    dataTableValue.value?.key.forEach((key) => {
      if (key === 'name') {
        formattedRow[key] = row.name
      } else {
        const numCol = parseInt(key)
        if (!isNaN(numCol) && row[numCol]) {
          formattedRow[key] = row[numCol].data
        }
      }
    })
    return formattedRow
  })

  const worksheet = XLSX.utils.json_to_sheet(exportData, {
    header: dataTableValue.value.key
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cutting Time Data')

  XLSX.writeFile(workbook, `cutting_time_report_${new Date().toISOString().split('T')[0]}.xlsx`)
}
</script>

<template>
  <div class="cutting-time-table-container">
    <div class="mb-4 flex justify-end gap-2">
      <Button v-show="false" label="Export CSV" icon="pi pi-download" @click="exportCSV" />
      <Button
        label="Export Excel"
        icon="pi pi-file-excel"
        class="p-button-success"
        @click="exportXLSX"
      />
    </div>
    <DataTable
      ref="dt"
      :value="dataTableValue?.value"
      :loading="loadingFetch"
      :scrollable="true"
      scrollDirection="both"
      size="large"
      lazy
      showGridlines
      row-group-mode="rowspan"
      group-rows-by="name"
      selection-mode="multiple"
    >
      <template v-for="col of dataTableValue?.key" :key="col">
        <Column
          :field="col"
          :header="col"
          class="text-center items-center"
          :frozen="col === 'name'"
          :style="col === 'name' ? 'left: 0; z-index: 1' : ''"
        >
          <template v-if="col !== 'name'" #body="{ data }: { data: any }">
            <span>{{ data[col].data }}</span>
            <template
              v-if="typeof data[col].actual === 'number' || typeof data[col].actual === 'string'"
            >
              <Divider />
              <span :style="{ color: getColorColumn(data[col].actual) }">{{
                data[col].actual
              }}</span>
            </template>
          </template>
        </Column>
      </template>
    </DataTable>
  </div>
  <Test2View />
</template>

<style scoped>
.cutting-time-table-container {
  position: relative;
  height: 100%;
}

:deep(.p-datatable-wrapper) {
  position: relative;
}

/* Membuat header tetap (sticky) saat scroll vertikal */
:deep(.p-datatable-thead) {
  position: sticky;
  top: 0;
  z-index: 2;
}

:deep(.p-datatable-thead th) {
  position: sticky;
  top: 0;
  z-index: 2;
}

/* Meningkatkan z-index untuk kolom yang di-freeze agar tetap di atas */
:deep(.p-datatable-frozen-column) {
  z-index: 3 !important;
  font-weight: bold;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
}

/* Khusus untuk header kolom yang di-freeze */
:deep(.p-datatable-frozen-column.p-datatable-thead th) {
  z-index: 4 !important;
}

/* Memastikan konten tabel tidak menutupi header saat scroll */
:deep(.p-datatable-tbody) {
  position: relative;
  z-index: 1;
}
</style>
