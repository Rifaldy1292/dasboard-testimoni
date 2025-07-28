<script setup lang="ts">
import { computed, ref } from 'vue'
import { DataTable, Column, ColumnGroup, Row, Divider, Button } from 'primevue'
import type { MachineInfo, ShiftInfo } from '@/types/cuttingTime.type'
import { useMachine } from '@/composables/useMachine'
import CuttingTimeTarget from './CuttingTimeTarget.vue'
import * as XLSX from 'xlsx'
import useToast from '@/composables/useToast'

// Type for transformed data that's compatible with DataTable
interface TransformedRow {
  [key: string]:
    | {
        data: number
        combine: number
        calculate: number
      }
    | string
  machineName: string
}

// Type for column definition
interface ColumnDef {
  field: string
  header?: string
  frozen?: boolean
  style?: string
}

const toast = useToast()
const { cuttingTimeMachines, loadingFetch, colorThresholds } = useMachine()

// Define shift types with type safety
const shiftTypes: Array<keyof ShiftInfo> = ['shift1', 'shift2']

const machineData = computed<MachineInfo[]>(() => {
  if (!cuttingTimeMachines.value) return []
  return cuttingTimeMachines.value.data
})

// Extract days and shifts from data for table headers
const daysConfig = computed<Array<{ date: number; shifts: ShiftInfo }>>(() => {
  // Assuming all machines have the same days and shift configuration
  if (machineData.value.length <= 1) return []

  return machineData.value[1].data.map((dayData) => ({
    date: dayData.date,
    shifts: dayData.shifts
  }))
})

// Transform data for DataTable compatibility with better type safety
const transformedData = computed<TransformedRow[]>(() => {
  return machineData.value.map((machine) => {
    // Initialize with machine name
    const result: Partial<TransformedRow> = {
      machineName: machine.name
    }

    // Process each day's data
    machine.data.forEach((dayData) => {
      const dayKey = `day${dayData.date}`
      const calculate = dayData.count.calculate.combine
      const combine = dayData.count.combine

      // Add shift1, shift2, and combined values for this day
      // result[`${dayKey}_shift1`] = dayData.count.shift1
      result[`${dayKey}_shift1`] = {
        data: dayData.count.shift1,
        combine,
        calculate
      }
      result[`${dayKey}_shift2`] = {
        data: dayData.count.shift2,
        combine,
        calculate
      }
      // result[`${dayKey}_shift2`] = dayData.count.shift2
      // result[`${dayKey}_combine`] = dayData.count.calculate.combine
    })

    return result as TransformedRow
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
  })

  return columns
})

function isShiftField(field: string): boolean {
  return field.endsWith('_shift1') || field.endsWith('_shift2')
}

const getColorColumn = (value: number) => {
  // green
  if (value >= colorThresholds.value.green) return '#22c55e'
  // yellow
  if (value >= colorThresholds.value.yellow) return '#f59e0b'
  // red
  if (value < colorThresholds.value.red) return '#ef4444'
}

