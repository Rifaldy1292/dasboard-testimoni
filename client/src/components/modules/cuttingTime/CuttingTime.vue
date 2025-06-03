<script setup lang="ts">
import { ref, shallowRef, watchEffect } from 'vue'
import { useMachine } from '@/composables/useMachine'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DataNotFound from '@/components/common/DataNotFound.vue'
import CuttingTimeHeader from './CuttingTimeHeader.vue'
import CuttingTimeTable from '@/components/modules/cuttingTime/CuttingTimeTable.vue'
import CuttingTimeChart from './CuttingTimeChart.vue'

const { getCuttingTime, cuttingTimeMachines, loadingFetch, selectedMachines } = useMachine()

const monthValue = ref<Date>(new Date())
const showLabel = shallowRef<boolean>(true)

watchEffect(() => {
  getCuttingTime({
    // machineIds: [{ id: 63, name: 'MC-1' }], // Example machine IDs
    machineIds: selectedMachines.value.length
      ? selectedMachines.value.map((mc) => mc.id)
      : undefined,
    period: monthValue.value
  })
})
</script>

<template>
  <LoadingAnimation :state="loadingFetch" />

  <template v-if="!loadingFetch">
    <CuttingTimeHeader v-model:month-value="monthValue" v-model:show-label="showLabel" />
    <DataNotFound :condition="!cuttingTimeMachines?.data.length" tittle="Cutting Time" />

    <div v-if="cuttingTimeMachines" class="flex flex-col gap-5 overflow-x-auto">
      <CuttingTimeChart :show-label="showLabel" />

      <CuttingTimeTable />
    </div>
  </template>
</template>
