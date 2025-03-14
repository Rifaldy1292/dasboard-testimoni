<script setup lang="ts">
import type { Machine } from '@/types/machine.type'
import { Button } from 'primevue'
import { ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

defineProps<{
  machine: Machine
}>()

const labels: Machine['status'][] = ['Running', 'Stopped']

function badgeBackground(status: Machine['status']): string {
  if (status === 'Running') return '#008000'
  if (status === 'Stopped') return '#FF0000'
  return '#F2C464'
}
const chart = ref(null)

const apexOptions = {
  chart: {
    type: 'donut',
    width: 380
  },
  colors: ['#008000', '#FF0000'],
  labels: labels,
  legend: {
    show: false,
    position: 'bottom'
  },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        background: 'transparent'
      }
    }
  },
  dataLabels: {
    enabled: false
  },
  responsive: [
    {
      breakpoint: 640,
      options: {
        chart: {
          width: 50
        }
      }
    }
  ]
}
</script>

<template>
  <div
    class="h-full w-full col-span-2 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5"
  >
    <!-- <div class="col-span "> -->
    <div class="mb-3 justify-between gap-4 sm:flex">
      <div>
        <h4 class="text-xl font-bold text-black dark:text-white">
          {{ machine?.name || '-' }}
          <span class="text-md font-semibold">{{ machine.type ? `(${machine.type})` : '' }}</span>
        </h4>

        <h4 class="text-sm font-semibold text-black dark:text-white mt-2">
          {{ machine?.description || '-' }}
        </h4>
      </div>
    </div>
    <div class="mb-2">
      <div id="chartThree" class="mx-auto flex justify-center">
        <VueApexCharts
          type="donut"
          :options="apexOptions"
          :width="200"
          :series="machine.percentage"
          ref="chart"
        />
      </div>
    </div>
    <div class="-mx-8 flex flex-wrap items-center justify-center gap-y-3">
      <template v-for="(series, index) in machine.percentage" :key="series">
        <div class="w-full px-8 sm:w-1/2">
          <div class="flex w-full items-center">
            <span
              test-id="jonfry"
              :style="{ background: badgeBackground(labels[index]) }"
              class="mr-2 block h-3 w-full max-w-3 rounded-full"
            >
              &nbsp;&nbsp;&nbsp;</span
            >

            <p class="flex w-full justify-between text-sm font-medium text-black dark:text-white">
              <span> {{ labels[index] }} </span>
              <span> {{ series }}% </span>
            </p>
          </div>
        </div>
      </template>
      <div class="w-full px-8 sm:w-1/2 text-black dark:text-white">
        <Button
          :label="machine.status"
          :severity="machine.status === 'Running' ? 'success' : 'warn'"
          size="small"
          disabled
        />
      </div>

      <!-- <div class="w-full px-8 sm:w-1/2">
          <div class="flex w-full items-center">
            <span class="mr-2 block h-3 w-full max-w-3 rounded-full bg-[#6577F3]"></span>
            <p class="flex w-full justify-between text-sm font-medium text-black dark:text-white">
              <span> Tablet </span>
              <span> 34% </span>
            </p>
          </div>
        </div> -->
      <!-- <div class="w-full px-8 sm:w-1/2">
          <div class="flex w-full items-center">
            <span class="mr-2 block h-3 w-full max-w-3 rounded-full bg-[#8FD0EF]"></span>
            <p class="flex w-full justify-between text-sm font-medium text-black dark:text-white">
              <span> Mobile </span>
              <span> 45% </span>
            </p>
          </div>
        </div>
        <div class="w-full px-8 sm:w-1/2">
          <div class="flex w-full items-center">
            <span class="mr-2 block h-3 w-full max-w-3 rounded-full bg-[#0FADCF]"></span>
            <p class="flex w-full justify-between text-sm font-medium text-black dark:text-white">
              <span> Unknown </span>
              <span> 12% </span>
            </p>
          </div>
        </div> -->
    </div>
    <!-- </div> -->
  </div>
</template>
