<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RegisterPayload } from '@/dto/user.dto'
import AuthLayout from '@/layouts/AuthLayout.vue'
import UserServices from '@/services/user.service'
import { Form, FormField, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { InputNumber, InputText, Message } from 'primevue'
import { z } from 'zod'
import { AxiosError } from 'axios'
import { jwtDecode } from 'jwt-decode'
import useToast from '@/utils/useToast'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const page = shallowRef(route.name === 'login' ? 'Sign in' : 'Sign up')

watch(
  () => route.name,
  (newName) => {
    page.value = newName === 'login' ? 'Sign in' : 'Sign up'
  }
)

const resolver = zodResolver(
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
        : z.string().optional()
  })
)

const showPassword = shallowRef(false)

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
            :useGrouping="false"
            class="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
            placeholder="Enter NIK"
          />
          <!-- <svg
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
                        </svg> -->
          <Message v-if="$form.NIK?.invalid" severity="error" size="small" variant="simple">{{
            $form.NIK?.error?.message
          }}</Message>
        </div>

        <FormField v-if="page === 'Sign up'" name="name">
          <div>
            <label class="text-gray-800 text-sm mb-2 block">Name</label>
            <div class="relative flex items-center">
              <InputText
                type="text"
                required
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

        <div v-if="page === 'Sign in'" class="flex flex-wrap items-center justify-end gap-4">
          <div class="text-sm">
            <a href="/forgot-password" class="text-blue-600 hover:underline font-semibold">
              Forgot your password?
            </a>
          </div>
        </div>

        <div class="!mt-8">
          <button
            type="submit"
            class="w-full py-3 px-4 text-sm tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            {{ page }}
          </button>
        </div>
        <p class="text-gray-800 text-sm !mt-8 text-center">
          {{ page === 'Sign in' ? "Don't have an account?" : 'Already have an account?' }}
          <a
            :href="page === 'Sign in' ? '/register' : '/login'"
            class="text-blue-600 hover:underline ml-1 whitespace-nowrap font-semibold"
            >{{ page === 'Sign in' ? 'Register' : 'Login' }} here</a
          >
        </p>
      </div>
    </Form>
  </AuthLayout>
</template>
