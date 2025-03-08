<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import MachineServices from '@/services/machine.service'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/utils/useToast'
import { DatePicker, useConfirm } from 'primevue'
import { onMounted, ref, shallowRef } from 'vue'

onMounted(async () => {
  await fetchStartTime()
})

const confirm = useConfirm()
const toast = useToast()
const selectedDate = ref<Date>()
const dateFromServer = ref<Date>()
const loading = shallowRef<boolean>(false)

// watch([() => selectedDate.value, () => dateFromServer.value], ([reqDate, serverDate]) => {
//   if (reqDate !== serverDate) {
//     handleEditStartTime(reqDate as Date)
//   }
// })

const handleEditStartTime = async () => {
  try {
    if (selectedDate.value === dateFromServer.value || !selectedDate.value) return
    const hours = selectedDate.value.getHours()
    const minute = selectedDate.value.getMinutes()
    console.log({ hours, minute })
    confirm.require({
      header: `Change Start time to${hours}:${minute}`,
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
      accept: async (): Promise<void> => {
        try {
          loading.value = true
          const { data } = await MachineServices.putStartTIme({
            reqStartHour: hours,
            reqStartMinute: minute
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
    })
  } catch (error) {
    handleErrorAPI(error, toast)
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
    <div>
      <DatePicker
        v-model:modelValue="selectedDate"
        timeOnly
        dateFormat="hh:mm"
        @hide="handleEditStartTime"
      />
    </div>
  </DefaultLayout>
</template>
