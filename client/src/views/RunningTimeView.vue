<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import ChartThree from '@/components/Charts/ChartThree.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import useWebSocket from '@/composables/useWebsocket'
import DataNotFound from '@/components/common/DataNotFound.vue'
import DatePickerDay from '@/components/common/DatePickerDay.vue'
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
// import { watchEffect } from 'vue'
const { percentageMachines, loadingWebsocket, sendMessage } = useWebSocket('percentage')

const nowDate = new Date()
const dateOption = ref<Date>(nowDate)
const intervalId = shallowRef<number | null>(null)
const route = useRoute()

watch(
  () => dateOption.value,
  () => {
    sendMessage({
      type: 'percentage',
      data: {
        date: dateOption.value.toISOString()
      }
    })
    // const test = new Date(dateOption.value).getDate()
    // console.log({ test, typeof: typeof test })
  }
)

watch(
  [() => dateOption.value, () => percentageMachines.value?.data],
  ([valueDateOPtion, percentageData]) => {
    if (intervalId.value) clearInterval(intervalId.value)
    // refetch per 5 minute if date not change
    if (route.path !== '/running-time') return
    if (valueDateOPtion === nowDate && percentageData?.length) {
      intervalId.value = setInterval(
        () => {
          console.log('refetch')
          sendMessage({
            type: 'percentage'
          })
        },
        5 * 60 * 1000
      )
    } else {
      clearInterval(intervalId.value as number)
    }
    // sendMessage({
    //   type: 'percentage',
    //   data: {
    //     date: dateOption.value?.toISOString()
    //   }
    // })
  },
  { immediate: true }
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
      class="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5"
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
