<script setup lang="ts">
import { ref, watch } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import useWebsocket from '@/composables/useWebsocket'
import DataNotFound from '@/components/common/DataNotFound.vue'
import TimelineMachine from '@/components/modules/timeline/TimelineMachine.vue'
import DatePickerDay from '@/components/common/DatePickerDay.vue'
import type { MachineTimeline } from '@/types/machine.type'

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

const timelineDocs: MachineTimeline = {
  name: 'Documentation',
  status: 'Running',
  MachineLogs: [
    {
      createdAt: '07:00(last updated)',
      description: 'Description is not available while the machine is running(Description)',
      current_status: 'Running',
      g_code_name: '2501241D1705(G-CODE)',
      id: 1,
      k_num: '03.01 SEMI D10R2 L40 T0.06_ORG_1(K-NUM)',
      output_wp: 'BAWAH_24(OUTPUT WP)',
      operator: 'ANO(operator name)',
      total_cutting_time: 10,
      timeDifference: '3h 2m 3s(total)'
    },
    {
      createdAt: '10:00(last updated)',
      description: 'DANDORI(Description can be edited)',
      current_status: 'Stopped',
      g_code_name: '2501241D1705(GCODE)',
      id: 1,
      k_num: '03.01 SEMI D10R2 L40 T0.06_ORG_1(K-NUM)',
      output_wp: 'BAWAH_24(OUTPUT WP)',
      operator: 'ANO(operator name)',
      total_cutting_time: 10,
      timeDifference: '2h 2m 3s'
    }
  ]
}
</script>

<template>
  <DefaultLayout timeline-page>
    <BreadcrumbDefault page-title="Timeline" />
    <LoadingAnimation :state="loadingWebsocket" />
    <template v-if="!loadingWebsocket">
      <div class="flex flex-col gap-10 mb-2">
        <div class="flex justify-end">
          <DatePickerDay v-model:date-option="dateOption" />
        </div>
        <DataNotFound :condition="!timelineMachines?.data?.length" />
        <template v-if="timelineMachines?.data?.length">
          <span
            v-if="timelineMachines?.date"
            class="text-lg font-semibold text-black dark:text-white"
            >{{ new Date(timelineMachines?.date as string).toLocaleDateString() }}</span
          >

          <div class="border border-gray-950 dark:border-gray-500 overflow-x-auto">
            <TimelineMachine :machine="timelineDocs" :date="timelineMachines.date as string" />
          </div>

          <div
            v-for="machine in timelineMachines.data"
            :key="machine.name"
            class="border border-gray-950 dark:border-gray-500 overflow-x-auto"
          >
            <TimelineMachine :machine="machine" :date="timelineMachines.date as string" />
          </div>
        </template>
      </div>
    </template>
  </DefaultLayout>
</template>
