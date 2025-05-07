<script setup lang="ts">
import useToast from '@/composables/useToast'
import { Column, DataTable } from 'primevue'
import { shallowRef, inject, watchEffect } from 'vue'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import MachineServices from '@/services/machine.service'
import type { MachineOption } from '@/types/machine.type'

const activeTab = inject('activeTab', shallowRef(0))
const configs = shallowRef<MachineOption[]>([])

watchEffect(async () => {
  if (activeTab.value === 2) {
    return await fetchStartTime()
  }
  configs.value = []
})

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
    <DataTable :value="configs" stripedRows :loading>
      <Column field="name" header="Name"></Column>
      <Column field="type" header="Type"></Column>
      <Column field="ip_address" header="IP Address"></Column>
    </DataTable>
  </div>
</template>
