<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import ChartThree from '@/components/Charts/ChartThree.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import useWebSocket from '@/composables/useWebsocket'
import DataNotFound from '@/components/common/DataNotFound.vue'
import DatePickerDay from '@/components/common/DatePickerDay.vue'
import { computed, ref, watch } from 'vue'
// import { watchEffect } from 'vue'
const { percentageMachines, loadingWebsocket, sendMessage } = useWebSocket('percentage')

const dateOption = ref<Date>(new Date())

watch(
  () => dateOption.value,
  () => {
    sendMessage({
      type: 'percentage',
      data: {
        date: dateOption.value?.toISOString()
      }
    })
    // const test = new Date(dateOption.value).getDate()
    // console.log({ test, typeof: typeof test })
  }
)

// watchEffect(() => {
//   console.log({ percentageMachines: percentageMachines.value })
// })

const duplicatedRunningTimeData = computed(() => {
  const data = percentageMachines.value?.data || []
  return { data, date: percentageMachines.value?.date }
})
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Running Time" />
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
    <div class="flex justify-end">
      <DatePickerDay v-model:date-option="dateOption" />
    </div>
    <DataNotFound :condition="duplicatedRunningTimeData?.data.length === 0 && !loadingWebsocket" />
    <span
      v-if="duplicatedRunningTimeData?.date"
      class="text-lg font-semibold text-black dark:text-white"
      >{{ new Date(duplicatedRunningTimeData?.date as string).toLocaleDateString() }}</span
    >
    <div
      v-if="!loadingWebsocket"
      class="mt-4 grid grid-cols-8 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5"
    >
      <!-- <div class="mt-2 grid grid-cols-4 gap-4"> -->
      <ChartThree
        v-for="machine in duplicatedRunningTimeData?.data || []"
        :key="machine.name"
        :machine="machine"
        :percentage="machine.percentage"
        class="h-[350px]"
      />
    </div>
    <!-- </div> -->
  </DefaultLayout>
</template>
