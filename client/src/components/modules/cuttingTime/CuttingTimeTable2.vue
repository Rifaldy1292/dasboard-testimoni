<script setup lang="ts">
import { computed } from 'vue'
import { DataTable, Column, ColumnGroup, Row } from 'primevue'
import type { MachineInfo, ShiftInfo } from '@/types/cuttingTime.type'
import { useMachine } from '@/composables/useMachine'

// Type for transformed data that's compatible with DataTable
interface TransformedRow {
  machineName: string
  [key: string]: string | number | null
}

// Type for column definition
interface ColumnDef {
  field: string
  header?: string
  frozen?: boolean
  style?: string
}

const { cuttingTimeMachines2, loadingFetch } = useMachine()

const machineData = computed<MachineInfo[]>(() => {
  if (!cuttingTimeMachines2.value) return []
  return cuttingTimeMachines2.value.data
})

// Extract days and shifts from data for table headers
const daysConfig = computed<Array<{ date: number; shifts: ShiftInfo }>>(() => {
  // Assuming all machines have the same days and shift configuration
  if (machineData.value.length === 0) return []

  return machineData.value[0].data.map((dayData) => ({
    date: dayData.date,
    shifts: dayData.shifts
  }))
})

// Transform data for DataTable compatibility with better type safety
const transformedData = computed<TransformedRow[]>(() => {
  return machineData.value.map((machine) => {
    // Initialize with machine name
    const result: TransformedRow = {
      machineName: machine.name
    }

    // Process each day's data
    machine.data.forEach((dayData) => {
      const dayKey = `day${dayData.date}`

      // Add shift1, shift2, and combined values for this day
      result[`${dayKey}_shift1`] = dayData.count.shift1
      result[`${dayKey}_shift2`] = dayData.count.shift2
      result[`${dayKey}_combine`] = dayData.count.combine
    })

    return result
  })
})

// Generate columns dynamically based on the data structure
const dataColumns = computed<ColumnDef[]>(() => {
  const columns: ColumnDef[] = []

  // Add machine name column
  columns.push({
    field: 'machineName',
    header: 'Machine',
    frozen: true,
    style: 'min-width: 100px; text-align: center;'
  })

  // Add columns for each day and shift type (shift1, shift2)
  daysConfig.value.forEach((day) => {
    const dayKey = `day${day.date}`

    // Add shift1 column
    columns.push({
      field: `${dayKey}_shift1`,
      // text: center
      style: 'min-width: 80px; text-align: center;'
    })

    // Add shift2 column
    columns.push({
      field: `${dayKey}_shift2`,
      style: 'min-width: 80px; text-align: center;'
    })

    // Add combined column
    columns.push({
      field: `${dayKey}_combine`,
      style: 'min-width: 80px; text-align: center;'
    })
  })

  return columns
})

// Define shift types with type safety
const shiftTypes: Array<keyof ShiftInfo> = ['shift1', 'shift2', 'combine']
</script>

<template>
  <DataTable
    :value="transformedData"
    :loading="loadingFetch"
    showGridlines
    responsiveLayout="scroll"
    :scrollable="true"
    scrollDirection="both"
    @row-click="console.log($event.data)"
    size="large"
    selectionMode="multiple"
    class="p-datatable-sm"
  >
    <ColumnGroup type="header">
      <!-- Day Row -->
      <Row>
        <Column
          header="DATE & SHIFT"
          :rowspan="3"
          frozen
          style="min-width: 100px; text-align: center"
        />
        <template v-for="day in daysConfig" :key="`day-${day.date}`">
          <Column
            :colspan="3"
            style="text-align: center; justify-content: center"
            header-style="justify-content: center; align-items: center;"
          >
            <template #header>
              <div style="width: 100%; text-align: center">{{ day.date }}</div>
            </template>
          </Column>
        </template>
      </Row>

      <!-- Shift Names Row -->
      <Row>
        <template v-for="day in daysConfig" :key="`shifts-${day.date}`">
          <template v-for="shiftType in shiftTypes" :key="`${day.date}-${shiftType}`">
            <Column :header="shiftType.toUpperCase()" :colspan="1" />
          </template>
        </template>
      </Row>

      <!-- Shift Times Row -->
      <Row>
        <template v-for="day in daysConfig" :key="`times-${day.date}`">
          <template v-for="(shiftType, index) in shiftTypes" :key="`time-${day.date}-${shiftType}`">
            <Column :header="day.shifts[shiftType] || '-'" />
          </template>
        </template>
      </Row>
    </ColumnGroup>

    <!-- Dynamic data columns -->
    <template v-for="col in dataColumns" :key="col.field">
      <Column :field="col.field" :header="col.header" :frozen="col.frozen" :style="col.style" />
    </template>
  </DataTable>
</template>

<style scoped>
.p-datatable.p-datatable-sm .p-datatable-thead > tr > th,
.p-datatable.p-datatable-sm .p-datatable-tbody > tr > td {
  padding: 0.3rem 0.5rem;
}
</style>
