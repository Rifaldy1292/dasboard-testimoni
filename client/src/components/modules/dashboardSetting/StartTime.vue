<script setup lang="ts">
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/composables/useToast'
import { Column, DataTable, DatePicker, useConfirm, type DatePickerBlurEvent } from 'primevue'
import { onMounted, ref, shallowRef, watchEffect } from 'vue'
import SettingServices from '@/services/setting.service'
import type { DailyConfig } from '@/types/dailyConfig.type'
import DatePickerMonth from '@/components/common/DatePickerMonth.vue'

const configs = ref<DailyConfig[]>([])

const confirm = useConfirm()
const toast = useToast()
const selectedDate = ref<Date>()
const selectedMonth = shallowRef<Date>(new Date())
const id = shallowRef<number | null>(null)
const dateFromServer = ref<Date>()
const loading = shallowRef<boolean>(false)

const handleEditStartTime = async (target: DatePickerBlurEvent | EventTarget) => {
  try {
    let timeString: string
    if (target instanceof EventTarget) {
      timeString = (target as HTMLInputElement).value
    } else {
      timeString = (target as DatePickerBlurEvent).value
    }

    console.log(timeString, 99)
    const [hours, minute] = timeString.split(':')
    const date = new Date()
    date.setHours(Number(hours), Number(minute))
    selectedDate.value = date
    if (
      (Number(hours) === dateFromServer.value?.getHours() &&
        Number(minute) === dateFromServer.value?.getMinutes()) ||
      !selectedDate.value
    )
      return

    // console.log({ hours, minute })
    confirm.require({
      header: `Change Start time to ${hours}:${minute}`,
      message: 'Are you sure you want to proceed?',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      acceptProps: {
        label: 'Change',
        severity: 'success'
      },
      accept: () => {
        editStartTime()
      }
    })
  } catch (error) {
    handleErrorAPI(error, toast)
  }
}

const editStartTime = async (): Promise<void> => {
  try {
    loading.value = true
    const { data } = await SettingServices.putStartTIme({
      reqStartHour: Number(selectedDate.value?.getHours()),
      reqStartMinute: Number(selectedDate.value?.getMinutes()),
      id: id.value as number
    })
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: data.message
    })
    await fetchStartTime()
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
}

const fetchStartTime = async () => {
  try {
    loading.value = true
    const { data } = await SettingServices.getStartTime()
    // console.log(data)
    const date = new Date(new Date().setHours(data.data.startHour, data.data.startMinute))
    selectedDate.value = date
    dateFromServer.value = date
    id.value = data.data.id
  } catch (error) {
    console.log(error)
  } finally {
    loading.value = false
  }
}

watchEffect(async () => {
  console.log(selectedMonth.value)
  loading.value = true
  await fetchStartTime()
  // format 2022-01-01
  try {
    const { data } = await SettingServices.getListConfig({
      period: selectedMonth.value.toISOString()
    })
    configs.value = data.data
    console.log(configs.value, 'data')
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mb-0.5 p-5 flex justify-between">
    <!-- <FormField name="name"> -->
    <div>
      <label class="mb-3 block text-sm font-medium text-black dark:text-white">Start Time</label>
      <div class="relative flex items-center">
        <DatePicker
          v-model="selectedDate"
          :default-value="selectedDate"
          timeOnly
          fluid
          dateFormat="hh:mm"
          @blur="handleEditStartTime($event)"
          @keydown="
            ($event) => {
              if (($event as KeyboardEvent).key === 'Enter' && $event.target) {
                // console.log(true, $event.target)
                handleEditStartTime($event.target)
              }
            }
          "
        />
      </div>
    </div>

    <DatePickerMonth v-model:month-value="selectedMonth" />
  </div>

  <!-- DataTable untuk menampilkan konfigurasi -->
  <div class="p-4">
    <DataTable :value="configs" stripedRows>
      <Column field="date" header="Date"></Column>
      <Column field="startFirstShift" header="Start 1"></Column>
      <Column field="endFirstShift" header="End 1"></Column>
      <Column field="startSecondShift" header="Start 2"></Column>
      <Column field="endSecondShift" header="End 2"></Column>
    </DataTable>
  </div>
</template>