// Export function dengan format yang sama seperti di web
const exportXLSX = () => {
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Prepare header structure seperti di web
    const worksheetData: any[][] = []

    // Header Row 1: DATE & SHIFT dan tanggal
    const headerRow1 = ['DATE & SHIFT']
    daysConfig.value.forEach((day) => {
      headerRow1.push(day.date.toString(), '') // Colspan 2 untuk setiap tanggal
    })
    worksheetData.push(headerRow1)

    // Header Row 2: Kosong di kolom pertama, SHIFT1 dan SHIFT2
    const headerRow2 = ['']
    daysConfig.value.forEach(() => {
      headerRow2.push('SHIFT1', 'SHIFT2')
    })
    worksheetData.push(headerRow2)

    // Header Row 3: Kosong di kolom pertama, waktu shift
    const headerRow3 = ['']
    daysConfig.value.forEach((day) => {
      const shift1Time = day.shifts.shift1 || '06:00-18:00'
      const shift2Time = day.shifts.shift2 || '18:00-06:00'
      headerRow3.push(shift1Time, shift2Time)
    })
    worksheetData.push(headerRow3)

    // Data rows
    transformedData.value.forEach((row) => {
      // Row untuk calculate values (baris atas)
      const calculateRow = [row.machineName]
      daysConfig.value.forEach((day) => {
        const shift1Key = `day${day.date}_shift1`
        const shift2Key = `day${day.date}_shift2`

        const shift1Data = row[shift1Key] as { data: number; combine: number; calculate: number }
        const shift2Data = row[shift2Key] as { data: number; combine: number; calculate: number }

        calculateRow.push(
          shift1Data?.calculate.toString() || '0',
          shift2Data?.calculate.toString() || '0'
        )
      })
      worksheetData.push(calculateRow)

      // Row untuk data values (baris bawah) - hanya jika bukan TARGET
      if (row.machineName !== 'TARGET') {
        const dataRow = [''] // Empty machine name untuk baris kedua
        daysConfig.value.forEach((day) => {
          const shift1Key = `day${day.date}_shift1`
          const shift2Key = `day${day.date}_shift2`

          const shift1Data = row[shift1Key] as { data: number; combine: number; calculate: number }
          const shift2Data = row[shift2Key] as { data: number; combine: number; calculate: number }

          dataRow.push(shift1Data?.data.toString() || '0', shift2Data?.data.toString() || '0')
        })
        worksheetData.push(dataRow)
      }
    })

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Merge cells untuk header (colspan simulation)
    const merges = []

    // Merge "DATE & SHIFT" cell (A1:A3)
    merges.push({ s: { r: 0, c: 0 }, e: { r: 2, c: 0 } })

    // Merge tanggal cells (setiap tanggal span 2 kolom)
    daysConfig.value.forEach((day, index) => {
      const startCol = 1 + index * 2
      const endCol = startCol + 1
      merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: endCol } })
    })

    worksheet['!merges'] = merges

    // Set column widths
    const columnWidths = [
      { wch: 15 }, // Machine Name column
      ...Array(daysConfig.value.length * 2).fill({ wch: 12 }) // Data columns
    ]
    worksheet['!cols'] = columnWidths

    // Apply styling untuk header rows
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

    for (let row = 0; row <= 2; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        if (!worksheet[cellAddress]) continue

        worksheet[cellAddress].s = {
          font: { bold: true },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: 'E5E7EB' } },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      }
    }

    // Apply data cell styling dengan color coding
    for (let row = 3; row <= range.e.r; row++) {
      for (let col = 1; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        if (!worksheet[cellAddress]) continue

        const cellValue = worksheet[cellAddress].v
        let fontColor = '000000' // default black

        // Apply color coding berdasarkan nilai
        if (typeof cellValue === 'number') {
          if (cellValue >= colorThresholds.value.green) {
            fontColor = '22C55E' // green
          } else if (cellValue >= colorThresholds.value.yellow) {
            fontColor = 'F59E0B' // yellow
          } else if (cellValue < colorThresholds.value.red) {
            fontColor = 'EF4444' // red
          }
        }

        worksheet[cellAddress].s = {
          font: { color: { rgb: fontColor } },
          alignment: { horizontal: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cutting Time Data')

    // Generate filename dengan tanggal
    const currentDate = new Date().toISOString().split('T')[0]
    const filename = `cutting-time-data-${currentDate}.xlsx`

    // Export file
    XLSX.writeFile(workbook, filename)
    toast.add({
      severity: 'success',
      summary: 'Export Successful',
      detail: `${filename} exported successfully `,
      life: 3000
    })

    // console.log('Excel file exported successfully dengan format yang sama seperti web')
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    alert('Terjadi kesalahan saat mengexport data ke Excel')
  }
}

const getTableHeight = computed(() => {
  const screenHeight = window.innerHeight
  // console.log(screenHeight, 999)

  // For different screen sizes
  if (screenHeight >= 1440) {
    // 4K or large monitors
    return 'calc(100vh - 120px)'
  } else if (screenHeight >= 1080) {
    // Full HD monitors
    return 'calc(100vh - 150px)'
  } else if (screenHeight >= 900) {
    // Laptop screens
    return 'calc(100vh - 180px)'
  } else {
    // Small screens
    return '100vh'
  }
})
</script>

<template>
  <CuttingTimeTarget v-model="colorThresholds" />
  <DataTable
    :value="transformedData"
    :loading="loadingFetch"
    :stickyHeader="true"
    :scroll-height="getTableHeight"
    showGridlines
    responsiveLayout="scroll"
    :scrollable="true"
    scrollDirection="both"
    size="large"
    selectionMode="multiple"
    class="p-datatable-sm"
  >
    <template #header>
      <div class="flex justify-end align-items-center">
        <Button
          label="Export Excel"
          icon="pi pi-file-excel"
          class="p-button-success flex"
          @click="exportXLSX"
        />
      </div>
    </template>
    <ColumnGroup type="header">
      <!-- Day Row -->
      <Row>
        <Column
          header="DATE & SHIFT"
          :rowspan="3"
          frozen
          class="text-xl font-extrabold"
          style="min-width: 100px; text-align: center"
        />
        <template v-for="day in daysConfig" :key="`day-${day.date}`">
          <Column
            :colspan="2"
            style="text-align: center; justify-content: center"
            header-style="justify-content: center; align-items: center;"
          >
            <template #header>
              <div class="text-xl font-extrabold" style="width: 100%; text-align: center">
                {{ day.date }}
              </div>
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
          <template v-for="shiftType in shiftTypes" :key="`time-${day.date}-${shiftType}`">
            <Column :header="day.shifts[shiftType] || '-'" />
          </template>
        </template>
      </Row>
    </ColumnGroup>

    <!-- Dynamic data columns -->
    <template v-for="col in dataColumns" :key="col.field">
      <Column :field="col.field" :header="col.header" :frozen="col.frozen" :style="col.style">
        <template #body="{ data }">
          <!-- Machine Name -->
          <span v-if="col.field === 'machineName'">{{ data[col.field] }}</span>
          <div v-if="isShiftField(col.field)" :title="`combine: ${data[col.field].combine} `">
            <!-- Calculation -->
            <span>{{ data[col.field].calculate }}</span>
            <Divider v-if="data.machineName !== 'TARGET'" />
            <!-- Data -->
            <span :style="{ color: getColorColumn(data[col.field].data) }">{{
              data[col.field].data
            }}</span>
          </div>
        </template>
      </Column>
    </template>
  </DataTable>
</template>

<style scoped>
.p-datatable.p-datatable-sm .p-datatable-thead > tr > th,
.p-datatable.p-datatable-sm .p-datatable-tbody > tr > td {
  padding: 0.3rem 0.5rem;
}
</style>
