<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import ChartThree from '@/components/Charts/ChartThree.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
// import TableMachine from '@/components/Tables/TableMachine.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import type { Machine } from '@/types/machine.type'
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

const ws = ref<WebSocket | null>(null)
const machines = ref<Machine[]>([])

const isLoading = computed<boolean>(() => {
  return machines.value.length === 0
})

const connectWebsocket = () => {
  ws.value = new WebSocket('ws://localhost:3333')

  ws.value.onmessage = (event) => {
    // const data = JSON.parse(event.data) as Machine[]
    const data = JSON.parse(event.data) as Machine[]
    machines.value = data
    console.log(machines.value, 'data from ws', typeof event.data)
  }
}

onMounted(() => {
  connectWebsocket()
})

onUnmounted(() => {
  ws.value?.close()
})
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Real Time" />
    <!-- <TestWebsocket/> -->
    <!-- <TableMachine /> -->
    <LoadingAnimation :state="isLoading" />
    <div
      v-if="!isLoading"
      class="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5"
    >
      <ChartThree
        v-for="machine in machines"
        :key="machine.name"
        :machine="machine"
        :percentage="machine.percentage"
      />
    </div>
  </DefaultLayout>
</template>
