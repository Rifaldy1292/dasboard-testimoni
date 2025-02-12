const chartData: ChartData = { series: [ { name: 'Product One', data: [23, 11, 22, 27, 13, 22, 37,
21, 44, 22, 30, 45] }, { name: 'Product One', data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30, 45]
}, { name: 'Product One', data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30, 45] }, { name: 'Product
Two', data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39, 51] } ], labels: ['Sep', 'Oct', 'Nov',
'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'] }

<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { ref, watchEffect } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

type ChartData = {
  series: Array<{
    name: string
    data: number[]
  }>
  labels: string[] | number[]
}

const dummyData: ChartData = {
  // 31 days
  labels: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
    27, 28, 29, 30, 31
  ],
  series: [
    {
      name: 'Product One',
      data: [
        30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39, 51, 30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39,
        51, 30, 25, 36, 30, 45, 35, 64
      ]
    },
    {
      name: 'Product Two',
      data: [
        23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30, 45, 23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30,
        45, 23, 11, 22, 27, 13, 22, 37
      ]
    },
    {
      name: 'Product Three',
      data: [
        23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30, 45, 23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30,
        45, 23, 11, 22, 27, 13, 22, 37
      ]
    },

    {
      name: 'Product Four',
      data: [
        30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39, 51, 30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39,
        51, 30, 25, 36, 30, 45, 35, 64
      ] // 31 days
    }
  ]
}
console.log({ dummyData })

const chart = ref(null)

const apexOptions: ApexOptions = {
  legend: {
    show: false,
    position: 'top',
    horizontalAlign: 'left'
  },
  colors: ['#3C50E0', '#80CAEE', '#FF0000', '#FF9900'],
  chart: {
    fontFamily: 'Satoshi, sans-serif',
    height: 335,
    type: 'area',
    dropShadow: {
      enabled: true,
      color: '#623CEA14',
      top: 10,
      blur: 4,
      left: 0,
      opacity: 0.1
    },

    toolbar: {
      show: false
    }
  },
  responsive: [
    {
      breakpoint: 1024,
      options: {
        chart: {
          height: 300
        }
      }
    },
    {
      breakpoint: 1366,
      options: {
        chart: {
          height: 350
        }
      }
    }
  ],
  stroke: {
    width: [2, 2],
    curve: 'straight'
  },

  labels: {
    show: false,
    position: 'top'
  },
  grid: {
    xaxis: {
      lines: {
        show: true
      }
    },
    yaxis: {
      lines: {
        show: true
      }
    }
  },
  dataLabels: {
    enabled: false
  },
  markers: {
    size: 8,
    colors: '#fff',
    strokeColors: ['#3056D3', '#80CAEE'],
    strokeWidth: 3,
    strokeOpacity: 0.9,
    strokeDashArray: 0,
    fillOpacity: 1,
    discrete: [],
    hover: {
      size: undefined,
      sizeOffset: 5
    }
  },
  xaxis: {
    type: 'category',
    categories: dummyData.labels,
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    }
  },
  yaxis: {
    title: {
      style: {
        fontSize: '0px'
      }
    },
    min: 0,
    max: 100
  }
}

const monthValue = ref<Date>(new Date())
watchEffect(() => {
  console.log('monthValue', monthValue.value)
})
</script>

<template>
  <div
    class="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8"
  >
    <div class="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
      <div class="flex w-full flex-wrap gap-3 sm:gap-5">
        <div class="flex min-w-47.5">
          <span
            class="mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-primary"
          >
            <span class="block h-2.5 w-full max-w-2.5 rounded-full bg-primary"></span>
          </span>
          <div class="w-full">
            <p class="font-semibold text-primary">Total Revenue</p>
            <p class="text-sm font-medium">12.04.2022 - 12.05.2022</p>
          </div>
        </div>
        <div class="flex min-w-47.5">
          <span
            class="mt-1 mr-2 flex h-4 w-full max-w-4 items-center justify-center rounded-full border border-secondary"
          >
            <span class="block h-2.5 w-full max-w-2.5 rounded-full bg-secondary"></span>
          </span>
          <div class="w-full">
            <p class="font-semibold text-secondary">Total Sales</p>
            <p class="text-sm font-medium">12.04.2022 - 12.05.2022</p>
          </div>
        </div>
      </div>
      <div class="flex w-full max-w-45 justify-end">
        <div class="inline-flex items-center rounded-md bg-whiter p-1.5 dark:bg-meta-4">
          <!-- <button
            class="rounded bg-white py-1 px-3 text-xs font-medium text-black shadow-card hover:bg-white hover:shadow-card dark:bg-boxdark dark:text-white dark:hover:bg-boxdark"
          >
            Day
          </button>
          <button
            class="rounded py-1 px-3 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark"
          >
            Week
          </button>
          <button
            class="rounded py-1 px-3 text-xs font-medium text-black hover:bg-white hover:shadow-card dark:text-white dark:hover:bg-boxdark"
          >
            Month
          </button> -->
          <slot name="header"></slot>
        </div>
      </div>
    </div>
    <div>
      <div id="chartOne" class="-ml-5">
        <VueApexCharts
          type="area"
          height="350"
          :options="apexOptions"
          :series="dummyData.series"
          ref="chart"
        />
      </div>
    </div>
  </div>
</template>
