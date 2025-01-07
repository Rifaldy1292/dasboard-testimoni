<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import type { Machine } from '@/types/machine.type'
import type { Severity } from '@/types/severity.type'
import { Badge, Button, Column, DataTable, InputText, useToast } from 'primevue'
import type { User } from '@/types/user.type'
import UserServices from '@/services/user.service'
import { onMounted } from 'vue'
import type { DialogFormProps } from '../DialogForm/DialogForm.type'
import DialogForm from '../DialogForm/DialogForm.vue'
import { Form, FormField, type FormSubmitEvent } from '@primevue/forms'
import { z } from 'zod'
import { zodResolver } from '@primevue/forms/resolvers/zod'

onMounted(() => {
  fetchUsers()
})

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

const resolver = zodResolver(
  z.object({
    NIK: z.number().refine((val) => val.toString().length === 9, {
      message: 'NIK must be 9 digits'
    }),
    password: z
      .string()
      .nonempty('Password is required')
      .min(3, 'Password must be at least 3 characters'),

    name: z.string().min(3, 'Name must be at least 3 characters')
  })
)

const operators = ref<User[]>([])
const selectedMachine = shallowRef<Machine>()
const visibleDialogForm = shallowRef(false)
const dataDialogConfirm = shallowRef<DialogFormProps & { isCreateModal: boolean }>({
  header: 'Add New User',
  description: 'Enter your new user information',
  isCreateModal: true
})

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

const handleSubmitDialogForm = async (data: FormSubmitEvent): Promise<void> => {
  try {
    console.log(data)
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'error',
      detail: 'failed to create user'
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

  <DialogForm v-model:visibleDialogForm="visibleDialogForm" :data="dataDialogConfirm">
    <template #body>
      <Form
        v-slot="$form"
        :resolver="resolver"
        :initial-values="selectedMachine"
        @submit="handleSubmitDialogForm"
        :validateOnBlur="true"
      >
        <FormField name="NIK">
          <div class="gap-4 mb-8">
            <label for="NIK" class="font-semibold w-24">NIK</label>
            <br />
            <InputText type="text" class="flex-auto" autocomplete="off" />
            <Message v-if="$form.NIK?.invalid" severity="error" size="small" variant="simple">{{
              $form.NIK.error.message
            }}</Message>
          </div>
        </FormField>
        <FormField name="status">
          <div class="gap-4 mb-8">
            <label for="status" class="font-semibold w-24">Status</label>
            <br />
            <InputText name="status" class="flex-auto" autocomplete="off" />
            <Message v-if="$form.status?.invalid" severity="error" size="small" variant="simple">{{
              $form.status.error.message
            }}</Message>
          </div>
        </FormField>
        <div class="flex justify-end gap-2">
          <Button type="button" label="Cancel" severity="secondary" @click="handleCloseModal" />
          <Button type="submit" label="Save" :disabled="!$form.valid" />
        </div>
      </Form>
    </template>
  </DialogForm>
</template>
