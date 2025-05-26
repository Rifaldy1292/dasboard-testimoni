<script setup lang="ts">
import { watch } from 'vue'
import { useFTP } from '@/composables/useFTP'
import { useMachine } from '@/composables/useMachine'
import useToast from '@/composables/useToast'
import MachineServices from '@/services/machine.service'
import type { MachineOption } from '@/types/machine.type'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import { AxiosError } from 'axios'
import { InputNumber, Select, useConfirm } from 'primevue'
import ModalTimeline from './ModalTimeline.vue' // Update import
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import { showConfirmTimeline } from './utils/handleSelectMachine.util'

defineProps<{ isDisableAll: boolean }>()

const toast = useToast()
const confirm = useConfirm()

const {
  selectedOneMachine,
  machineOptions,
  loadingDropdown,
  getMachineOptions,
  additionalOptions,
  selectedCoolant,
  selectedProcessType,
  selectedCoordinate,
  inputStartPoint
} = useMachine()

const {
  uploadType,
  actionOPtions,
  selectedAction,
  selectedWorkPosition,
  inputFiles,
  loadingUpload
} = useFTP()

const { workPositionOptions, coordinateOptions, coolantOptions, processTypeOptions } =
  additionalOptions

// Watch for changes in the selected work position
watch(
  () => selectedWorkPosition.value,
  (newVal) => {
    inputFiles.value = inputFiles.value.map((file) => {
      return {
        ...file,
        workPosition: newVal
      }
    })

    console.log(inputFiles.value, 'new')
  }
)

const handleSelectMachine = async (machineValue: MachineOption | undefined) => {
  if (!machineValue) return
  const { id } = machineValue
  try {
    loadingUpload.value = true
    await MachineServices.getIsReadyTransferFiles({ machine_id: id })
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 422) {
      return showConfirmTimeline(machineValue, confirm)
    }
    handleErrorAPI(error, toast)
  } finally {
    loadingUpload.value = false
  }
}
</script>

<template>
  <ModalTimeline />
  <LoadingAnimation :state="loadingUpload" />
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
            @update:model-value="
              async (val: MachineOption) => {
                selectedOneMachine = val
                handleSelectMachine(val)
              }
            "
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
