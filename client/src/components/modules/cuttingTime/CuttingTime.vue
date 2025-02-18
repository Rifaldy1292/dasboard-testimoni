<script setup lang="ts">
import DatePickerMonth from '@/components/Forms/DatePicker/DatePickerMonth.vue'
import type { ApexOptions } from 'apexcharts'
import { MultiSelect } from 'primevue'
import { computed, ref, watchEffect } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useMachine } from '@/composables/useMachine'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DataNotFound from '@/components/common/DataNotFound.vue'
import type { ParamsGetCuttingTime } from '@/dto/machine.dto'

const {
  cuttingTimeMachines,
  getCuttingTime,
  loadingFetch,
  loadingDropdown,
  machineOptions,
  getMachineOptions,
  handleSelectMachine,
  selectedMachine
} = useMachine()

const monthValue = ref<Date>(new Date())
const paramsGetCuttingTime = computed<ParamsGetCuttingTime>(() => {
  const machineIds = selectedMachine.value.length ? selectedMachine.value : undefined
  return {
    period: monthValue.value,
    machineIds
  }
})

watchEffect(() => {
  getCuttingTime(paramsGetCuttingTime.value)
})

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
// const dto = {
//   allDayInMonhth: [1, 2, 3, ...31],
//   target: 600,
//   machines: [
//     {
//       name: 'Machine 1',
//       data: [20, 40, 60, ...600]
//     },
//     {
//       name: 'Machine 2',
//       data: [20, 40, 60, ...600]
//     },
//     {
//       name: 'Machine 3',
//       data: [20, 40, 60, ...600]
//     },
//     {
//       name: 'Machine 4',
//       data: [20, 40, 60, ...600],
//     }
//   ]
// }

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
      enabled: true
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
</script>

<template>
  <template v-if="loadingFetch">
    <LoadingAnimation :state="loadingFetch" />
  </template>

  <template v-if="!loadingFetch">
    <div class="flex justify-between gap-4">
      <MultiSelect
        v-model:model-value="selectedMachine"
        @before-show="getMachineOptions"
        @before-hide="handleSelectMachine"
        display="chip"
        :options="machineOptions"
        :loading="loadingDropdown"
        optionLabel="name"
        filter
        placeholder="All Machine"
        :maxSelectedLabels="3"
        class="w-full md:w-80"
      />
      <DatePickerMonth v-model:month-value="monthValue" />
    </div>
    <DataNotFound :condition="!loadingFetch && !cuttingTimeMachines" tittle="Cutting Time" />

    <VueApexCharts
      v-if="cuttingTimeMachines"
      :options="apexOptions"
      height="350"
      :series="apexOptions.series"
    />
  </template>
</template>
