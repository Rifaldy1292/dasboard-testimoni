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
// import TestWebsocket from './TestWebsocket.vue'

// const dummyMachine: Machine[] = [
//   {
//     machineName: 'f230fh0g3',
//     runningTime: '7 hour 20 minute',
//     status: 'Stopped',
//     quantity: 25
//   },
//   {
//     machineName: 'f230fh0g4',
//     runningTime: '7 hour 20 minute',
//     status: 'Running',
//     quantity: 25
//   },
//   {
//     machineName: 'f230fh0g5',
//     runningTime: '7 hour 20 minute',
//     status: 'Running',
//     quantity: 25
//   },
//   {
//     machineName: 'f230fh0g6',
//     runningTime: '7 hour 20 minute',
//     status: 'Stopped',
//     quantity: 20
//   },
//   {
//     machineName: 'f230fh0g7',
//     runningTime: '7 hour 20 minute',
//     status: 'Stopped',
//     quantity: 15
//   },
//   {
//     machineName: 'f230fh0g8',
//     runningTime: '7 hour 20 minute',
//     status: 'Running',
//     quantity: 10
//   },
//   {
//     machineName: 'f230fh0g9',
//     runningTime: '7 hour 20 minute',
//     status: 'Stopped',
//     quantity: 5
//   },
//   {
//     machineName: 'f230fh0g10',
//     runningTime: '7 hour 20 minute',
//     status: 'Stopped',
//     quantity: 5
//   },
//   {
//     machineName: 'f230fh0g11',
//     runningTime: '7 hour 20 minute',
//     status: 'Stopped',
//     quantity: 5
//   },
//   {
//     machineName: 'f230fh0g12',
//     runningTime: '7 hour 20 minute',
//     status: 'Stopped',
//     quantity: 5
//   },
//   {
//     machineName: 'f230fh0g13',
//     runningTime: '7 hour 20 minute',
//     status: 'Stopped',
//     quantity: 5
//   },
//   {
//     machineName: 'f230fh0g14',
//     runningTime: '7 hour 20 minute',
//     status: 'Stopped',
//     quantity: 5
//   },
//   {
//     machineName: 'f230fh0g15',
//     runningTime: '7 hour 20 minute',
//     status: 'Stopped',
//     quantity: 5
//   },
//   {
//     machineName: 'f230fh0g15',
//     runningTime: '7 hour 20 minute',
//     status: 'Stopped',
//     quantity: 5
//   },
//   {
//     machineName: 'f230fh0g15',
//     runningTime: '7 hour 20 minute',
//     status: 'Stopped',
//     quantity: 5
//   }
// ]

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
      ws.send(JSON.stringify({ type: type.value }))
      console.log({ type: type.value })
    }
  }
)

const isLoading = computed<boolean>(() => {
  return machines.value.length === 0
})

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
