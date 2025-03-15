<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DataNotFound from '@/components/common/DataNotFound.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import { useUsers } from '@/composables/useUsers'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import type { User } from '@/types/user.type'
import { Button, Card } from 'primevue'
import { computed, onMounted } from 'vue'

onMounted(async () => {
  await fetchUsers({ role: 'Operator' })
  await fetchOperatorMachine()
})

const { fetchUsers, loadingFetch, users, fetchOperatorMachine, operatorMachines } = useUsers()

interface ExtendedUser extends User {
  status: 'Running' | 'Stopped'
  remaining: string
  time: string
  lastUpdate: string
  photo: string
  process: string
  machine: string
}
const extendendUsers = computed<ExtendedUser[]>(() => {
  const result = operatorMachines.value.map((user) => {
    const { Machine, createdAt, total_cutting_time, current_status } = user.detail
    const random = Math.floor(Math.random() * 10)
    const temp = {
      ...user,
      status: current_status,
      remaining: total_cutting_time || '0 Program',
      time: total_cutting_time || '00:00:00',
      lastUpdate: new Date(createdAt).toLocaleString(),
      photo: user.profile_image || 'https://dummyimage.com/600x400/000/fff.png',
      process: '00001(M06 ATC)',
      machine: Machine.name || random % 2 === 0 ? 'OKK VM5' : 'OKK VP1200'
    }
    return temp
  })
  const multipleResult = Array.from({ length: 3 }, () => result)

  return multipleResult.flat()
})
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault pageTitle="Operator List" />
    <LoadingAnimation :state="loadingFetch" />
    <DataNotFound :condition="users.length === 0" tittle="Operators" />
    <div v-if="users.length > 0" class="grid grid-cols-3 gap-4">
      <Card
        v-for="(operator, index) in extendendUsers"
        :key="index"
        class="p-2 shadow-lg"
        style="max-width: 18rem"
      >
        <template #header>
          <div
            :class="[
              'text-white dark:text-white text-center py-1 font-bold rounded-t-md',
              operator.status === 'Running' ? 'bg-green-500' : 'bg-red-500'
            ]"
          >
            <!-- agar ada garis dibawah -->
            <span class="border-b border-white">{{ operator.machine }}</span>
            <br />
            <span>{{ `Operator by ${operator.name}` }}</span>
          </div>
        </template>
        <template #content>
          <div class="flex flex-col items-center mt-2">
            <div class="flex gap-4 mb-2">
              <div>
                <h4 class="mt-2 font-medium">Process Now</h4>
                <p class="text-sm text-gray-500">{{ operator.process }}</p>
              </div>

              <img
                class="w-20 h-20 border-2 border-gray-300"
                :src="operator.photo"
                alt="Operator"
              />
            </div>
            <div class="flex justify-between text-xs mt-2">
              <span>Remaining: {{ operator.remaining }}</span>
              <span>Time: {{ operator.time }}</span>
            </div>
          </div>
        </template>
        <template #footer>
          <Button
            :label="operator.status"
            :severity="operator.status === 'RUN' ? 'success' : 'warn'"
            class="w-full mt-2"
            outlined
            size="small"
          />
          <div class="text-right mt-2 text-xs text-gray-400">
            Last Update: {{ operator.lastUpdate }}
          </div>
        </template>
      </Card>
    </div>
  </DefaultLayout>
</template>
