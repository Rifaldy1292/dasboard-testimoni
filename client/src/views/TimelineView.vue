<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import useWebsocket from '@/composables/useWebsocket'
import DataNotFound from '@/components/common/DataNotFound.vue'
import TimelineMachine from '@/components/modules/timeline/TimelineMachine.vue'
import DatePickerDay from '@/components/common/DatePickerDay.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import { Button } from 'primevue'
import { type PayloadWebsocket } from '@/types/websocket.type'

const dateOption = ref<Date>(new Date())
const payloadWs = computed<PayloadWebsocket>(() => {
  return {
    type: 'timeline',
    data: {
      date: dateOption.value.toISOString()
    }
  }
})
const { loadingWebsocket, timelineMachines, sendMessage } = useWebsocket(payloadWs.value)

const resizeCount = shallowRef<number>(2)
const updateResizeCount = (type: 'increase' | 'decrease') => {
  if (type === 'increase' && resizeCount.value < 10) {
    resizeCount.value++
  } else if (type === 'decrease' && resizeCount.value > 1) {
    resizeCount.value--
  }
}

watch(
  () => payloadWs.value,
  (newPayoad) => {
    sendMessage(newPayoad)
  }
)
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Timeline" />
    <LoadingAnimation :state="loadingWebsocket" />
    <template v-if="!loadingWebsocket">
      <div class="flex justify-between mb-2">
        <div class="flex justify-between gap-2">
          <span
            v-if="timelineMachines?.date"
            class="text-md font-semibold text-black dark:text-white"
            >{{ new Date(timelineMachines?.date as string).toLocaleDateString() }}</span
          >
          <div class="flex items-center gap-2">
            <Button
              :disabled="resizeCount === 10"
              @click="updateResizeCount('increase')"
              :class="`p-button-rounded p-button-text ${resizeCount === 10 && 'opacity-50 cursor-not-allowed'}`"
              icon="pi pi-arrow-down"
            />
            <Button
              :disabled="resizeCount === 1"
              @click="updateResizeCount('decrease')"
              :class="`p-button-rounded p-button-text ${resizeCount === 1 && ' opacity-50 cursor-not-allowed'}`"
              icon="pi pi-arrow-up"
            />
          </div>
        </div>
        <DatePickerDay v-model:date-option="dateOption" />
      </div>
      <div class="flex flex-col gap-1.5">
        <DataNotFound :condition="!timelineMachines?.data?.length" />
        <template v-if="timelineMachines?.data?.length">
          <template v-for="machine in timelineMachines.data" :key="machine.name">
            <TimelineMachine :machine="machine" :resize-count />
          </template>
        </template>
      </div>
    </template>
  </DefaultLayout>
</template>
