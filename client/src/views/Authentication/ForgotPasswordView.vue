<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import UserServices from '@/services/user.service'
import type { ForgotPasswordData } from '@/types/apiResponse.type'
import { type FormSubmitEvent } from '@primevue/forms'
import { AxiosError } from 'axios'
import { Column, DataTable } from 'primevue'
import DialogForm from '@/components/DialogForm/DialogForm.vue'
import useToast from '@/utils/useToast'
import AuthForm from '@/components/common/AuthForm.vue'

const toast = useToast()

const messageDialogForm = {
  header: 'Step for Reset Password',
  description: 'screenshot this page and show it to the admin to reset your password'
}
const userData = ref<ForgotPasswordData | undefined>()
const visibleDialogForm = shallowRef<boolean>(!!userData.value)

const submitForm = async (e: FormSubmitEvent): Promise<void> => {
  if (!e.valid) return
  try {
    console.log(22)
    console.log(e.values.NIK)
    const { data } = await UserServices.findByNIk(e.values.NIK as number)
    userData.value = data.data
    visibleDialogForm.value = true
    console.log(data.data)
  } catch (error) {
    if (error instanceof AxiosError && error.response && error.response.data) {
      return toast.add({
        severity: 'error',
        summary: 'error',
        detail: error.response.data.message
      })
    }
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'error',
      detail: 'failed to find user'
    })
  }
}
</script>

<template>
  <AuthLayout page="Forgot Password">
    <AuthForm :is-forgot-password-page="true" :submit="submitForm" />
    <!-- <Form
      v-slot="$form"
      @submit="submitForm"
      :resolver="resolver"
      :validate-on-blur="true"
      :validate-on-submit="true"
      :validate-on-value-update="true"
    >
      <div class="mt-8 space-y-4">
        <div>
          <label class="text-gray-800 text-sm mb-2 block">NIK</label>
          <InputNumber
            name="NIK"
            :useGrouping="false"
            class="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
            placeholder="Enter NIK"
          />
          <Message v-if="$form.NIK?.invalid" severity="error" size="small" variant="simple">{{
            $form.NIK?.error?.message
          }}</Message>
        </div>

        <div class="!mt-8">
          <button
            type="submit"
            class="w-full py-3 px-4 text-sm tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            Request Reset Password
          </button>
        </div>
        <p class="text-gray-800 text-sm !mt-8 text-center">
          Already have an account?
          <a
            href="/login"
            class="text-blue-600 hover:underline ml-1 whitespace-nowrap font-semibold"
            >Go back to login</a
          >
        </p>
      </div>
    </Form> -->
    <DialogForm v-model:visible-dialog-form="visibleDialogForm" :data="messageDialogForm">
      <template #body>
        <div class="card">
          <span class="text-md font-bold">Detail Account:</span>
          <DataTable :value="[userData]">
            <Column field="NIK" header="NIK"></Column>
            <Column field="name" header="Name"></Column>
            <Column field="role" header="Role"></Column>
          </DataTable>
        </div>
      </template>
    </DialogForm>
  </AuthLayout>
</template>
