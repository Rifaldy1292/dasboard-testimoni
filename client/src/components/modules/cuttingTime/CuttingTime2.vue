<script setup lang="ts">
import { ref, shallowRef, watchEffect } from 'vue'
import { useMachine } from '@/composables/useMachine'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DataNotFound from '@/components/common/DataNotFound.vue'
import CuttingTimeHeader from './CuttingTimeHeader.vue'
import Table2 from '@/components/modules/cuttingTime/CuttingTimeTable2.vue'
import CuttingTimeChart2 from './CuttingTimeChart2.vue'

const { getCuttingTime2, cuttingTimeMachines2, loadingFetch, selectedMachines } = useMachine()

const monthValue = ref<Date>(new Date())
const showLabel = shallowRef<boolean>(true)

watchEffect(() => {
  getCuttingTime2({
    // machineIds: [{ id: 63, name: 'MC-1' }], // Example machine IDs
    machineIds: selectedMachines.value.length ? selectedMachines.value : undefined,
    period: monthValue.value
  })
})

const colorInformation: { color: string; label: string }[] = [
  {
    color: '#22c55e',
    label: 'Target >= 16'
  },
  {
    color: '#f59e0b',
    label: 'Mendekati >= 14'
  },
  {
    color: '#ef4444',
    label: 'Tidak Target < 14'
  }
]
</script>

<template>
  <template v-if="loadingFetch">
    <LoadingAnimation :state="loadingFetch" />
  </template>

  <template v-if="!loadingFetch">
    <CuttingTimeHeader v-model:month-value="monthValue" v-model:show-label="showLabel" />
    <DataNotFound :condition="!cuttingTimeMachines2" tittle="Cutting Time" />

    <div v-if="cuttingTimeMachines2" class="flex flex-col gap-5 overflow-x-auto">
      <CuttingTimeChart2 :show-label="showLabel" />

      <div class="flex gap-15 border-y border-stroke px-6 py-7.5 dark:border-strokedark">
        <div v-for="item of colorInformation" :key="item.label" class="flex gap-2">
          <div class="w-10 h-10" :style="{ backgroundColor: item.color }" />
          <span>{{ item.label }}</span>
        </div>
      </div>
      <Table2 />
    </div>
  </template>
</template>
