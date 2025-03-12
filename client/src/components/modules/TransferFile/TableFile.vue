<script setup lang="ts">
import DialogFormMachine from '@/components/DialogForm/DialogFormMachine.vue'
import type { Machine } from '@/types/machine.type'
import { Button, Column, DataTable } from 'primevue'
import { shallowRef } from 'vue'
import { useRouter } from 'vue-router'

interface Columns {
  field: string
  header: string
  sortable?: boolean
}

const router = useRouter()

const machine: Machine[] = [
  {
    machineName: 'f230fh0g5',
    runningTime: '7 hour 20 minute',
    quantity: 25
  },
  {
    machineName: 'f230fh0g6',
    runningTime: '7 hour 20 minute',
    status: 'Running',
    quantity: 25
  }
]
const selectedMachine = shallowRef<Machine>()
const visibleDialogForm = shallowRef(false)

const columns: Columns[] = [{ field: 'machineName', header: 'file name' }]

const handleClickIcon = (icon: 'edit' | 'details', data: Machine): void => {
  selectedMachine.value = data
  if (icon === 'edit') {
    visibleDialogForm.value = true
    console.log('edit', visibleDialogForm.value)
  }
  // detail
  else {
    sessionStorage.setItem('selectedMachine', JSON.stringify(data))
    router.push({ name: 'realTimeDetail' })
    console.log('details')
  }
}
</script>

<template>
  <Button label="Remove All files" severity="warn" @click="visibleDialogForm = true" />
  <DataTable :value="[...machine]" :size="'large'" lazy showGridlines selection-mode="single">
    <Column
      v-for="col of columns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
      :sortable="col.sortable"
    >
    </Column>
    <Column :header="'Actions'" class="!text-end">
      <template #body="{ data }: { data: Machine }">
        <div class="flex gap-3">
          <i
            v-tooltip.top="'Edit'"
            @click="handleClickIcon('edit', data)"
            class="pi pi-pencil"
            style="font-size: 1rem"
          />
          <i
            v-tooltip.top="'Details'"
            @click="handleClickIcon('details', data)"
            class="pi pi-info-circle"
            style="font-size: 1rem"
          />
        </div>
      </template>
    </Column>
  </DataTable>

  <DialogFormMachine
    v-model:visibleDialogForm="visibleDialogForm"
    v-model:selected-machine="selectedMachine"
  />
</template>
