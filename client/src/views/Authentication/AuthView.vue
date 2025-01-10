<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RegisterPayload } from '@/dto/user.dto'
import AuthLayout from '@/layouts/AuthLayout.vue'
import UserServices from '@/services/user.service'
import { type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { jwtDecode } from 'jwt-decode'
import useToast from '@/utils/useToast'
import AuthForm from '@/components/common/AuthForm.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const page = shallowRef(route.name === 'login' ? 'Sign in' : 'Sign up')
const password = ref<string | undefined>()
watch(
  () => password.value,
  () => {
    console.log(password.value)
  }
)

watch(
  () => route.name,
  (newName) => {
    page.value = newName === 'login' ? 'Sign in' : 'Sign up'
  },
  { immediate: true }
)

const resolver = computed(() => {
  return zodResolver(
    z.object({
      NIK: z.number().refine((val) => val.toString().length === 9, {
        message: 'NIK must be 9 digits'
      }),
      password: z
        .string()
        .nonempty('Password is required')
        .min(3, 'Password must be at least 3 characters'),

      // required if page is sign up
      name:
        page.value === 'Sign up'
          ? z.string().min(3, 'Name must be at least 3 characters')
          : z.string().optional(),
      confirmPassword:
        page.value === 'Sign up'
          ? z
              .string()
              .nonempty('Confirm password is required')
              .min(3, 'Password must be at least 3 characters')
              .refine((val) => val === password.value, {
                message: 'Password not match'
              })
          : z.string().optional()
    })
  )
})

// function for submit form login/register
const submitForm = async (e: FormSubmitEvent): Promise<void> => {
  console.log(e)
  if (!e.valid) return
  // login
  if (page.value === 'Sign in') {
    try {
      const { data } = await UserServices.login(e.values as Omit<RegisterPayload, 'name'>)
      const { token } = data.data
      const decodedToken = jwtDecode(token)
      localStorage.setItem('user', JSON.stringify({ ...decodedToken, token }))
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Login success',
        life: 3000
      })

      setTimeout(() => {
        router.replace({ name: 'dashboard' })
      }, 500)
    } catch (error) {
      if (error instanceof AxiosError && error.response && error.response.data) {
        return toast.add({
          severity: 'error',
          summary: 'Login failed',
          detail: error.response.data.message
        })
      }
      console.error(error)
      toast.add({
        severity: 'error',
        summary: 'Login failed',
        detail: 'server error',
        life: 3000
      })
    }
  }
  // register
  else {
    try {
      const { data } = await UserServices.register(e.values as RegisterPayload)
      console.log(data)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Register success'
      })
      setTimeout(() => {
        router.replace({ name: 'login' })
      }, 500)
    } catch (error) {
      if (error instanceof AxiosError && error.response && error.response.data) {
        if (error.response.data.message === 'NIK already exists') {
          return toast.add({
            severity: 'error',
            summary: 'Register failed',
            detail: 'NIK already exists'
          })
        }
      }
      console.error(error)
      toast.add({
        severity: 'error',
        summary: 'Register failed',
        detail: 'server error'
      })
    }
  }
}
</script>

<template>
  <AuthLayout :page="page">
    <AuthForm :resolver="resolver" :submit="submitForm" v-model:password="password" />
  </AuthLayout>
</template>
