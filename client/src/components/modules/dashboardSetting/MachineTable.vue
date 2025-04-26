<script setup lang="ts">
import useToast from '@/composables/useToast'
import { Column, DataTable } from 'primevue'
import { onMounted, shallowRef } from 'vue'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import MachineServices from '@/services/machine.service'
import type { MachineOption } from '@/types/machine.type'

onMounted(async () => {
  await fetchStartTime()
})

const configs = shallowRef<MachineOption[]>([])

const toast = useToast()
const loading = shallowRef<boolean>(false)

const fetchStartTime = async () => {
  try {
    loading.value = true
    const { data } = await MachineServices.getMachineOptions()
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
      <Column field="name" header="Name"></Column>
      <Column field="type" header="Type"></Column>
      <Column field="ip_address" header="IP Address"></Column>
    </DataTable>
  </div>
</template>
