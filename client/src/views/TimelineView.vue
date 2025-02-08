<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import TimelineMachine from '@/components/modules/machine/TimelineMachine.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import { DatePicker, FloatLabel } from 'primevue'
import useWebsocket from '@/composables/useWebsocket'

const { loadingWebsocket, timelineMachines } = useWebsocket('timeline')

const value1 = ref<Date>(new Date())
watchEffect(() => {
  // console.log('test', new Date())
  // console.log(value1.value)
})
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
              v-model="value1"
              inputId="over_label"
              showIcon
              iconDisplay="input"
              date-format="dd/mm/yy"
            />
            <label for="over_label">Select Date</label>
          </FloatLabel>
        </div>
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
