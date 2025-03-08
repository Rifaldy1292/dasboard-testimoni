<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import DialogForm from '@/components/DialogForm/DialogForm.vue'
import type { RegisterPayload } from '@/dto/user.dto'
import RoleServices from '@/services/role.service'
import UserServices from '@/services/user.service'
import type { RoleOption } from '@/types/user.type'
import { Form, FormField, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { AxiosError } from 'axios'
import { Button, InputNumber, InputText, Message, Select } from 'primevue'
import { z } from 'zod'
import useToast from '@/composables/useToast'

const emit = defineEmits<{
  (e: 'refetch'): void
}>()

const toast = useToast()

const dataDialogConfirm = {
  header: 'Add New User',
  description: 'Enter your new user information'
}

const visibleDialogForm = defineModel<boolean>('visibleDialogForm', {
  required: true
})

const showPassword = shallowRef(false)
const roleOption = ref<RoleOption[]>([])
const loadingDropdown = shallowRef(false)
const loadingButtonSubmit = shallowRef(false)
const showConfirmPassword = shallowRef(false)
const password = ref<string | undefined>()

const resolver = zodResolver(
  z.object({
    NIK: z.number().refine((val) => val.toString().length === 9, {
      message: 'NIK must be 9 digits'
    }),
    password: z
      .string()
      .nonempty('Password is required')
      .min(3, 'Password must be at least 3 characters'),
    confirmPassword: z
      .string()
      .nonempty('Confirm password is required')
      .min(3, 'Password must be at least 3 characters')
      .refine((val) => val === password.value, {
        message: 'Password not match'
      }),

    name: z.string().min(3, 'Name must be at least 3 characters'),
    role_id: z.number().int().positive('Role is required')
  })
)

const fetchRoleOption = async (): Promise<void> => {
  try {
    loadingDropdown.value = true
    const { data } = await RoleServices.getAll()
    roleOption.value = data.data
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'error',
      detail: 'failed to fetch role option'
    })
  } finally {
    loadingDropdown.value = false
  }
}

const handleCreateUser = async (e: FormSubmitEvent): Promise<void> => {
  if (!e.valid) return
  try {
    await UserServices.register(e.values as RegisterPayload)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'User created'
    })
    emit('refetch')
    visibleDialogForm.value = false
  } catch (error) {
    if (error instanceof AxiosError && error.response && error.response.data) {
      return toast.add({
        severity: 'error',
        summary: 'Register failed',
        detail: error.response.data.message
      })
    }
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'Register failed',
      detail: 'Failed to create user'
    })
  } finally {
    loadingButtonSubmit.value = false
  }
}
</script>

<template>
  <DialogForm v-model:visibleDialogForm="visibleDialogForm" :data="dataDialogConfirm">
    <template #body>
      <Form v-slot="$form" :resolver="resolver" @submit="handleCreateUser" :validateOnBlur="true">
        <div class="gap-4 mb-8">
          <label for="NIK" class="font-semibold w-24">NIK</label>
          <div class="relative flex items-center">
            <InputNumber
              name="NIK"
              :useGrouping="false"
              class="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
              placeholder="Enter NIK"
            />
          </div>
          <Message v-if="$form.NIK?.invalid" severity="error" size="small" variant="simple">{{
            $form.NIK.error.message
          }}</Message>
        </div>
        <FormField name="name">
          <div class="gap-4 mb-8">
            <label for="name" class="font-semibold w-24">Name</label>
            <div class="relative flex items-center">
              <InputText
                name="name"
                class="flex-auto"
                autocomplete="off"
                placeholder="Enter Name"
              />
            </div>
            <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">{{
              $form.name.error.message
            }}</Message>
          </div>
        </FormField>
        <FormField name="role_id">
          <div class="gap-4 mb-8">
            <label for="role_id" class="font-semibold w-24">Role</label>
            <div class="relative flex items-center">
              <Select
                @before-show="fetchRoleOption"
                :options="roleOption"
                :loading="loadingDropdown"
                optionLabel="name"
                option-value="id"
                placeholder="Select a Role"
                fluid
              />
            </div>
            <Message v-if="$form.role_id?.invalid" severity="error" size="small" variant="simple">{{
              $form.role_id.error.message
            }}</Message>
          </div>
        </FormField>
        <FormField name="password">
          <div class="gap-4 mb-8">
            <label for="password" class="font-semibold w-24">Password</label>
            <div class="relative flex items-center">
              <InputText
                @update:model-value="password = $event"
                :type="showPassword ? 'text' : 'password'"
                class="flex-auto"
                autocomplete="off"
                placeholder="Enter password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="w-4 h-4 absolute right-4"
              >
                <i :class="showPassword ? 'fa fa-eye-slash' : 'fa fa-eye'" />
              </button>
            </div>
            <Message
              v-if="$form.password?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $form.password.error.message }}</Message
            >
          </div>
        </FormField>
        <FormField name="confirmPassword">
          <div class="gap-4 mb-8">
            <label for="confirmPassword" class="font-semibold w-24">Confirm Password</label>
            <div class="relative flex items-center">
              <InputText
                :type="showConfirmPassword ? 'text' : 'password'"
                class="flex-auto"
                autocomplete="off"
                placeholder="Enter confirm password"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="w-4 h-4 absolute right-4"
              >
                <i :class="showConfirmPassword ? 'fa fa-eye-slash' : 'fa fa-eye'" />
              </button>
            </div>
            <Message
              v-if="$form.confirmPassword?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $form.confirmPassword.error.message }}</Message
            >
          </div>
        </FormField>
        <div class="flex justify-end gap-2">
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            @click="visibleDialogForm = false"
          />
          <Button type="submit" label="Save" :disabled="!$form.valid" />
        </div>
      </Form>
    </template>
  </DialogForm>
</template>
