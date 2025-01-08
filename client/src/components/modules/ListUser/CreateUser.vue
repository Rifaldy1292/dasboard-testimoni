<script setup lang="ts">
import DialogForm from '@/components/DialogForm/DialogForm.vue'
import { Form, FormField, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { Button, InputNumber, InputText, Message, useToast } from 'primevue'
import { shallowRef } from 'vue'
import { z } from 'zod'

const toast = useToast()

const dataDialogConfirm = {
  header: 'Add New User',
  description: 'Enter your new user information'
}

const visibleDialogForm = defineModel<boolean>('visibleDialogForm', {
  required: true
})

const showPassword = shallowRef(false)

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

const handleCreateUser = async (data: FormSubmitEvent): Promise<void> => {
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
  <DialogForm v-model:visibleDialogForm="visibleDialogForm" :data="dataDialogConfirm">
    <template #body>
      <Form v-slot="$form" :resolver="resolver" @submit="handleCreateUser" :validateOnBlur="true">
        <FormField name="NIK">
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
        </FormField>
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
        <FormField name="password">
          <div class="gap-4 mb-8">
            <label for="password" class="font-semibold w-24">Password</label>
            <div class="relative flex items-center">
              <InputText
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
