<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DataNotFound from '@/components/common/DataNotFound.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import RemainingCard from '@/components/modules/remaining/RemainingCard.vue'
import { useUsers } from '@/composables/useUsers'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import type { User } from '@/types/user.type'
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
  runningOn: string
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
    const calculate = calculate_total_cutting_time
      ? calculate_total_cutting_time.split('.')
      : ([] as string[])
    const totalProgram = calculate[0] || '-'
    const remainingTime = calculate[1] || '-'

    const gcodeName = g_code_name ? `O${g_code_name.slice(-4)}` : '-'
    const created_at = new Date(createdAt as string)
    const now = new Date()
    const runningOn = now.getTime() - created_at.getTime()

    const temp = {
      ...user,
      status: current_status,
      remaining: `${totalProgram} Program`,
      time: convertSecondsToHours(Number(remainingTime)),
      lastUpdate: created_at.toLocaleString(),
      photo: profile_image,
      process: gcodeName,
      machine: `${Machine.name} (${Machine.type}) `,
      runningOn: convertSecondsToHours(Math.round(runningOn / 1000))
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
    <DataNotFound :condition="!extendendUsers.length" />
    <template v-if="extendendUsers.length">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-6">
        <template v-for="(operator, index) in extendendUsers" :key="index">
          <RemainingCard :operator="operator" />
        </template>
      </div>
    </template>
  </DefaultLayout>
</template>
