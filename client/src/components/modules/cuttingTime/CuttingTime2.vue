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

      <Table2 />
    </div>
  </template>
</template>
