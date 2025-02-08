<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import ChartThree from '@/components/Charts/ChartThree.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import useWebSocket from '@/composables/useWebsocket'
const { percentageMachines, loadingWebsocket } = useWebSocket('percentage')
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Real Time" />
    <!-- <TestWebsocket/> -->
    <LoadingAnimation :state="loadingWebsocket" />

    <!-- agar tanpa scroll dan muncul semua -->
    <!-- <div class="max-h-screen" > -->
    <!-- <div class="mb-3 justify-end gap-4 sm:flex">
      <Select
        :model-value="type"
        @update:model-value="type = $event"
        :options="selectOptions"
        option-label="label"
        option-value="value"
        :default-value="type"
      />
    </div> -->
    <div
      v-if="!loadingWebsocket"
      class="mt-4 grid grid-cols-8 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5"
    >
      <!-- <div class="mt-2 grid grid-cols-4 gap-4"> -->
      <ChartThree
        v-for="machine in percentageMachines"
        :key="machine.name"
        :machine="machine"
        :percentage="machine.percentage"
        class="h-[350px]"
      />
    </div>
    <!-- </div> -->
  </DefaultLayout>
</template>
