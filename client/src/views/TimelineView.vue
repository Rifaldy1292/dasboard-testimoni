<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import TimelineMachine from '@/components/modules/machine/TimelineMachine.vue'
import { onMounted, ref, shallowRef, watchEffect } from 'vue'
import type { MachineTimeline } from '@/types/machine.type'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import useToast from '@/utils/useToast'
import { AxiosError } from 'axios'
import MachineServices from '@/services/machine.service'
import { DatePicker, FloatLabel } from 'primevue'

onMounted(async () => {
  await fetchMachines()
})

const toast = useToast()

const value1 = ref<Date>(new Date())
watchEffect(() => {
  console.log('test', new Date())
  console.log(value1.value)
})

const machines = ref<MachineTimeline[]>([])
const isLoading = shallowRef<boolean>(false)

const fetchMachines = async () => {
  try {
    isLoading.value = true
    const { data } = await MachineServices.getTimeline()
    machines.value = data.data
  } catch (error) {
    console.log(error)
    if (error instanceof AxiosError) {
      return toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data.message
      })
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Timeline" />
    <LoadingAnimation :state="isLoading" />
    <template v-if="!isLoading">
      <div class="flex flex-col gap-5 mb-2">
        <div class="flex justify-end">
          <FloatLabel>
            <DatePicker v-model="value1" inputId="over_label" showIcon iconDisplay="input" />
            <label for="over_label">Select Date</label>
          </FloatLabel>
        </div>
        <div
          v-for="machine in machines"
          :key="machine.name"
          class="border border-l-gray-600 dark:border-graydark"
        >
          <TimelineMachine :machine="machine" />
        </div>
      </div>
    </template>
  </DefaultLayout>
</template>
