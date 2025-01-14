<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import ChartThree from '@/components/Charts/ChartThree.vue'
// import TableMachine from '@/components/Tables/TableMachine.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import type { Machine } from '@/types/machine.type'

const dummyMachine: Machine[] = [
  {
    machineName: 'f230fh0g3',
    runningTime: '7 hour 20 minute',
    status: 'Pending',
    quantity: 25
  },
  {
    machineName: 'f230fh0g4',
    runningTime: '7 hour 20 minute',
    status: 'Running',
    quantity: 25
  },
  {
    machineName: 'f230fh0g5',
    runningTime: '7 hour 20 minute',
    status: 'Running',
    quantity: 25
  },
  {
    machineName: 'f230fh0g6',
    runningTime: '7 hour 20 minute',
    status: 'Stopped',
    quantity: 20
  },
  {
    machineName: 'f230fh0g7',
    runningTime: '7 hour 20 minute',
    status: 'Stopped',
    quantity: 15
  },
  {
    machineName: 'f230fh0g8',
    runningTime: '7 hour 20 minute',
    status: 'Running',
    quantity: 10
  },
  {
    machineName: 'f230fh0g9',
    runningTime: '7 hour 20 minute',
    status: 'Pending',
    quantity: 5
  },
  {
    machineName: 'f230fh0g10',
    runningTime: '7 hour 20 minute',
    status: 'Pending',
    quantity: 5
  },
  {
    machineName: 'f230fh0g11',
    runningTime: '7 hour 20 minute',
    status: 'Pending',
    quantity: 5
  },
  {
    machineName: 'f230fh0g12',
    runningTime: '7 hour 20 minute',
    status: 'Pending',
    quantity: 5
  },
  {
    machineName: 'f230fh0g13',
    runningTime: '7 hour 20 minute',
    status: 'Pending',
    quantity: 5
  },
  {
    machineName: 'f230fh0g14',
    runningTime: '7 hour 20 minute',
    status: 'Pending',
    quantity: 5
  },
  {
    machineName: 'f230fh0g15',
    runningTime: '7 hour 20 minute',
    status: 'Pending',
    quantity: 5
  },
  {
    machineName: 'f230fh0g15',
    runningTime: '7 hour 20 minute',
    status: 'Pending',
    quantity: 5
  },
  {
    machineName: 'f230fh0g15',
    runningTime: '7 hour 20 minute',
    status: 'Pending',
    quantity: 5
  }
]
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Real Time" />
    <h1>{{ dummyMachine.length }}</h1>
    <!-- <TableMachine /> -->
    <div class="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
      <ChartThree v-for="machine in dummyMachine" :key="machine.machineName" :machine="machine" />
    </div>
  </DefaultLayout>
</template>
