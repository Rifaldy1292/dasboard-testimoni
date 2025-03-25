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
  await fetchOperatorMachine()
  await fetchUsers({ role: 'Operator' })
})

const { fetchUsers, loadingFetch, fetchOperatorMachine, operatorMachines } = useUsers()

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
    /**
     * @example 2.22222 calculate_total_cutting_time
     */
    const {
      Machine,
      createdAt,
      current_status,
      profile_image,
      calculate_total_cutting_time,
      g_code_name
    } = user.detail
    const calculate = calculate_total_cutting_time.split('.')
    const totalProgram = calculate[0]
    const remainingTime = calculate[1]

    const temp = {
      ...user,
      status: current_status,
      remaining: `${totalProgram} Program`,
      time: convertSecondsToHours(Number(remainingTime)),
      lastUpdate: new Date(createdAt).toLocaleString(),
      photo: profile_image,
      process: 'O' + g_code_name.slice(-4),
      machine: `${Machine.name} (${Machine.type}) `
    }
    return temp
  })
  console.log({ result })

  // return multipleResult.flat()
  return result
})

function convertSecondsToHours(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secondsRemainder = seconds % 60

  let result = []
  if (hours > 0) result.push(`${hours}h`)
  if (minutes > 0) result.push(`${minutes}m`)
  if (secondsRemainder > 0) result.push(`${secondsRemainder}s`)

  return result.length > 0 ? result.join(' ') : '0s'
}
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault pageTitle="Remaining" />
    <LoadingAnimation :state="loadingFetch" />
    <DataNotFound :condition="extendendUsers.length === 0" />
    <div v-if="extendendUsers.length > 0" class="grid grid-cols-3 gap-4">
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
          <div class="flex flex-col items-center mt-2 gap-2">
            <div class="flex gap-4 mb-2">
              <div>
                <h4 class="mt-2 font-medium">Process Now</h4>
                <p class="text-sm text-gray-500">{{ operator.process }}</p>
              </div>

              <img
                class="w-20 h-20 border-2 border-gray-300"
                :src="operator.photo || 'https://dummyimage.com/600x400/000/fff.png'"
                alt="Operator"
              />
            </div>
            <div class="flex justify-between text-xs mt-2 gap-2">
              <span>Remaining: {{ operator.remaining }}</span>
              <span>Time: {{ operator.time }}</span>
            </div>
          </div>
        </template>
        <template #footer>
          <Button
            :label="operator.status"
            :severity="operator.status === 'Running' ? 'success' : 'warn'"
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
