<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import useWebSocket from '@/composables/useWebsocket'
import DataNotFound from '@/components/common/DataNotFound.vue'
import DatePickerDay from '@/components/common/DatePickerDay.vue'
import { computed, nextTick, ref, shallowRef, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import RunningTimeCard from '@/components/Charts/RunningTimeCard.vue'
// import { watchEffect } from 'vue'
const { percentageMachines, loadingWebsocket, sendMessage } = useWebSocket('percentage')
import { animate, stagger } from 'motion'

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

const duplicatedRunningTimeData = computed(() => {
  const data = percentageMachines.value?.data || []
  return { data, date: percentageMachines.value?.date }
})

watch(
  () => duplicatedRunningTimeData.value.data,
  async (newData) => {
    if (newData.length) {
      await nextTick()
      animate(
        '.running-time-card',
        {
          opacity: [0, 1],
          y: [50, 0]
        },
        {
          duration: 1, // Durasi lebih panjang
          delay: stagger(0.2), // Delay antar card lebih lama
          ease: 'backInOut' // Easing yang lebih dinamis
        }
      )
    }
  },
  { immediate: true }
)
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
      <!-- <TransitionGroup > -->
      <RunningTimeCard
        v-for="machine in duplicatedRunningTimeData?.data || []"
        :key="machine.name"
        :machine="machine"
        :percentage="machine.percentage"
        animationClass="test"
        class="h-[450px] running-time-card"
      />
      <!-- </TransitionGroup -->
    </div>
    <!-- </div> -->
  </DefaultLayout>
</template>
