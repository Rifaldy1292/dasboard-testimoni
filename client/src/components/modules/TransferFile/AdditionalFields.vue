<script setup lang="ts">
import { useFTP } from '@/composables/useFTP'
import { useMachine } from '@/composables/useMachine'
import { useUsers } from '@/composables/useUsers'
import { InputText, Select } from 'primevue'

defineProps<{ isDisableAll: boolean }>()

const {
  selectedOneMachine,
  machineOptions,
  loadingDropdown,
  getMachineOptions,
  additionalOptions,
  selectedCoolant,
  selectedCoordinate,
  selectedWorkPosition,
  selectedProgramNumber,
  inputFileName,
  selectedStartPoint
} = useMachine()

const { uploadType } = useFTP()

const { users, user, loadingUserDropdown, fetchUsers } = useUsers()

const {
  programNumberOptions,
  workPositionOptions,
  coordinateOptions,
  coolantOptions,
  startPointOptions
} = additionalOptions
</script>

<template>
  <!-- 1/2 -->
  <div
    :style="{
      'pointer-events': isDisableAll ? 'none' : 'auto',
      cursor: isDisableAll ? 'not-allowed' : 'pointer'
    }"
    class="grid grid-cols-3 gap-5"
  >
    <div class="mb-0.5">
      <!-- <FormField name="name"> -->
      <div>
        <label class="mb-3 block text-sm font-medium text-black dark:text-white"
          >Machine Name</label
        >
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
            :disabled="isDisableAll"
          />
        </div>
      </div>
      <!-- </FormField> -->
    </div>

    <!-- Operator Section -->
    <div class="mb-0.5">
      <!-- <FormField name="name"> -->
      <div>
        <label class="mb-3 block text-sm font-medium text-black dark:text-white"
          >Operator Name</label
        >
        <div class="relative flex items-center">
          <Select
            filter
            :model-value="user"
            @before-show="fetchUsers({ role: 'Operator' })"
            @update:model-value="user = $event"
            :loading="loadingUserDropdown"
            :options="users"
            optionLabel="name"
            placeholder="Select Operator"
            fluid
            :disabled="isDisableAll"
          />
        </div>
      </div>

      <!-- </FormField> -->
    </div>

    <!-- Operator Section -->
    <div class="mb-0.5">
      <!-- <FormField name="name"> -->
      <div>
        <label class="mb-3 block text-sm font-medium text-black dark:text-white"
          >Program Number</label
        >
        <div class="relative flex items-center">
          <Select
            filter
            :model-value="selectedProgramNumber"
            :options="programNumberOptions"
            placeholder="Select Program Number"
            fluid
            :disabled="isDisableAll"
          />
        </div>
      </div>

      <!-- </FormField> -->
    </div>

    <!-- Operator Section -->
    <div class="mb-0.5">
      <!-- <FormField name="name"> -->
      <div>
        <label class="mb-3 block text-sm font-medium text-black dark:text-white"
          >Work Position</label
        >
        <div class="relative flex items-center">
          <Select
            filter
            :model-value="selectedWorkPosition"
            :options="workPositionOptions"
            placeholder="Select Work Position"
            fluid
            :disabled="isDisableAll"
          />
        </div>
      </div>

      <!-- </FormField> -->
    </div>

    <!-- Operator Section -->
    <div class="mb-0.5">
      <!-- <FormField name="name"> -->
      <div>
        <label class="mb-3 block text-sm font-medium text-black dark:text-white"
          >Coordinate (143 for zooler)</label
        >
        <div class="relative flex items-center">
          <Select
            filter
            :model-value="selectedCoordinate"
            :options="coordinateOptions"
            placeholder="Select Coordinate"
            fluid
            :disabled="isDisableAll"
          />
        </div>
      </div>

      <!-- </FormField> -->
    </div>

    <!-- Operator Section -->
    <div class="mb-0.5">
      <!-- <FormField name="name"> -->
      <div>
        <label class="mb-3 block text-sm font-medium text-black dark:text-white">Start Point</label>
        <div class="relative flex items-center">
          <Select
            filter
            :model-value="selectedStartPoint"
            :options="startPointOptions"
            placeholder="Select Start Point"
            fluid
            :disabled="isDisableAll"
          />
        </div>
      </div>
    </div>

    <!-- Operator Section -->
    <div class="mb-0.5">
      <!-- <FormField name="name"> -->
      <div>
        <label class="mb-3 block text-sm font-medium text-black dark:text-white">Coolant</label>
        <div class="relative flex items-center">
          <Select
            filter
            :model-value="selectedCoolant"
            :options="coolantOptions"
            placeholder="Select Coolant"
            fluid
            :disabled="isDisableAll"
          />
        </div>
      </div>
    </div>

    <div class="mb-0.5">
      <!-- <FormField name="name"> -->
      <div>
        <label class="mb-3 block text-sm font-medium text-black dark:text-white"
          >Output File Name Main Program
        </label>
        <div class="relative flex items-center">
          <InputText
            filter
            :model-value="inputFileName"
            placeholder="Input File Name"
            fluid
            :disabled="isDisableAll"
          />
        </div>
      </div>
    </div>

    <div class="mb-0.5">
      <!-- <FormField name="name"> -->
      <div>
        <label class="mb-3 block text-sm font-medium text-black dark:text-white">Upload Type</label>

        <div class="relative flex items-center">
          <Select
            :model-value="uploadType"
            @update:model-value="uploadType = $event"
            :options="['folder', 'file']"
            :disabled="isDisableAll"
            filter
            placeholder="Select Upload Type"
            fluid
          />
        </div>
      </div>
    </div>
  </div>
</template>
