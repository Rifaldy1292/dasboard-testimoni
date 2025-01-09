<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import type { ForgotPasswordData } from '@/types/apiResponse.type'
import { Form, FormField, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { AxiosError } from 'axios'
import { InputNumber, InputText, Message } from 'primevue'
import { z } from 'zod'
import useToast from '@/utils/useToast'
import { useRoute } from 'vue-router'
import { jwtDecode, type JwtPayload } from 'jwt-decode'
import UserServices from '@/services/user.service'
import LoadingAnimation from '@/components/modules/ListUser/common/LoadingAnimation.vue'

const toast = useToast()
const route = useRoute()
const { token } = route.params as { token: string }

onMounted(async () => {
  await checkPermmission()
})

type DecodedToken = ForgotPasswordData & JwtPayload
const userData = ref<ForgotPasswordData | undefined>()
const showPassword = shallowRef<boolean>(false)
const isSuccesResetPassword = shallowRef<boolean>(false)
const isAccesDenied = shallowRef<boolean>(false)
const isTokenExpired = ref<boolean>(false)
const isFormComponent = ref<boolean>(true)
const isLoading = shallowRef<boolean>(false)

const page = computed<{ title: string; description?: string }>(() => {
  switch (true) {
    case isSuccesResetPassword.value:
      return {
        title: 'Success Reset Password',
        description:
          'Your password has been reset successfully. Please login with your new password'
      }
    case isAccesDenied.value:
      return { title: 'Access Denied', description: 'Not enough permission' }
    case isTokenExpired.value:
      return { title: 'Token Expired', description: 'this link has been expired' }
    // default = isFormComponent
    default:
      return { title: 'Reset Password', description: 'this link expires in 24 hours' }
  }
})

const resolver = zodResolver(
  z.object({
    password: z
      .string()
      .nonempty('Password is required')
      .min(3, 'Password must be at least 3 characters')
  })
)

const submitForm = async (e: FormSubmitEvent): Promise<void> => {
  if (!e.valid) return
  try {
    const { data } = await UserServices.changePassword(
      token as string,
      e.values as { password: string }
    )
    userData.value = data.data
    isSuccesResetPassword.value = true
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
      detail: 'failed to reset password'
    })
  }
}

const getUserData = (token: string): void => {
  try {
    const decodedToken: DecodedToken = jwtDecode(token)
    // console.log(decodedToken)
    userData.value = decodedToken
  } catch (error) {
    console.log('not found')
    toast.add({
      severity: 'error',
      summary: 'Invalid Link'
    })
    console.log(error)
  }
}

const checkPermmission = async (): Promise<void> => {
  try {
    isLoading.value = true
    await UserServices.checkToken(token)
    getUserData(token)
  } catch (error) {
    console.error(error)
    isFormComponent.value = false
    if (error instanceof AxiosError && error.response && error.response.data) {
      const { message, status } = error.response.data
      console.log(message, status, 22)
      if (status === 401 && message === 'jwt expired') {
        isTokenExpired.value = true
        return toast.add({
          severity: 'error',
          summary: 'error',
          detail: 'Token has been expired'
        })
      }
      isAccesDenied.value = true
      return toast.add({
        severity: 'error',
        summary: 'error',
        detail: message
      })
    }
    isAccesDenied.value = true
    toast.add({
      severity: 'error',
      summary: 'error',
      detail: 'Failed to check permission'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <LoadingAnimation :state="isLoading" />
  <AuthLayout v-if="!isLoading" :page="page.title" :description="page.description">
    <template v-if="isFormComponent">
      <Form
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
              disabled
              :default-value="userData?.NIK"
              :useGrouping="false"
              class="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
              placeholder="Enter NIK"
            />
            <Message v-if="$form.NIK?.invalid" severity="error" size="small" variant="simple">{{
              $form.NIK?.error?.message
            }}</Message>
          </div>

          <FormField name="name">
            <div>
              <label class="text-gray-800 text-sm mb-2 block">Name</label>
              <div class="relative flex items-center">
                <InputText
                  :default-value="userData?.name"
                  type="text"
                  required
                  disabled
                  class="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
                  placeholder="Enter name"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#bbb"
                  stroke="#bbb"
                  class="w-4 h-4 absolute right-4"
                  viewBox="0 0 24 24"
                >
                  <circle cx="10" cy="7" r="6" data-original="#000000"></circle>
                  <path
                    d="M14 15H6a5 5 0 0 0-5 5 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 5 5 0 0 0-5-5zm8-4h-2.59l.3-.29a1 1 0 0 0-1.42-1.42l-2 2a1 1 0 0 0 0 1.42l2 2a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-.3-.29H22a1 1 0 0 0 0-2z"
                    data-original="#000000"
                  ></path>
                </svg>
              </div>
              <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">{{
                $form.name?.error?.message
              }}</Message>
            </div>
          </FormField>

          <FormField name="password">
            <div>
              <label class="text-gray-800 text-sm mb-2 block">Password</label>
              <div class="relative flex items-center">
                <InputText
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
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
                >{{ $form.password?.error?.message }}</Message
              >
            </div>
          </FormField>

          <div class="!mt-8">
            <button
              type="submit"
              class="w-full py-3 px-4 text-sm tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Reset Password
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
      </Form>
    </template>
    <template v-else>
      <div class="text-center">
        <a href="/login" class="text-blue-600 hover:underline mt-4 block">Go to login</a>
      </div>
    </template>
  </AuthLayout>
</template>
