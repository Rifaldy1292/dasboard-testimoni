<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { Column, DataTable, Divider, MultiSelect, ToggleSwitch } from 'primevue'
import { computed, ref, shallowRef, watchEffect } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useMachine } from '@/composables/useMachine'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DataNotFound from '@/components/common/DataNotFound.vue'
import type { ParamsGetCuttingTime } from '@/dto/machine.dto'
import DatePickerMonth from '@/components/Forms/DatePicker/DatePickerMonth.vue'
import type { cuttingTimeInMonth } from '@/types/machine.type'

type Obj = {
  actual: number
  runningToday?: number
}

/**
 * 
 * @return example: 
 * {
   name: 'Machine 1',
   1: { actual: 30, runningToday: 10 },
   2: { actual: 40, runningToday: 20 }
 }
 */
type ValueDataTable = { name: string } & Record<number, Obj>

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
const showLabel = shallowRef<boolean>(true)

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

function formatValueDataTable(cuttingTimeInMonth: cuttingTimeInMonth): ValueDataTable {
  const result: ValueDataTable = { name: cuttingTimeInMonth.name }

  cuttingTimeInMonth.data.forEach((item, index) => {
    result[index + 1] = {
      ...result[index + 1],
      actual: item
    }
  })
  cuttingTimeInMonth.runningToday?.forEach((item, index) => {
    result[index + 1].runningToday = item
  })
  return result
}
/**
 *
 * @return
 */
const dataTableValue = computed<{ key: string[]; value: ValueDataTable[] } | undefined>(() => {
  if (!cuttingTimeMachines?.value) return undefined
  const { allDayInMonth, cuttingTimeInMonth } = cuttingTimeMachines.value
  const stringAllDay = allDayInMonth.map((item) => item.toString())
  const key: string[] = ['name', ...stringAllDay]
  const value: ValueDataTable[] = cuttingTimeInMonth.map((item) => formatValueDataTable(item))
  // console.log(value)
  return { key, value }
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

const getColorColumn = (value: number) => {
  // green
  if (value >= 16) return '#22c55e'
  // yellow
  if (value >= 14) return '#f59e0b'
  // red
  if (value < 14) return '#ef4444'
}

const colorInformation = [
  {
    color: '#22c55e',
    label: 'Target'
  },
  {
    color: '#f59e0b',
    label: 'Mendekati'
  },
  {
    color: '#ef4444',
    label: 'Tidak Target'
  }
]
</script>

<template>
  <template v-if="loadingFetch">
    <LoadingAnimation :state="loadingFetch" />
  </template>

  <template v-if="!loadingFetch">
    <div class="flex justify-between gap-2">
      <div class="flex gap-5">
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
        <div class="flex flex-col items-center">
          <label for="toggle-label">Show Label</label>
          <ToggleSwitch v-model="showLabel" ariaLabel="toggle-label">
            <template #handle="{ checked }">
              <i :class="['!text-xs pi', { 'pi-check': checked, 'pi-times': !checked }]" />
            </template>
          </ToggleSwitch>
        </div>
      </div>

      <DatePickerMonth v-model:month-value="monthValue" />
    </div>
    <DataNotFound :condition="!loadingFetch && !cuttingTimeMachines" tittle="Cutting Time" />

    <div v-if="cuttingTimeMachines" class="flex flex-col gap-5">
      <VueApexCharts :options="apexOptions" height="350" :series="apexOptions.series" />

      <div class="flex gap-15 border-y border-stroke px-6 py-7.5 dark:border-strokedark">
        <div v-for="item of colorInformation" :key="item.label" class="flex gap-2">
          <div class="w-10 h-10" :style="{ backgroundColor: item.color }" />
          <span>{{ item.label }}</span>
        </div>
      </div>
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
            <template v-if="col !== 'name'" #body="{ data }">
              <span>{{ data[col].actual }}</span>
              <template
                v-if="
                  typeof data[col].runningToday === 'number' ||
                  typeof data[col].runningToday === 'string'
                "
              >
                <Divider />
                <span :style="{ color: getColorColumn(data[col].runningToday) }">{{
                  data[col].runningToday
                }}</span>
              </template>
            </template>
          </Column>
        </template>
      </DataTable>
    </div>
  </template>
</template>
