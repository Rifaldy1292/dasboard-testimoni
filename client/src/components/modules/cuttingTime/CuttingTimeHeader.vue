<script setup lang="ts">
import DatePickerMonth from '@/components/common/DatePickerMonth.vue'
import { useMachine } from '@/composables/useMachine'
import { MultiSelect, ToggleSwitch } from 'primevue'

const {
  machineOptions,
  loadingDropdown,
  getMachineOptions,
  handleSelectMachine,
  selectedMachine,
  cuttingTimeMachines
} = useMachine()

const showLabel = defineModel<boolean>('showLabel', { required: true })
const monthValue = defineModel<Date>('monthValue', {
  required: true
})
</script>

<template>
  <div class="flex justify-between gap-2">
    <div :class="`flex gap-5 ${!cuttingTimeMachines && 'opacity-0'}`">
      <MultiSelect
        v-model:model-value="selectedMachine"
        @before-show="getMachineOptions"
        @before-hide="handleSelectMachine"
        display="chip"
        :options="machineOptions"
        :loading="loadingDropdown"
        optionLabel="name"
        filter
        placeholder="All Machine"
        :maxSelectedLabels="3"
        class="w-full md:w-80"
      />
      <div class="flex flex-col items-center">
        <label for="toggle-label">Show Label</label>
        <ToggleSwitch v-model="showLabel" ariaLabel="toggle-label">
          <template #handle="{ checked }">
            <i :class="['!text-xs pi', { 'pi-check': checked, 'pi-times': !checked }]" />
          </template>
        </ToggleSwitch>
      </div>
    </div>

    <DatePickerMonth v-model:month-value="monthValue" />
  </div>
</template>
