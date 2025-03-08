<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RegisterPayload } from '@/dto/user.dto'
import AuthLayout from '@/layouts/AuthLayout.vue'
import UserServices from '@/services/user.service'
import { type FormSubmitEvent } from '@primevue/forms'
import { AxiosError } from 'axios'
import { jwtDecode } from 'jwt-decode'
import AuthForm from '@/components/common/AuthForm.vue'
import happySound from '../../assets/sounds/happy.mp3'
import useToast from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const page = shallowRef(route.name === 'login' ? 'Sign in' : 'Sign up')

watch(
  () => route.name,
  (newName) => {
    page.value = newName === 'login' ? 'Sign in' : 'Sign up'
  },
  { immediate: true }
)

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
        life: 3000,
        customMusic: happySound
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
    <AuthForm :submit="submitForm" />
  </AuthLayout>
</template>
