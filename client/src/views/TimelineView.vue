<script setup lang="ts">
import { ref, watch } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import TimelineMachine from '@/components/modules/machine/TimelineMachine.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import { DatePicker, FloatLabel } from 'primevue'
import useWebsocket from '@/composables/useWebsocket'
import DataNotFound from '@/components/common/DataNotFound.vue'

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
    const test = new Date(dateOption.value).getDate()
    console.log({ test, typeof: typeof test })
  }
)
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Timeline" />
    <LoadingAnimation :state="loadingWebsocket" />
    <template v-if="!loadingWebsocket">
      <div class="flex flex-col gap-5 mb-2">
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
        <DataNotFound :condition="timelineMachines.length === 0" />
        <div
          v-for="machine in timelineMachines"
          :key="machine.name"
          class="border border-l-gray-600 dark:border-graydark"
        >
          <TimelineMachine :machine="machine" />
        </div>
      </div>
    </template>
  </DefaultLayout>
</template>
