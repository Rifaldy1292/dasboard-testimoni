<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, Button, Calendar, InputText } from 'primevue'
import useToast from '@/composables/useToast'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import SettingServices from '@/services/setting.service'

const visible = defineModel<boolean>('visible', {
  required: true
})

const props = defineProps<{
  selectedMonth: Date
}>()

const emit = defineEmits<{
  (e: 'create-success'): void
}>()

const toast = useToast()
const loading = ref(false)

// Form state
const selectedDate = ref<Date | null>(null)
const startFirstShift = ref('08:00:00')
const endFirstShift = ref('16:00:00')
const startSecondShift = ref('16:00:00')
const endSecondShift = ref('00:00:00')

// Computed properties
const minDate = computed(() => {
  const date = new Date(props.selectedMonth)
  date.setDate(1)
  return date
})

const maxDate = computed(() => {
  const date = new Date(props.selectedMonth)
  date.setMonth(date.getMonth() + 1)
  date.setDate(0)
  return date
})

const isFormValid = computed(() => {
  return (
    selectedDate.value !== null &&
    startFirstShift.value &&
    endFirstShift.value &&
    startSecondShift.value &&
    endSecondShift.value
  )
})

// Methods
const resetForm = () => {
  selectedDate.value = null
  startFirstShift.value = '08:00:00'
  endFirstShift.value = '16:00:00'
  startSecondShift.value = '16:00:00'
  endSecondShift.value = '00:00:00'
}

const handleClose = () => {
  resetForm()
  visible.value = false
}

const handleSubmit = async () => {
  if (!isFormValid.value || !selectedDate.value) return

  try {
    loading.value = true

    // Format date to YYYY-MM-DD
    const formattedDate = selectedDate.value.toLocaleDateString('en-CA')

    await SettingServices.createDailyConfig({
      date: formattedDate,
      startFirstShift: startFirstShift.value,
      endFirstShift: endFirstShift.value,
      startSecondShift: startSecondShift.value,
      endSecondShift: endSecondShift.value
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Daily configuration created successfully'
    })

    resetForm()
    emit('create-success')
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :style="{ width: '450px' }"
    header="Create Daily Configuration"
    :modal="true"
    :closable="!loading"
    :closeOnEscape="!loading"
  >
    <div class="p-fluid">
      <div class="field mb-4">
        <label for="date" class="font-bold mb-2 block">Date</label>
        <Calendar
          id="date"
          v-model="selectedDate"
          dateFormat="yy-mm-dd"
          :minDate="minDate"
          :maxDate="maxDate"
          :disabled="loading"
          showIcon
          required
        />
      </div>

      <div class="field mb-4">
        <label for="startFirstShift" class="font-bold mb-2 block">Start First Shift</label>
        <InputText
          id="startFirstShift"
          v-model="startFirstShift"
          type="time"
          step="1"
          :disabled="loading"
          required
        />
      </div>

      <div class="field mb-4">
        <label for="endFirstShift" class="font-bold mb-2 block">End First Shift</label>
        <InputText
          id="endFirstShift"
          v-model="endFirstShift"
          type="time"
          step="1"
          :disabled="loading"
          required
        />
      </div>

      <div class="field mb-4">
        <label for="startSecondShift" class="font-bold mb-2 block">Start Second Shift</label>
        <InputText
          id="startSecondShift"
          v-model="startSecondShift"
          type="time"
          step="1"
          :disabled="loading"
          required
        />
      </div>

      <div class="field mb-4">
        <label for="endSecondShift" class="font-bold mb-2 block">End Second Shift</label>
        <InputText
          id="endSecondShift"
          v-model="endSecondShift"
          type="time"
          step="1"
          :disabled="loading"
          required
        />
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        class="p-button-text"
        @click="handleClose"
        :disabled="loading"
      />
      <Button
        label="Save"
        icon="pi pi-check"
        @click="handleSubmit"
        :disabled="!isFormValid || loading"
        :loading="loading"
      />
    </template>
  </Dialog>
</template>
