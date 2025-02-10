<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { DatePicker, FloatLabel } from 'primevue'
import ChartOne from '@/components/Charts/ChartOne.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'

// default value = now month
const monthValue = ref<Date>(new Date())
watchEffect(() => {
  console.log('monthValue', monthValue.value)
})
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Detail Machine f230fh0g3" />
    <!-- <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <DataStatsOne />
    </div> -->
    <div class="mb-3 justify-end gap-4 sm:flex">
      <FloatLabel>
        <DatePicker
          v-model:model-value="monthValue"
          :default-value="monthValue"
          inputId="over_label"
          view="month"
          showIcon
          iconDisplay="input"
          date-format="mm/yy"
        />
        <label v-if="!monthValue" for="over_label">Select Month</label>
      </FloatLabel>
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
