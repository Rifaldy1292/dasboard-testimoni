<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import useWebSocket from '@/composables/useWebsocket'
import DataNotFound from '@/components/common/DataNotFound.vue'
import DateTimeShiftSelector from '@/components/common/DateTimeShiftSelector.vue'
import RunningTimeCard from '@/components/Charts/RunningTimeCard.vue'
import { animate, stagger } from 'motion'
import { type PayloadWebsocket, type ShiftValue } from '@/types/websocket.type'

const route = useRoute()

const dateTimeModel = ref({
  date: new Date(),
  shift: 0 as ShiftValue
})

const payloadWs = computed<PayloadWebsocket>(() => {
  return {
    type: 'percentage',
    data: {
      date: dateTimeModel.value.date.toISOString(),
      shift: dateTimeModel.value.shift
    }
  }
})

const { sendMessage, loadingWebsocket, percentageMachines } = useWebSocket(payloadWs.value)

const intervalId = shallowRef<number | null>(null)

watch(
  () => payloadWs.value,
  (newPayload) => {
    sendMessage(newPayload)
  }
)

// refetch per 5 minute if date not change
watch(
  [() => dateTimeModel.value.date, () => percentageMachines.value?.data],
  ([valueDate, percentageData]) => {
    if (intervalId.value) clearInterval(intervalId.value)
    if (route.path !== '/running-time') return
    if (valueDate === new Date() && percentageData?.length) {
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
  },
  { immediate: true }
)

watch(
  () => percentageMachines.value?.data,
  async (newData) => {
    if (newData?.length) {
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
    <LoadingAnimation :state="loadingWebsocket" />
    <div class="flex justify-end">
      <DateTimeShiftSelector v-model="dateTimeModel" />
    </div>
    <DataNotFound :condition="percentageMachines?.data.length === 0 && !loadingWebsocket" />

    <span class="text-lg font-semibold text-black dark:text-white"
      >{{
        percentageMachines?.dateFrom &&
        new Date(percentageMachines?.dateFrom as string).toLocaleString('id-ID')
      }}
      -
      {{
        percentageMachines?.dateTo &&
        new Date(percentageMachines?.dateTo as string).toLocaleString('id-ID')
      }}</span
    >
    <div
      v-if="!loadingWebsocket"
      class="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-5 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5"
    >
      <!-- <TransitionGroup > -->
      <RunningTimeCard
        v-for="machine in percentageMachines?.data || []"
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
