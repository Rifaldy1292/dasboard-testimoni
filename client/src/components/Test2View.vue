<script setup lang="ts">
import { ref, computed } from 'vue'
import { DataTable, Column, ColumnGroup, Row } from 'primevue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

// Define types
interface ShiftTime {
  start: string | null
  end: string | null
}

interface DummyData {
  // name is machine name
  name: string
  data: Array<{
    date: number
    shifts: {
      shift1: ShiftTime
      shift2: ShiftTime
    }
    count: {
      shift1: number | null
      shift2: number | null
      combined: number | null
    }
  }>
}

// Static data with the new structure
const machineData = ref<DummyData[]>([
  {
    name: 'MC1',
    data: [
      {
        date: 1,
        shifts: {
          shift1: { start: '6:00', end: '18:00' },
          shift2: { start: '18:00', end: '6:00' }
        },
        count: {
          shift1: 8.25,
          shift2: 7.33,
          combined: 15.58
        }
      },
      {
        date: 2,
        shifts: {
          shift1: { start: '6:00', end: '18:00' },
          shift2: { start: '18:00', end: '6:00' }
        },
        count: {
          shift1: 8.99,
          shift2: 10.26,
          combined: 19.25
        }
      }
    ]
  },
  {
    name: 'MC2',
    data: [
      {
        date: 1,
        shifts: {
          shift1: { start: '6:00', end: '18:00' },
          shift2: { start: '18:00', end: '6:00' }
        },
        count: {
          shift1: 9.25,
          shift2: 8.33,
          combined: 17.58
        }
      },
      {
        date: 2,
        shifts: {
          shift1: { start: '6:00', end: '18:00' },
          shift2: { start: '18:00', end: '6:00' }
        },
        count: {
          shift1: 9.99,
          shift2: 11.26,
          combined: 21.25
        }
      }
    ]
  },
  // Add more machines with similar structure
  {
    name: 'MC3',
    data: [
      {
        date: 1,
        shifts: {
          shift1: { start: '6:00', end: '18:00' },
          shift2: { start: '18:00', end: '6:00' }
        },
        count: {
          shift1: 10.25,
          shift2: 9.33,
          combined: 19.58
        }
      },
      {
        date: 2,
        shifts: {
          shift1: { start: '6:00', end: '18:00' },
          shift2: { start: '18:00', end: '6:00' }
        },
        count: {
          shift1: 10.99,
          shift2: 12.26,
          combined: 23.25
        }
      }
    ]
  }
])

// Extract days and shifts from data for table headers
const daysConfig = computed(() => {
  // Assuming all machines have the same days and shift configuration
  if (machineData.value.length === 0) return []

  return machineData.value[0].data.map((dayData) => ({
    date: dayData.date,
    shifts: dayData.shifts
  }))
})

// Transform data for DataTable compatibility
const transformedData = computed(() => {
  return machineData.value.map((machine) => {
    const result: any = { machineName: machine.name }

    // Process each day's data
    machine.data.forEach((dayData, index) => {
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
const dataColumns = computed(() => {
  const columns: any[] = []

  // Add machine name column
  columns.push({
    field: 'machineName',
    header: 'Machine',
    frozen: true,
    style: 'min-width: 100px'
  })

  // Add columns for each day and shift type (shift1, shift2, combined)
  daysConfig.value.forEach((day) => {
    const dayKey = `day${day.date}`

    // Add shift1 column
    columns.push({
      field: `${dayKey}_shift1`,
      style: 'min-width: 100px'
    })

    // Add shift2 column
    columns.push({
      field: `${dayKey}_shift2`,
      style: 'min-width: 100px'
    })
  })

  return columns
})

// Get all unique shift names (shift1, shift2) from the data
const shiftTypes = ['shift1', 'shift2']
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
          <Column header="DATE" :rowspan="3" frozen style="min-width: 100px" />
          <template v-for="day in daysConfig" :key="`day-${day.date}`">
            <Column :header="`${day.date}`" :colspan="2" />
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
            <template
              v-for="(shiftType, index) in shiftTypes"
              :key="`time-${day.date}-${shiftType}`"
            >
              <Column
                :header="`${day.shifts[shiftType]?.start} - ${day.shifts[shiftType]?.end}`"
                style="min-width: 100px"
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
