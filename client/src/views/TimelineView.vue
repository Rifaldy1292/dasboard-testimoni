<script setup lang="ts">
import { ref, watch } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import useWebsocket from '@/composables/useWebsocket'
import DataNotFound from '@/components/common/DataNotFound.vue'
import TimelineMachine from '@/components/modules/timeline/TimelineMachine.vue'
import DatePickerDay from '@/components/common/DatePickerDay.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'

const { loadingWebsocket, timelineMachines, sendMessage, messageWebsocket } =
  useWebsocket('timeline')

const dateOption = ref<Date>(new Date())

watch(
  () => messageWebsocket.value,
  (newValue) => {
    if (newValue === 'Description updated successfully') {
      // refetch
      console.log('refetch')
      sendMessage({
        type: 'timeline',
        data: {
          date: dateOption.value?.toISOString()
        }
      })
    }
  }
)
watch(
  () => dateOption.value,
  () => {
    sendMessage({
      type: 'timeline',
      data: {
        date: dateOption.value?.toISOString()
      }
    })
    // const test = new Date(dateOption.value).getDate()
    // console.log({ test, typeof: typeof test })
  }
)
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Timeline" />
    <LoadingAnimation :state="loadingWebsocket" />
    <template v-if="!loadingWebsocket">
      <div class="flex flex-col">
        <div class="flex justify-end my-0">
          <DatePickerDay v-model:date-option="dateOption" size="small" />
        </div>
        <DataNotFound :condition="!timelineMachines?.data?.length" />
        <template v-if="timelineMachines?.data?.length">
          <span
            v-if="timelineMachines?.date"
            class="text-sm font-semibold text-black dark:text-white"
            >{{ new Date(timelineMachines?.date as string).toLocaleDateString() }}</span
          >

          <template v-for="machine in timelineMachines.data" :key="machine.name">
            <TimelineMachine :machine="machine" />
          </template>
        </template>
      </div>
    </template>
  </DefaultLayout>
</template>
