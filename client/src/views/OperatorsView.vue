<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { Card } from 'primevue'
import { watchEffect } from 'vue'

const operators = [
  {
    machine: 'OKK VM5',
    name: 'Abdul Shomad',
    photo: 'https://dummyimage.com/100x100/000/fff.png',
    process: 'O0317 (Kalibrasi)',
    status: 'IDLE',
    remaining: '0 Program',
    time: '00:00:00',
    lastUpdate: '05 Jun 2023 09:59:37'
  },
  {
    machine: 'OKK VP1200',
    name: 'Andi Gunanta Barus',
    photo: 'https://dummyimage.com/600x400/000/fff.png',
    process: '00001',
    status: 'RUN',
    remaining: '0 Program',
    time: '00:00:00',
    lastUpdate: '05 Jun 2023 09:58:34'
  },
  {
    machine: 'OKK VP1200',
    name: 'Andi Gunanta Barus',
    photo: 'https://dummyimage.com/600x400/000/fff.png',
    process: '00001',
    status: 'RUN',
    remaining: '0 Program',
    time: '00:00:00',
    lastUpdate: '05 Jun 2023 09:58:34'
  }
  // Tambahkan data lain sesuai kebutuhan...
]
// ntar pake composable

watchEffect(() => {
  console.log('trigger')
})
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault pageTitle="Operator List" />
    <div class="grid grid-cols-3 gap-4">
      <Card
        v-for="(operator, index) in operators"
        :key="index"
        class="p-2 shadow-lg"
        style="max-width: 18rem"
      >
        <template #header>
          <div
            :class="[
              'text-white text-center py-1 font-bold rounded-t-md',
              operator.status === 'RUN'
                ? 'bg-green-500'
                : operator.status === 'IDLE'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            ]"
          >
            {{ operator.machine }}
          </div>
        </template>
        <template #content>
          <div class="flex flex-col items-center mt-2">
            <img class="w-16 h-16 border-2 border-gray-300" :src="operator.photo" alt="Operator" />
            <h4 class="mt-2 font-medium">{{ operator.name || '-' }}</h4>
            <p class="text-sm text-gray-500">{{ operator.process }}</p>
          </div>
          <div class="flex justify-between text-xs mt-2">
            <span>Remaining: {{ operator.remaining }}</span>
            <span>Time: {{ operator.time }}</span>
          </div>
        </template>
        <template #footer>
          <div class="text-right mt-2 text-xs text-gray-400">
            Last Update: {{ operator.lastUpdate }}
          </div>
        </template>
      </Card>
    </div>
  </DefaultLayout>
</template>
