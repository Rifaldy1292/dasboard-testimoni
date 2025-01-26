<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { DatePicker, Select } from 'primevue'
import DataStatsOne from '@/components/DataStats/DataStatsOne.vue'
import ChartOne from '@/components/Charts/ChartOne.vue'
import ChartThree from '@/components/Charts/ChartThree.vue'
import ChartTwo from '@/components/Charts/ChartTwo.vue'
import MapOne from '@/components/Maps/MapOne.vue'
import TableOne from '@/components/Tables/TableOne.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'

const selectOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Month', value: 'month' }
]

const type = shallowRef<'day' | 'month'>('day')
// default value = now month
const monthValue = ref<Date>()

function getDaysInMonth(today: Date) {
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  return new Date(year, month + 1, 0).getDate()
}

const handleChangeMonth = (date: Date) => {
  monthValue.value = date
  console.log(monthValue.value, typeof monthValue.value)
}
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Detail Machine f230fh0g3" />
    <!-- <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <DataStatsOne />
    </div> -->
    <div class="mb-3 justify-end gap-4 sm:flex">
      <Select
        :model-value="type"
        @update:model-value="type = $event"
        :options="selectOptions"
        option-label="label"
        option-value="value"
        :default-value="type"
      />
      <DatePicker
        v-if="type === 'month'"
        view="month"
        showIcon
        @update:model-value="(date) => handleChangeMonth(date as Date)"
        :default-value="monthValue"
        date-format="mm/yy"
      />
    </div>

    <div class="mt-4 grid grid-cols gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
      <!-- ====== Chart One Start -->
      <!-- <ChartThree
        :machine="{
          machineName: 'f230fh0g3',
          quantity: 25,
          runningTime: '7 hour 20 minute',
          status: 'Running'
        }"
      /> -->
      <ChartOne />
      <!-- ====== Chart One End -->

      <!-- ====== Chart Two Start -->
      <!-- ====== Chart Two End -->
      <!-- <ChartTwo /> -->

      <!-- ====== Chart Three Start -->
      <!-- ====== Chart Three End -->

      <!-- ====== Map One Start -->
      <!-- <MapOne /> -->
      <!-- ====== Map One End -->

      <!-- ====== Table One Start -->
      <!-- <div class="col-span-12 xl:col-span-8">
        <TableOne />
      </div> -->
      <!-- ====== Table One End -->
    </div>
  </DefaultLayout>
</template>
