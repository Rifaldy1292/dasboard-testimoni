<script setup lang="ts">
import type { Machine } from '@/types/machine.type'
import type { Severity } from '@/types/severity.type'
import { Badge, Button, Column, DataTable } from 'primevue'
import { shallowRef } from 'vue'
import DialogFormMachine from '../DialogForm/DialogFormMachine.vue'

interface Columns {
  field: string
  header: string
  sortable?: boolean
}

interface Operator {
  name: string
  NIK: string
  role: 'Operator' | 'Admin'
  machineName: string
}

const operators: Operator[] = [
  {
    machineName: 'f230fh0g3',
    name: 'John Doe',
    NIK: '123456789',
    role: 'Operator'
  },
  {
    machineName: 'f230fh0g4',
    name: 'John Doe',
    NIK: '123456789',
    role: 'Operator'
  },
  {
    machineName: 'f230fh0g5',
    name: 'John Doe',
    NIK: '123456789',
    role: 'Admin'
  }
]
const selectedMachine = shallowRef<Machine>()
const visibleDialogForm = shallowRef(false)

const columns: Columns[] = [
  { field: 'name', header: 'Name' },
  { field: 'NIK', header: 'NIK' },
  { field: 'machineName', header: 'Machine Name' },
  { field: 'role', header: 'Role' }
]

const badgeSeverity = (role: Operator['role']): Severity => {
  if (role === 'Admin') return 'warn'
  return 'success'
}

const handleClickIcon = (icon: 'edit' | 'details', data: Machine): void => {
  selectedMachine.value = data
  if (icon === 'edit') {
    visibleDialogForm.value = true
    console.log('edit', visibleDialogForm.value)
  }
  // detail
  else {
    sessionStorage.setItem('selectedMachine', JSON.stringify(data))
    console.log('details')
  }
}
</script>

<template>
  <div class="flex justify-end mb-5">
    <Button label="Add Operator" severity="contrast" @click="visibleDialogForm = true" />
  </div>
  <DataTable
    :value="operators"
    :size="'large'"
    lazy
    showGridlines
    tableStyle="min-width: 50rem "
    selection-mode="single"
  >
    <Column
      v-for="col of columns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
      :sortable="col.sortable"
    >
      <template v-if="col.field === 'role'" #body="{ data }">
        <Badge :severity="badgeSeverity(data.role)" :value="data.role" />
      </template>
    </Column>
    <Column :header="'Actions'" class="w-24 !text-end">
      <template #body="{ data }">
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
