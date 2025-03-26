<script setup lang="ts">
import { useFTP } from '@/composables/useFTP'
import { useMachine } from '@/composables/useMachine'
import { InputNumber, Select } from 'primevue'
import { watch } from 'vue'

defineProps<{ isDisableAll: boolean }>()

const {
  selectedOneMachine,
  machineOptions,
  loadingDropdown,
  getMachineOptions,
  additionalOptions,
  selectedCoolant,
  selectedProcessType,
  selectedCoordinate,
  selectedWorkPosition,
  inputStartPoint,
  selectedProgramNumber
} = useMachine()

const { uploadType, actionOPtions, selectedAction } = useFTP()

const { workPositionOptions, coordinateOptions, coolantOptions, processTypeOptions } =
  additionalOptions

watch(
  [() => selectedOneMachine.value?.name, () => selectedWorkPosition.value],
  ([machineName, workPosition]) => {
    if (machineName === 'MC-16') {
      selectedProgramNumber.value = workPosition - 24
    }
  }
)
</script>

<template>
  <!-- 1/2 -->
  <div
    :style="{
      cursor: isDisableAll ? 'not-allowed' : 'pointer'
    }"
    class="grid grid-cols-3 gap-5"
  >
    <div class="mb-0.5">
      <!-- <FormField name="name"> -->
      <div>
        <label class="mb-3 block text-sm font-medium text-black dark:text-white">Actions</label>
        <div class="relative flex items-center">
          <Select
            filter
            v-model:model-value="selectedAction"
            :options="actionOPtions"
            placeholder="Select Action"
            fluid
            :disabled="isDisableAll"
          />
        </div>
      </div>
      <!-- </FormField> -->
    </div>

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

    <template v-if="selectedAction === 'Upload File'">
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
              v-model:model-value="selectedWorkPosition"
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
              v-model:model-value="selectedCoordinate"
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
          <label class="mb-3 block text-sm font-medium text-black dark:text-white"
            >Start Point</label
          >
          <div class="relative flex items-center">
            <InputNumber
              v-model:model-value="inputStartPoint"
              placeholder="Select Start Point"
              fluid
              :useGrouping="false"
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
              v-model:model-value="selectedCoolant"
              :options="coolantOptions"
              placeholder="Select Coolant"
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
          <label class="mb-3 block text-sm font-medium text-black dark:text-white"
            >Process Type</label
          >
          <div class="relative flex items-center">
            <Select
              filter
              v-model:model-value="selectedProcessType"
              :options="processTypeOptions"
              placeholder="Select Process Type"
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
            >Upload Type</label
          >

          <div class="relative flex items-center">
            <Select
              v-model:model-value="uploadType"
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
    </template>
  </div>
</template>
