<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import type { Severity } from '@/types/severity.type'
import { Badge, Button, Column, DataTable } from 'primevue'
import type { Role, User } from '@/types/user.type'
import CreateUser from './CreateUser.vue'
import useToast from '@/composables/useToast'
import ModalResetPassword from './ModalResetPassword.vue'
import { useUsers } from '@/composables/useUsers'

onMounted(() => {
  fetchUsers()
})

const {
  fetchUsers,
  loadingFetch,
  users,
  handleDeleteUser,
  handleResetPassword,
  tokenResetPassword,
  visibleDialogResetPassword
} = useUsers()

interface Columns {
  field: string
  header: string
  sortable?: boolean
}

const toast = useToast()
const columns: Columns[] = [
  { field: 'name', header: 'Name' },
  { field: 'NIK', header: 'NIK' },
  { field: 'machineName', header: 'Machine Name' },
  { field: 'roleName', header: 'Role' }
]

const visibleDialogForm = shallowRef(false)

const badgeSeverity = (role: Role): Severity => {
  if (role === 'Admin') return 'warn'
  if (role === 'Operator') return 'danger'
  return 'success'
}

const handleClickIcon = async (
  icon: 'resetPassword' | 'delete',
  selectedUser: User
): Promise<void> => {
  // console.log({ icon, selectedUser, id: selectedUser.id })
  if (icon === 'delete') {
    if (!selectedUser.allowDelete) {
      return toast.add({
        severity: 'error',
        summary: 'error',
        detail: 'Cannot Delete Yourself!'
      })
    }
    return handleDeleteUser(selectedUser)
  }
  // reset password
  else {
    return handleResetPassword(selectedUser)
  }
}
</script>

<template>
  <div class="flex justify-end mb-5">
    <Button label="Add New User" severity="contrast" @click="visibleDialogForm = true" />
  </div>
  <DataTable
    :value="users"
    :loading="loadingFetch"
    size="large"
    lazy
    showGridlines
    tableStyle="min-width: 50rem "
    selection-mode="single"
    :row-style="(data: User) => ({ background: !data.allowDelete && 'gray' })"
  >
    <Column
      v-for="col of columns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
      :sortable="col.sortable"
    >
      <template #body="{ data }">
        <!-- <h1>{{ JSON.stringify(data) }}</h1> -->
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
  <ModalResetPassword
    v-model:visible-dialog-reset-password="visibleDialogResetPassword"
    :data="tokenResetPassword"
  />
</template>
