<script setup lang="ts">
import { Button, Inplace, InputNumber } from 'primevue'
import { computed, shallowRef } from 'vue'
import SettingServices from '@/services/setting.service'
import useToast from '@/composables/useToast'
import { useMachine } from '@/composables/useMachine'

type ColorCount = {
  green: number
  yellow: number
  red: number
}

const toast = useToast()
const { cuttingTimeMachines } = useMachine()
const isUpdating = shallowRef(false)

// Get target_shift directly from cutting time data
const colorCount = computed(() => {
  return cuttingTimeMachines.value?.target_shift || {
    green: 10,
    yellow: 8,
    red: 8
  }
})

// Debounce timer
let debounceTimer: number | null = null

// Function to update color thresholds in database with debouncing
const updateColorThreshold = (colorKey: keyof ColorCount, newValue: number) => {
  if (!cuttingTimeMachines.value) {
    console.error('No cutting time machine data available')
    return
  }

  // Update local state immediately for responsive UI
  cuttingTimeMachines.value.target_shift[colorKey] = newValue

  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // Set up debounced API call
  debounceTimer = setTimeout(async () => {
    try {
      isUpdating.value = true

      // Prepare the target_shift object for the API
      const target_shift = {
        green: cuttingTimeMachines.value!.target_shift.green,
        yellow: cuttingTimeMachines.value!.target_shift.yellow,
        red: cuttingTimeMachines.value!.target_shift.red
      }

      // Call the API to update the database
      await SettingServices.pacthEditCuttingTime(cuttingTimeMachines.value?.id!, {
        target_shift
      })

      toast.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Color thresholds updated successfully',
        life: 3000
      })
    } catch (error) {
      if (error instanceof Error) {
        toast.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: error.message,
          life: 3000
        })
        return
      }
      console.error('Error updating color threshold:', error)
      toast.add({
        severity: 'error',
        summary: 'Update Failed',
        detail: 'Failed to save color threshold changes',
        life: 3000
      })
    } finally {
      isUpdating.value = false
    }
  }, 800) // Wait 800ms after the last change before saving
}

const colorInformation = computed<
  { color: string; label: string; value: number; colorText: keyof ColorCount }[]
>(() => [
  {
    color: '#22c55e',
    colorText: 'green',
    label: `Target >= ${colorCount.value.green}`,
    value: colorCount.value.green
  },
  {
    color: '#f59e0b',
    colorText: 'yellow',
    label: `Mendekati >= ${colorCount.value.yellow}`,
    value: colorCount.value.yellow
  },
  {
    color: '#ef4444',
    colorText: 'red',
    label: `Tidak Target < ${colorCount.value.red}`,
    value: colorCount.value.red
  }
])
</script>

<template>
  <div class="flex gap-15 border-y border-stroke px-6 py-7.5 dark:border-strokedark">
    <template v-for="item of colorInformation" :key="item.label">
      <Inplace class="flex gap-2 cursor-pointer">
        <template #display>
          <div class="w-10 h-10" :style="{ backgroundColor: item.color }" />
          <span>{{ item.label }}</span>
          <i v-if="isUpdating" class="pi pi-spinner pi-spin ml-2 text-gray-500" />
        </template>
        <template #content="{ closeCallback }">
          <div class="flex gap-2">
            <InputNumber
              @update:model-value="(newValue) => updateColorThreshold(item.colorText, newValue)"
              :model-value="item.value"
              :min="1"
              :max="100"
              :disabled="isUpdating"
              inputId="input-number"
              :style="{ backgroundColor: item.color, color: '#fff' }"
              :aria-label="item.label"
            />
            <!-- icon x red -->
            <Button severity="danger" icon="pi pi-times" @click="closeCallback" />
          </div>
        </template>
      </Inplace>
    </template>
  </div>
</template>
