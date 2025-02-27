<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import { DatePicker, FloatLabel } from 'primevue'
import useWebsocket from '@/composables/useWebsocket'
import DataNotFound from '@/components/common/DataNotFound.vue'
import TimelineMachine from '@/components/modules/timeline/TimelineMachine.vue'

const { loadingWebsocket, timelineMachines, sendMessage } = useWebsocket('timeline')

const dateOption = ref<Date>(new Date())
watch(
  () => dateOption.value,
  () => {
    sendMessage({
      type: 'timeline',
      data: {
        date: dateOption.value.toISOString()
      }
    })
    // const test = new Date(dateOption.value).getDate()
    // console.log({ test, typeof: typeof test })
  }
)

const duplicatedTimelineData = computed(() => {
  const data = timelineMachines.value?.data || []
  return { data, date: timelineMachines.value?.date }
})
</script>

<template>
  <DefaultLayout timeline-page>
    <BreadcrumbDefault page-title="Timeline" />
    <LoadingAnimation :state="loadingWebsocket" />
    <template v-if="!loadingWebsocket">
      <div class="flex flex-col gap-10 mb-2">
        <div class="flex justify-end">
          <FloatLabel>
            <DatePicker
              v-model="dateOption"
              inputId="over_label"
              showIcon
              iconDisplay="input"
              date-format="dd/mm/yy"
            />
            <label for="over_label">Select Date</label>
          </FloatLabel>
        </div>
        <DataNotFound :condition="duplicatedTimelineData?.data?.length === 0" />
        <span
          v-if="timelineMachines?.date"
          class="text-lg font-semibold text-black dark:text-white"
          >{{ new Date(duplicatedTimelineData?.date as string).toLocaleDateString() }}</span
        >
        <div
          v-for="machine in duplicatedTimelineData?.data || []"
          :key="machine.name"
          class="border border-gray-950 dark:border-gray-500 overflow-x-auto"
        >
          <TimelineMachine :machine="machine" />
        </div>
      </div>
    </template>
  </DefaultLayout>
</template>
