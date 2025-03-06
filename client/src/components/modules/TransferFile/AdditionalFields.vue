<script setup lang="ts">
import { useMachine } from '@/composables/useMachine'
import { useUsers } from '@/composables/useUsers'
import { Select } from 'primevue'
import { shallowRef } from 'vue'

const { selectedOneMachine, machineOptions, loadingDropdown, getMachineOptions } = useMachine()

const { users, user, loadingUserDropdown, fetchUsers } = useUsers()

const additionalOptions: Record<string, Array<number>> = {
  programNumberOptions: [1000, 2000, 3000, 4000, 5000],
  workPositionOptions: [50, 52, 54, 56],
  coordinateOptions: [43, 143],
  coolantOptions: [8, 50]
}

const selectedProgramNumber = shallowRef<number>(additionalOptions.programNumberOptions[0])
const selectedWorkPosition = shallowRef<number>(additionalOptions.workPositionOptions[2])
const selectedCoordinate = shallowRef<number>(additionalOptions.coordinateOptions[0])
const selectedCoolant = shallowRef<number>(additionalOptions.coolantOptions[1])
</script>

<template>
  <div class="mb-5.5">
    <!-- <FormField name="name"> -->
    <div>
      <label class="mb-3 block text-sm font-medium text-black dark:text-white">Machine Name</label>
      <div class="relative flex items-center">
        <Select
          filter
          :model-value="selectedOneMachine"
          @update:model-value="selectedOneMachine = $event"
          @before-show="getMachineOptions"
          :loading="loadingDropdown"
          :options="machineOptions"
          optionLabel="name"
          placeholder="Select a Machine"
          fluid
        />
      </div>
    </div>
    <!-- </FormField> -->
  </div>

  <!-- Operator Section -->
  <div class="mb-5.5">
    <!-- <FormField name="name"> -->
    <div>
      <label class="mb-3 block text-sm font-medium text-black dark:text-white">Operator Name</label>
      <div class="relative flex items-center">
        <Select
          filter
          :model-value="user"
          @update:model-value="user = $event"
          @before-show="fetchUsers({ role: 'Operator' })"
          :loading="loadingUserDropdown"
          :options="users"
          optionLabel="name"
          placeholder="Select Operator"
          fluid
        />
      </div>
    </div>

    <!-- </FormField> -->
  </div>

  <!-- Operator Section -->
  <div class="mb-5.5">
    <!-- <FormField name="name"> -->
    <div>
      <label class="mb-3 block text-sm font-medium text-black dark:text-white"
        >Program Number</label
      >
      <div class="relative flex items-center">
        <Select
          filter
          :model-value="selectedProgramNumber"
          @update:model-value="user = $event"
          :options="additionalOptions.programNumberOptions"
          placeholder="Select Program Number"
          fluid
        />
      </div>
    </div>

    <!-- </FormField> -->
  </div>

  <!-- Operator Section -->
  <div class="mb-5.5">
    <!-- <FormField name="name"> -->
    <div>
      <label class="mb-3 block text-sm font-medium text-black dark:text-white">Work Position</label>
      <div class="relative flex items-center">
        <Select
          filter
          :model-value="selectedWorkPosition"
          @update:model-value="user = $event"
          :options="additionalOptions.workPositionOptions"
          placeholder="Select Work Position"
          fluid
        />
      </div>
    </div>

    <!-- </FormField> -->
  </div>

  <!-- Operator Section -->
  <div class="mb-5.5">
    <!-- <FormField name="name"> -->
    <div>
      <label class="mb-3 block text-sm font-medium text-black dark:text-white">Coordinate</label>
      <div class="relative flex items-center">
        <Select
          filter
          :model-value="selectedCoordinate"
          @update:model-value="user = $event"
          :options="additionalOptions.coordinateOptions"
          placeholder="Select Coordinate"
          fluid
        />
      </div>
    </div>

    <!-- </FormField> -->
  </div>

  <!-- Operator Section -->
  <div class="mb-5.5">
    <!-- <FormField name="name"> -->
    <div>
      <label class="mb-3 block text-sm font-medium text-black dark:text-white">Coolant</label>
      <div class="relative flex items-center">
        <Select
          filter
          :model-value="selectedCoolant"
          @update:model-value="user = $event"
          :options="additionalOptions.coolantOptions"
          placeholder="Select Coolant"
          fluid
        />
      </div>
    </div>
  </div>
</template>
