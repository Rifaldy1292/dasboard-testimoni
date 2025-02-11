<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import CuttingTime from '@/components/modules/cuttingTime/CuttingTime.vue'

// default value = now month
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Cutting Time" />
    <!-- <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <DataStatsOne />
    </div> -->

    <div class="mt-4 grid grid-cols gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
      <CuttingTime />
      <!-- ====== Chart One Start -->
      <!-- <ChartThree
        :machine="{
          machineName: 'f230fh0g3',
          quantity: 25,
          runningTime: '7 hour 20 minute',
          status: 'Running'
        }"
      /> -->
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
