<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import ChartThree from '@/components/Charts/ChartThree.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
// import TableMachine from '@/components/Tables/TableMachine.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import type { Machine } from '@/types/machine.type'
import { Select } from 'primevue'
import { watch } from 'vue'

const selectOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Month', value: 'month' }
]

const ws = new WebSocket('ws://localhost:3333')
const machines = ref<Machine[]>([])
const type = shallowRef<'day' | 'month'>('day')
// mothValue = now month

watch(
  () => type.value,
  () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: type.value, date: new Date() }))
      console.log({ type: type.value })
    }
  }
)

const isLoading = computed<boolean>(() => machines.value.length === 0)

const connectWebsocket = () => {
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data) as Machine[]
    const sortedData = data.sort((a, b) => {
      const numberA = parseInt(a.name.slice(3))
      const numberB = parseInt(b.name.slice(3))

      return numberA - numberB
    })
    machines.value = sortedData
    // console.log(data, 'data from ws')
    // console.log({ sortedData })
  }
}

onMounted(() => {
  connectWebsocket()
})

onUnmounted(() => {
  ws.close()
})
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Real Time" />
    <!-- <TestWebsocket/> -->
    <!-- <TableMachine /> -->
    <LoadingAnimation :state="isLoading" />

    <!-- agar tanpa scroll dan muncul semua -->
    <!-- <div class="max-h-screen" > -->
    <div class="mb-3 justify-end gap-4 sm:flex">
      <Select
        :model-value="type"
        @update:model-value="type = $event"
        :options="selectOptions"
        option-label="label"
        option-value="value"
        :default-value="type"
      />
    </div>
    <div
      v-if="!isLoading"
      class="mt-4 grid grid-cols-8 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5"
    >
      <!-- <div class="mt-2 grid grid-cols-4 gap-4"> -->
      <ChartThree
        v-for="machine in machines"
        :key="machine.name"
        :machine="machine"
        :percentage="machine.percentage"
        class="h-[350px]"
      />
    </div>
    <!-- </div> -->
  </DefaultLayout>
</template>
