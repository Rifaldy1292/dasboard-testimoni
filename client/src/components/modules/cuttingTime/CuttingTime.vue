<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { computed, ref, shallowRef, watchEffect } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useMachine } from '@/composables/useMachine'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DataNotFound from '@/components/common/DataNotFound.vue'
import CuttingTimeHeader from './CuttingTimeHeader.vue'
import CuttingTimeTable from './CuttingTimeTable.vue'

const { cuttingTimeMachines, getCuttingTime, loadingFetch, selectedMachines } = useMachine()

const monthValue = ref<Date>(new Date())
const showLabel = shallowRef<boolean>(true)

watchEffect(() => {
  console.log({ period: monthValue.value })
  getCuttingTime({
    machineIds: selectedMachines.value.length ? selectedMachines.value : undefined,
    period: monthValue.value
  })
})

const apexOptions = computed<ApexOptions>(() => {
  return {
    series: cuttingTimeMachines.value?.cuttingTimeInMonth,
    chart: {
      height: 350,
      type: 'line',
      zoom: {
        enabled: true
      }
    },
    dataLabels: {
      enabled: showLabel.value
    },
    stroke: {
      width: [5, 7, 5],
      curve: 'straight',
      dashArray: [0, 8, 5]
    },
    title: {
      text: `Cutting Time ${cuttingTimeMachines.value?.cuttingTime.period}`,
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
      categories: cuttingTimeMachines.value?.allDayInMonth
    },
    grid: {
      borderColor: '#f1f1f1'
    }
  }
})

const colorInformation: { color: string; label: string }[] = [
  {
    color: '#22c55e',
    label: 'Target >= 16'
  },
  {
    color: '#f59e0b',
    label: 'Mendekati >= 14'
  },
  {
    color: '#ef4444',
    label: 'Tidak Target < 14'
  }
]
</script>

<template>
  <template v-if="loadingFetch">
    <LoadingAnimation :state="loadingFetch" />
  </template>

  <template v-if="!loadingFetch">
    <CuttingTimeHeader v-model:month-value="monthValue" v-model:show-label="showLabel" />
    <DataNotFound :condition="!loadingFetch && !cuttingTimeMachines" tittle="Cutting Time" />

    <div v-if="cuttingTimeMachines" class="flex flex-col gap-5 overflow-x-auto">
      <VueApexCharts :options="apexOptions" height="350" :series="apexOptions.series" />

      <div class="flex gap-15 border-y border-stroke px-6 py-7.5 dark:border-strokedark">
        <div v-for="item of colorInformation" :key="item.label" class="flex gap-2">
          <div class="w-10 h-10" :style="{ backgroundColor: item.color }" />
          <span>{{ item.label }}</span>
        </div>
      </div>
      <CuttingTimeTable
        :cutting-time-machines="cuttingTimeMachines"
        :loading-fetch="loadingFetch"
      />
    </div>
  </template>
</template>
