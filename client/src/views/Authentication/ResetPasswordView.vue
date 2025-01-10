<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref, shallowRef } from 'vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import type { ForgotPasswordData } from '@/types/apiResponse.type'
import { type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { AxiosError } from 'axios'
import { z } from 'zod'
import useToast from '@/utils/useToast'
import { useRoute } from 'vue-router'
import { jwtDecode, type JwtPayload } from 'jwt-decode'
import UserServices from '@/services/user.service'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import { formatTimeDifference } from '@/utils/formatDate.util'
import AuthForm from '@/components/common/AuthForm.vue'

const toast = useToast()
const route = useRoute()
const { token } = route.params

onBeforeMount(() => {
  if (!token || typeof token !== 'string') {
    isFormComponent.value = false
    isAccesDenied.value = true
  }
})

onMounted(async () => {
  const checkPermmission = async (): Promise<void> => {
    try {
      isLoading.value = true
      await UserServices.checkToken(token as string)
      getUserData(token as string)
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
  await checkPermmission()
})

type DecodedToken = ForgotPasswordData & JwtPayload
const userData = ref<ForgotPasswordData | undefined>()
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
      return {
        title: 'Reset Password',
        description: formatTimeDifference(userData.value?.exp as number)
      }
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
    console.log(decodedToken)
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
</script>

<template>
  <LoadingAnimation :state="isLoading" />
  <AuthLayout v-if="!isLoading" :page="page.title" :description="page.description">
    <template v-if="isFormComponent">
      <AuthForm
        :resolver="resolver"
        :submit="submitForm"
        :userData="userData"
        :isForgotPasswordPage="true"
      />
    </template>
    <template v-else>
      <div class="text-center">
        <a href="/login" class="text-blue-600 hover:underline mt-4 block">Go to login</a>
      </div>
    </template>
  </AuthLayout>
</template>
