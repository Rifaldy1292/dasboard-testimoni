<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import type { Machine } from '@/types/machine.type'
import type { Severity } from '@/types/severity.type'
import { Badge, Column, DataTable } from 'primevue'
import { shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DialogForm from '../DialogForm/DialogForm.vue'

interface Columns {
  field: string
  header: string
  sortable?: boolean
}

const route = useRoute()
const router = useRouter()
const pageTitle = route.name === 'realTime' ? 'Real Time' : 'Manual'

const machine: Machine[] = [
  {
    machineName: 'f230fh0g3',
    runningTime: '7 hour 20 minute',
    status: 'pending',
    quantity: 25
  },
  {
    machineName: 'f230fh0g4',
    runningTime: '7 hour 20 minute',
    status: 'stopped',
    quantity: 25
  },
  {
    machineName: 'f230fh0g5',
    runningTime: '7 hour 20 minute',
    status: 'running',
    quantity: 25
  },
  {
    machineName: 'f230fh0g6',
    runningTime: '7 hour 20 minute',
    status: 'running',
    quantity: 20
  }
]
const selectedMachine = shallowRef<Machine>()
const visibleDialogForm = shallowRef(false)

const columns: Columns[] = [
  { field: 'machineName', header: 'Machine Name' },
  { field: 'runningTime', header: 'Running time (hour)', sortable: true },
  { field: 'status', header: 'Status' },
  { field: 'quantity', header: 'Additional field' }
]

const badgeSeverity = (status: Machine['status']): Severity => {
  if (status === 'running') return 'success'
  if (status === 'stopped') return 'danger'
  return 'warn'
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
    router.push({ name: pageTitle === 'Real Time' ? 'realTimeDetail' : 'manualDetail' })
    console.log('details')
  }
}
</script>

<template>
  <BreadcrumbDefault :pageTitle="pageTitle" />
  <DataTable
    :value="machine"
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
      <template v-if="col.field === 'status'" #body="{ data }">
        <Badge
          v-if="col.field === 'status'"
          :severity="badgeSeverity(data.status)"
          :value="data.status"
        />
      </template>
    </Column>
    <Column :header="'Actions'" class="w-24 !text-end">
      <template #body="{ data }">
        <div class="flex gap-3">
          <i
            v-if="pageTitle === 'Manual'"
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

  <DialogForm :visibleDialogForm="visibleDialogForm" />
</template>
