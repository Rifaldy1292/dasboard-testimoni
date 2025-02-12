<script setup lang="ts">
// import ChartOne from '@/components/Charts/ChartOne.vue'
import DatePickerMonth from '@/components/Forms/DatePicker/DatePickerMonth.vue'
import type { ApexOptions } from 'apexcharts'
import { Select } from 'primevue'
import { ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { getAllDayInMonth } from './getAllDayInMonth'
import useWebSocket from '@/composables/useWebsocket'

const { loadingWebsocket } = useWebSocket('test')

const monthValue = ref(new Date())
/**
 * format yang dibutuhkan nantinya adalah
 * [
 * {
 * name: 'Machine 1',\
 * data: [89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 600]
 *
 * ]
 */

//  target cukup simpan di db aja
// const dto = [
//   {
//     name: 'Machine 1',
//     data: [20, 40, 60, ...600],
//     dayInMonth: [1, 2, 3, ...31]
//   }
// ]

const machines = ['All Machines', 'Machine 1', 'Machine 2', 'Machine 3', 'Machine 4']

const selectedMachine = ref<string>(machines[0])
const target = 600
const length28 = [
  89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
  111, 112, 113, 114, 115, 600
]
const length18 = [89, 90, 91, 92, 93, 94, 95, 96, 97, 600, 99, 100, 101, 102, 103, 104, 105, 106]

const apexOptions: ApexOptions = {
  series: [
    {
      name: 'Target',
      data: length18
    },
    {
      name: 'MC-1',
      data: [45, 52, 38, 24, 33, 26, 21, 20, 6, 8, 15, 10]
    },
    {
      name: 'MC-2',
      data: [35, 41, 62, 42, 13, 18, 29, 37, 36, 51, 32, 35]
    },
    {
      name: 'MC-3',
      data: [87, 57, 74, 99, 75, 38, 62, 47, 82, 56, 45, 47]
    }
  ],
  chart: {
    height: 350,
    type: 'line',
    zoom: {
      enabled: true
    }
  },
  dataLabels: {
    enabled: true
  },
  stroke: {
    width: [5, 7, 5],
    curve: 'straight',
    dashArray: [0, 8, 5]
  },
  title: {
    text: 'Machine Cutting Time',
    align: 'left'
  },
  legend: {
    tooltipHoverFormatter: function (val, opts) {
      return (
        val +
        ' - <strong>' +
        opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] +
        '</strong>'
      )
    }
  },
  markers: {
    size: 0,
    hover: {
      sizeOffset: 6
    }
  },
  xaxis: {
    categories: getAllDayInMonth()
  },
  tooltip: {
    y: [
      {
        title: {
          formatter: function (val) {
            return val + ' (mins)'
          }
        }
      },
      {
        title: {
          formatter: function (val) {
            return val + ' per session'
          }
        }
      },
      {
        title: {
          formatter: function (val) {
            return val
          }
        }
      }
    ]
  },
  grid: {
    borderColor: '#f1f1f1'
  }
}
</script>

<template>
  <div class="flex items-center gap-4">
    <Select
      v-model="selectedMachine"
      :options="machines"
      :default-value="selectedMachine"
      placeholder="Select a Machine"
      checkmark
      :highlightOnSelect="false"
      class="w-full md:w-56"
    />
    <DatePickerMonth v-model:month-value="monthValue" />
  </div>

  <VueApexCharts :options="apexOptions" height="350" :series="apexOptions.series" />
</template>
