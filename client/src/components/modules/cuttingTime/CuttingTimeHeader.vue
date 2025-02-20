<script setup lang="ts">
import DatePickerMonth from '@/components/Forms/DatePicker/DatePickerMonth.vue'
import { useMachine } from '@/composables/useMachine'
import type { MachineOption } from '@/types/machine.type'
import { MultiSelect, ToggleSwitch } from 'primevue'
import { watchEffect } from 'vue'

const { machineOptions, loadingDropdown, getMachineOptions, handleSelectMachine } = useMachine()

const selectedMachine = defineModel<MachineOption[]>('selectedMachine', {
  required: true
})
const showLabel = defineModel<boolean>('showLabel', { required: true })
const monthValue = defineModel<Date>('monthValue', {
  required: true
})

watchEffect(() => {
  console.log(selectedMachine.value)
})
</script>

<template>
  <div class="flex justify-between gap-2">
    <div class="flex gap-5">
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
