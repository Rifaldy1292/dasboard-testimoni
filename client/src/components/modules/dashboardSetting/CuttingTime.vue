<script setup lang="ts">
import useToast from '@/composables/useToast'
import { Column, DataTable } from 'primevue'
import { onMounted, shallowRef } from 'vue'
import SettingServices from '@/services/setting.service'
import { handleErrorAPI } from '@/utils/handleErrorAPI'

onMounted(async () => {
  await fetchStartTime()
})

const configs = shallowRef<{ id: number; target: number; period: string }[]>([])

const toast = useToast()
const loading = shallowRef<boolean>(false)

const fetchStartTime = async () => {
  try {
    loading.value = true
    const { data } = await SettingServices.getListCuttingTime()
    // console.log(data)
    configs.value = data.data
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- DataTable untuk menampilkan konfigurasi -->
  <div class="p-4">
    <DataTable :value="configs" stripedRows>
      <Column field="period" header="Period"></Column>
      <Column field="target" header="Target"></Column>
    </DataTable>
  </div>
</template>
