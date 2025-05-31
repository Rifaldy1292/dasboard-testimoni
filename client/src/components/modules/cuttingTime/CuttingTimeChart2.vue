<script setup lang="ts">
import { useMachine } from '@/composables/useMachine'
import type { ApexOptions } from 'apexcharts'
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const { showLabel } = defineProps<{
  showLabel: boolean
}>()

const { cuttingTimeMachines2 } = useMachine()

const apexOptions = computed<ApexOptions>(() => {
  return {
    series: cuttingTimeMachines2.value?.data.map((machine) => {
      return {
        name: machine.name,
        data: machine.data.map((day) => {
          return day.count.calculate.combine
        })
      }
    }),
    chart: {
      height: 350,
      type: 'line',
      zoom: {
        enabled: true
      }
    },
    dataLabels: {
      enabled: showLabel
    },
    stroke: {
      width: [5, 7, 5],
      curve: 'straight',
      dashArray: [0, 8, 5]
    },
    title: {
      text: `Cutting Time ${cuttingTimeMachines2.value?.period}`,
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
      categories: cuttingTimeMachines2.value?.allDateInMonth
    },
    grid: {
      borderColor: '#f1f1f1'
    }
  }
})
</script>

<template>
  <VueApexCharts :options="apexOptions" height="350" :series="apexOptions.series" />
</template>
