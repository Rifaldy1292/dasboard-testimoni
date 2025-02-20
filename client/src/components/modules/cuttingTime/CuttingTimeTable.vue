<script setup lang="ts">
import { useMachine } from '@/composables/useMachine'
import type { cuttingTimeInMonth } from '@/types/machine.type'
import { Column, DataTable, Divider } from 'primevue'
import { computed } from 'vue'

const { loadingFetch, cuttingTimeMachines } = useMachine()

type Obj = {
  data: number
  actual?: number
}

/**
 * 
 * @return example: 
 * {
   name: 'Machine 1',
   1: { actual: 30, data: 10 },
   2: { actual: 40, data: 20 }
 }
 */
type FormatValueDataTable = { name: string } & Record<number, Obj>

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
</script>

<template>
  <DataTable
    :value="dataTableValue?.value"
    :loading="loadingFetch"
    :scrollable="true"
    size="small"
    lazy
    showGridlines
    row-group-mode="rowspan"
    group-rows-by="name"
    selection-mode="multiple"
  >
    <template v-for="col of dataTableValue?.key" :key="col">
      <Column :field="col" :header="col" class="text-center items-center">
        <template v-if="col !== 'name'" #body="{ data }: { data: any }">
          <span>{{ data[col].data }}</span>
          <template
            v-if="typeof data[col].actual === 'number' || typeof data[col].actual === 'string'"
          >
            <Divider />
            <span :style="{ color: getColorColumn(data[col].actual) }">{{ data[col].actual }}</span>
          </template>
        </template>
      </Column>
    </template>
  </DataTable>
</template>
