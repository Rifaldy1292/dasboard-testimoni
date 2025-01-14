<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import type { Severity } from '@/types/severity.type'
import { Badge, Button, Column, DataTable, useConfirm } from 'primevue'
import type { Role, User } from '@/types/user.type'
import UserServices from '@/services/user.service'
import { onMounted } from 'vue'
import CreateUser from './CreateUser.vue'
import useToast from '@/utils/useToast'
import ModalResetPassword, { type ModalResetPasswordProps } from './ModalResetPassword.vue'
import { jwtDecode } from 'jwt-decode'

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

const users = ref<User[]>([])
const visibleDialogForm = shallowRef(false)
const visibleDialogResetPassword = shallowRef(false)
const tokenResetPassword = ref<ModalResetPasswordProps>({
  token: '',
  exp: 0,
  name: ''
})
const loadingTable = shallowRef(false)

const badgeSeverity = (role: Role): Severity => {
  if (role === 'Admin') return 'warn'
  if (role === 'Operator') return 'danger'
  return 'success'
}

const handleDeleteUser = async (selectedUser: User): Promise<void> => {
  try {
    await UserServices.deleteById(selectedUser.id)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `${selectedUser.name} has been deleted`
    })
    await fetchUsers()
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'error',
      detail: `failed to delete ${selectedUser.name}`
    })
  }
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
    console.log('delete', visibleDialogForm.value)
    confirm.require({
      message: `Are you sure you want to delete ${selectedUser.name}?`,
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
        await handleDeleteUser(selectedUser)
      }
    })
  }
  // reset password
  else {
    // visibleDialogResetPassword.value = true
    try {
      const { data } = await UserServices.resetPassword(selectedUser.id)
      const { token } = data.data
      const decoded = jwtDecode(token)
      tokenResetPassword.value = {
        token,
        exp: decoded.exp as number,
        name: selectedUser.name
      }
      console.log(tokenResetPassword.value.exp, 22)
      visibleDialogResetPassword.value = true
    } catch (error) {
      console.error(error)
      toast.add({
        severity: 'error',
        summary: 'error',
        detail: `failed to reset password ${selectedUser.name}`
      })
    }
  }
}

const fetchUsers = async (): Promise<void> => {
  try {
    loadingTable.value = true
    const { data } = await UserServices.getUsers()
    users.value = data.data
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'error',
      detail: 'failed to get user list'
    })
  } finally {
    loadingTable.value = false
  }
}
</script>

<template>
  <div class="flex justify-end mb-5">
    <Button label="Add New User" severity="contrast" @click="visibleDialogForm = true" />
  </div>
  <DataTable
    :value="users"
    :loading="loadingTable"
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
