<script setup lang="ts">
import { shallowRef, watch, onMounted } from 'vue'
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
import API from '@/services/API'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const page = shallowRef(route.name === 'login' ? 'Sign in' : 'Sign up')
const info = shallowRef<string | null>(null)

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
        router.replace({ name: 'transferFile' })
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

// Add fetchTotalCommit function
const fetchTotalCommit = async () => {
  try {
    const { data } = await API().get('/total-commit')
    info.value = data.data
  } catch (error) {
    console.error('Error fetching total commit:', error)
    info.value = null
  }
}

// Add onMounted
onMounted(() => {
  fetchTotalCommit()
})
</script>

<template>
  <AuthLayout :page="page" :description="info">
    <!-- Pass info as prop -->
    <AuthForm :submit="submitForm" />
  </AuthLayout>
</template>
