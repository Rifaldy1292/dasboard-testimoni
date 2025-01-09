<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import type { Severity } from '@/types/severity.type'
import { Badge, Button, Column, DataTable, useConfirm } from 'primevue'
import type { User } from '@/types/user.type'
import UserServices from '@/services/user.service'
import { onMounted } from 'vue'
import CreateUser from './CreateUser.vue'
import useToast from '@/utils/useToast'

onMounted(() => {
  fetchUsers()
})

interface Columns {
  field: string
  header: string
  sortable?: boolean
}

const toast = useToast()
const confirm = useConfirm()
const columns: Columns[] = [
  { field: 'name', header: 'Name' },
  { field: 'NIK', header: 'NIK' },
  { field: 'machineName', header: 'Machine Name' },
  { field: 'roleName', header: 'Role' }
]

const operators = ref<User[]>([])
const selectedUser = shallowRef<User | undefined>()
const visibleDialogForm = shallowRef(false)

const badgeSeverity = (role: User['role']): Severity => {
  if (role === 'Admin') return 'warn'
  return 'success'
}

const handleDeleteUser = async (): Promise<void> => {
  try {
    if (!selectedUser.value) return console.error('no user selected')
    await UserServices.deleteById(selectedUser.value.id)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${selectedUser.value.name} has been deleted`
    })
    await fetchUsers()
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'error',
      detail: `failed to delete ${selectedUser.value?.name}`
    })
  }
}

const handleClickIcon = (icon: 'resetPassword' | 'delete', data: User): void => {
  selectedUser.value = data
  if (icon === 'delete') {
    console.log('delete', visibleDialogForm.value)
    confirm.require({
      message: `Are you sure you want to delete ${data.name}?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      acceptProps: {
        label: 'Delete',
        severity: 'danger'
      },
      accept: async (): Promise<void> => {
        await handleDeleteUser()
        selectedUser.value = undefined
      }
    })
  }
  // reset password
  else {
    sessionStorage.setItem('selectedUser', JSON.stringify(data))
    console.log('details')
  }
}

const handleOpenModal = (): void => {
  visibleDialogForm.value = true
  console.log(visibleDialogForm.value)
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
    <Button label="Add Operator" severity="contrast" @click="handleOpenModal" />
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
            v-tooltip.top="'Reset Password'"
            @click="handleClickIcon('resetPassword', data)"
            class="pi pi-key"
            style="font-size: 1rem"
          />
          <i
            v-tooltip.top="'Delete'"
            @click="handleClickIcon('delete', data)"
            class="pi pi-trash"
            style="font-size: 1rem"
          />
        </div>
      </template>
    </Column>
  </DataTable>

  <CreateUser v-model:visibleDialogForm="visibleDialogForm" @refetch="fetchUsers" />
</template>
