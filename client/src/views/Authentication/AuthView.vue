<script setup lang="ts">
import { shallowRef, watch, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RegisterPayload } from '@/dto/user.dto'
import AuthLayout from '@/layouts/AuthLayout.vue'
import UserServices from '@/services/user.service'
import { type FormSubmitEvent } from '@primevue/forms'
import { jwtDecode } from 'jwt-decode'
import AuthForm from '@/components/common/AuthForm.vue'
import happySound from '../../assets/sounds/happy.mp3'
import useToast from '@/composables/useToast'
import API from '@/services/API'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import { useDarkModeStore } from '@/stores/darkMode'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const page = shallowRef(route.name === 'login' ? 'Sign in' : 'Sign up')
const info = shallowRef<string | null>(null)
// Add loading state
const loading = ref<boolean>(false)
const { setDarkMode } = useDarkModeStore()

watch(
  () => route.name,
  (newName) => {
    page.value = newName === 'login' ? 'Sign in' : 'Sign up'
  },
  { immediate: true }
)

// function for submit form login/register
const submitForm = async (e: FormSubmitEvent): Promise<void> => {
  if (!e.valid) return
  loading.value = true

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
        detail: data.message,
        life: 3000,
        customMusic: happySound
      })

      setTimeout(() => {
        router.replace({ name: 'transferFile' })
        setDarkMode(true)
      }, 200)
    } catch (error) {
      handleErrorAPI(error, toast)
    }
  }
  // register
  else {
    try {
      const { data } = await UserServices.register(e.values as RegisterPayload)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: data.message
      })
      setTimeout(() => {
        router.replace({ name: 'login' })
      }, 300)
    } catch (error) {
      handleErrorAPI(error, toast)
    }
  }
  loading.value = false
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
  setDarkMode(false)
  fetchTotalCommit()
})
</script>

<template>
  <AuthLayout :page="page" :description="info">
    <!-- Pass loading as prop -->
    <AuthForm :submit="submitForm" :loading />
  </AuthLayout>
</template>
