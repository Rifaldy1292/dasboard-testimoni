<script setup lang="ts">
import type { UserLocalStorage } from '@/types/localStorage.type'
import type { User } from '@/types/user.type'
import { Button, Card, Checkbox, Knob, Message, Select } from 'primevue'
import { inject, shallowRef } from 'vue'

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

defineProps<{
  operator: ExtendedUser
}>()

const userData = inject('userData') as UserLocalStorage

const dropdownOptions = [
  {
    label: 'Dandori Tool',
    value: 'Dandori Tool'
  },
  {
    label: 'Dandori apa',
    value: 'Dandori apa'
  }
]

const selectedOptions = shallowRef<string | undefined>()
const isChecked = shallowRef<boolean>(false)
</script>

<template>
  <Card class="p-4 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl transition-all duration-300">
    <template #header>
      <div
        :class="[
          'text-white text-center py-2 font-semibold rounded-t-xl',
          operator.status === 'Running' ? 'bg-green-600' : 'bg-red-600'
        ]"
      >
        <div class="border-b border-white inline-block pb-1">
          {{ operator.machine }}
        </div>
        <div class="text-sm mt-1">Operator by {{ operator.name }}</div>
      </div>
    </template>

    <template #content>
      <div class="flex flex-col items-center mt-3 gap-3">
        <div class="flex items-center justify-between gap-4 w-full">
          <div>
            <h4 class="font-medium text-gray-700 dark:text-gray-200">Process Now</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ operator.process || '-' }}
            </p>
          </div>

          <img
            class="w-24 h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
            :src="operator.photo || 'https://dummyimage.com/600x400/000/fff.png'"
            alt="Operator"
          />
        </div>

        <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300 w-full mt-2">
          <span>Remaining: {{ operator.remaining }}</span>
          <span>Time: {{ operator.time }}</span>
        </div>
      </div>
    </template>

    <template #footer>
      <Message
        :severity="isChecked ? 'success' : 'error'"
        class="w-full mt-3 text-center font-bold text-2xl"
        size="large"
        :icon="`${isChecked ? 'pi pi-spin pi-cog' : 'pi pi-times'}`"
        >{{ selectedOptions ?? '-' }}</Message
      >

      <div
        v-if="userData.role === 'Admin'"
        :class="`${isChecked ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-800' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600'} w-full flex rounded-lg gap-2 justify-center items-center p-2 mt-2`"
      >
        <Select
          class="rounded-md flex-1 bg-transparent"
          :options="dropdownOptions"
          v-model:model-value="selectedOptions"
          outlined
          option-label="label"
          option-value="value"
        />
        <Checkbox v-model:modelValue="isChecked" binary />
      </div>

      <div class="text-right mt-3 text-xs text-gray-500 dark:text-gray-400">
        <Knob default-value="50" :min="0" :max="100" :step="1" />

        <span>Running On: {{ operator.runningOn }}</span>
        <br />
        <span>Last Update: {{ operator.lastUpdate }}</span>
      </div>
    </template>
  </Card>
</template>
