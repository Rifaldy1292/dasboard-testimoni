<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import type { Machine } from '@/types/machine.type'
import type { Severity } from '@/types/severity.type'
import { Badge, Button, Column, DataTable, useToast } from 'primevue'
import DialogFormMachine from '../DialogForm/DialogFormMachine.vue'
import type { Role, User } from '@/types/user.type'
import UserServices from '@/services/user.service'
import { onMounted } from 'vue'

onMounted(() => {
  fetchUsers()
})

interface Columns {
  field: string
  header: string
  sortable?: boolean
}

interface Operator {
  name: string
  NIK: string
  role: Role
  machineName: string
}

const toast = useToast()

const operators = ref<User[]>([])
const selectedMachine = shallowRef<Machine>()
const visibleDialogForm = shallowRef(false)

const columns: Columns[] = [
  { field: 'name', header: 'Name' },
  { field: 'NIK', header: 'NIK' },
  { field: 'machineName', header: 'Machine Name' },
  { field: 'roleName', header: 'Role' }
]

const badgeSeverity = (role: User['roleName']): Severity => {
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

const fetchUsers = async (): Promise<void> => {
  try {
    const { data } = await UserServices.getUsers()
    operators.value = data.data
    console.log(data.data)
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'error',
      detail: 'failed to get user list'
    })
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
      <template #body="{ data }">
        <template v-if="col.field === 'roleName'">
          <Badge
            v-if="col.field === 'roleName'"
            :severity="badgeSeverity(data.roleName)"
            :value="data.roleName ?? '-'"
          />
        </template>
        <template v-else>
          {{ data[col.field] ?? '-' }}
        </template>
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
