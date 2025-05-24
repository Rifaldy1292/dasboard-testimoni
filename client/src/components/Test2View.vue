<script setup lang="ts">
import { ref } from 'vue'
import { DataTable, Column, ColumnGroup, Row } from 'primevue'

interface MachineData {
  machine: string
  day1_shift1_start: number
  day1_shift1_end: number
  day1_shift2_start: number
  day1_shift2_end: number
  day2_shift1_start: number
  day2_shift1_end: number
  day2_shift2_start: number
  day2_shift2_end: number
}

const machineData = ref<MachineData[]>([
  {
    machine: 'MC1',
    day1_shift1_start: 8.25,
    day1_shift1_end: 18.0,
    day1_shift2_start: 7.33,
    day1_shift2_end: 6.0,
    day2_shift1_start: 8.99,
    day2_shift1_end: 18.0,
    day2_shift2_start: 10.26,
    day2_shift2_end: 6.0
  },
  {
    machine: 'MC2',
    day1_shift1_start: 9.25,
    day1_shift1_end: 18.0,
    day1_shift2_start: 8.33,
    day1_shift2_end: 6.0,
    day2_shift1_start: 9.99,
    day2_shift1_end: 18.0,
    day2_shift2_start: 11.26,
    day2_shift2_end: 6.0
  },
  {
    machine: 'MC3',
    day1_shift1_start: 10.25,
    day1_shift1_end: 18.0,
    day1_shift2_start: 9.33,
    day1_shift2_end: 6.0,
    day2_shift1_start: 10.99,
    day2_shift1_end: 18.0,
    day2_shift2_start: 12.26,
    day2_shift2_end: 6.0
  },
  {
    machine: 'MC4',
    day1_shift1_start: 10.26,
    day1_shift1_end: 18.0,
    day1_shift2_start: 10.33,
    day1_shift2_end: 6.0,
    day2_shift1_start: 11.99,
    day2_shift1_end: 18.0,
    day2_shift2_start: 10.26,
    day2_shift2_end: 6.0
  }
])
</script>

<template>
  <div class="p-4">
    <DataTable
      :value="machineData"
      responsiveLayout="scroll"
      scrollable
      showGridlines
      scrollHeight="500px"
    >
      <!-- Multi Header Group -->
      <ColumnGroup type="header">
        <Row>
          <Column header="DATE / SHIFT" :rowspan="3" />
          <Column header="1" :colspan="2" />
          <Column header="2" :colspan="2" />
        </Row>
        <Row>
          <Column header="SHIFT 1" />
          <Column header="SHIFT 2" />
          <Column header="SHIFT 1" />
          <Column header="SHIFT 2" />
        </Row>
        <Row>
          <Column header="07:00 - 08:00" />
          <Column header="08:00 - 09:00" />
          <Column header="09:00 - 10:00" />
          <Column header="10:00 - 11:00" />
        </Row>
      </ColumnGroup>

      <!-- Data Columns -->
      <Column field="machine" header="Machine" />
      <Column header="Day1 Shift1" />
      <Column header="Day1 Shift2" field="day1_shift2" />
      <Column header="Day2 Shift1" field="day2_shift1_start" />
      <Column header="Day2 Shift2" field="day2_shift2_start" />
    </DataTable>
  </div>
</template>

<style>
@import 'primeicons/primeicons.css';
</style>
