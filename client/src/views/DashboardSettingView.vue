<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import MachineServices from '@/services/machine.service'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/composables/useToast'
import { DatePicker, useConfirm, type DatePickerBlurEvent } from 'primevue'
import { onMounted, ref, shallowRef } from 'vue'

onMounted(async () => {
  await fetchStartTime()
})

const confirm = useConfirm()
const toast = useToast()
const selectedDate = ref<Date>()
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
    const { data } = await MachineServices.putStartTIme({
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
    const { data } = await MachineServices.getStartTime()
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
</script>

<template>
  <DefaultLayout>
    <!-- Breadcrumb Start -->
    <BreadcrumbDefault pageTitle="Dashboard Settings" />
    <LoadingAnimation :state="loading" />
    <!-- Breadcrumb End -->
    <div class="border-b border-stroke py-4 px-7 dark:border-strokedark">
      <h3 class="font-medium text-black dark:text-white text-center">
        Dashboard Configuration Settings
      </h3>
    </div>
    <!-- hour/minute -->
    <div class="grid grid-cols-4 p-2 gap-5">
      <div class="mb-0.5">
        <!-- <FormField name="name"> -->
        <div>
          <label class="mb-3 block text-sm font-medium text-black dark:text-white"
            >Start Time</label
          >
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
      </div>
    </div>
  </DefaultLayout>
</template>
