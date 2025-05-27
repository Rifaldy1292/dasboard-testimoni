<script setup lang="ts">
import { computed } from 'vue'
import { DataTable, Column, ColumnGroup, Row } from 'primevue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

// Enhanced types with better type safety
interface ShiftInfo {
  combine: string
  shift1: string
  shift2: string
}

interface CountInfo {
  shift1: number
  shift2: number
  combined: number
}

interface DayData {
  date: number
  shifts: ShiftInfo
  count: CountInfo
}

interface MachineInfo {
  name: string
  data: DayData[]
}

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

const { machineData } = defineProps<{
  machineData: MachineInfo[]
}>()

// Extract days and shifts from data for table headers
const daysConfig = computed<Array<{ date: number; shifts: ShiftInfo }>>(() => {
  // Assuming all machines have the same days and shift configuration
  if (machineData.length === 0) return []

  return machineData[0].data.map((dayData) => ({
    date: dayData.date,
    shifts: dayData.shifts
  }))
})

// Transform data for DataTable compatibility with better type safety
const transformedData = computed<TransformedRow[]>(() => {
  return machineData.map((machine) => {
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
      result[`${dayKey}_combined`] = dayData.count.combined
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
      style: 'min-width: 150px; text-align: center;'
    })

    // Add shift2 column
    columns.push({
      field: `${dayKey}_shift2`,
      style: 'min-width: 150px; text-align: center;'
    })
  })

  return columns
})

// Define shift types with type safety
const shiftTypes: Array<keyof ShiftInfo> = ['shift1', 'shift2']
</script>

<template>
  <DefaultLayout>
    <DataTable
      :value="transformedData"
      showGridlines
      responsiveLayout="scroll"
      class="p-datatable-sm"
    >
      <ColumnGroup type="header">
        <!-- Day Row -->
        <Row>
          <Column header="DATE" :rowspan="3" frozen style="min-width: 100px; text-align: center" />
          <template v-for="day in daysConfig" :key="`day-${day.date}`">
            <Column :header="`${day.date}`" :colspan="2" style="text-align: center" />
          </template>
        </Row>

        <!-- Shift Names Row -->
        <Row>
          <template v-for="day in daysConfig" :key="`shifts-${day.date}`">
            <template v-for="shiftType in shiftTypes" :key="`${day.date}-${shiftType}`">
              <Column :header="shiftType.toUpperCase()" :colspan="1" style="text-align: center" />
            </template>
          </template>
        </Row>

        <!-- Shift Times Row -->
        <Row>
          <template v-for="day in daysConfig" :key="`times-${day.date}`">
            <template
              v-for="(shiftType, index) in shiftTypes"
              :key="`time-${day.date}-${shiftType}`"
            >
              <Column
                :header="day.shifts[shiftType]"
                style="min-width: 100px; text-align: center"
              />
            </template>
          </template>
        </Row>
      </ColumnGroup>

      <!-- Dynamic data columns -->
      <template v-for="col in dataColumns" :key="col.field">
        <Column :field="col.field" :header="col.header" :frozen="col.frozen" :style="col.style" />
      </template>
    </DataTable>
  </DefaultLayout>
</template>

<style scoped>
.p-datatable.p-datatable-sm .p-datatable-thead > tr > th,
.p-datatable.p-datatable-sm .p-datatable-tbody > tr > td {
  padding: 0.3rem 0.5rem;
}
</style>
