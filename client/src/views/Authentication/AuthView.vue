<script setup lang="ts">
import { Form, FormField, type FormSubmitEvent } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { InputNumber, InputText, Message, useToast } from 'primevue'
import { shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { z } from 'zod'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const page = route.name === 'login' ? 'Sign in' : 'Sign up'

const resolver = zodResolver(
  z.object({
    PIK: z.number().refine((val) => val.toString().length === 9, {
      message: 'PIK must be 9 digits'
    }),
    password: z
      .string()
      .nonempty('Password is required')
      .min(3, 'Password must be at least 3 characters'),

    // required if page is sign up
    name:
      page === 'Sign up'
        ? z.string().min(3, 'Name must be at least 3 characters')
        : z.string().optional()
  })
)

const showPassword = shallowRef(false)

const submitForm = (e: FormSubmitEvent) => {
  console.log(e)
  if (!e.valid) return
  // login
  if (page === 'Sign in') {
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Machine updated',
      life: 3000
    })
    router.push({ name: 'dashboard' })
  }
  // register
  else {
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Operator updated',
      life: 3000
    })
    router.push({ name: 'login' })
  }
}
</script>

<template>
  <div class="bg-gray-50 font-[sans-serif]">
    <div class="min-h-screen flex flex-col items-center justify-center py-6 px-4">
      <div class="max-w-md w-full">
        <a href="#"
          ><img
            src="@/assets/images/logo/yamaha-gakki.svg"
            alt="logo"
            class="w-40 mb-8 mx-auto block"
          />
        </a>

        <div class="p-8 rounded-2xl bg-white shadow">
          <h2 class="text-gray-800 text-center text-2xl font-bold">{{ page }}</h2>
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
                <label class="text-gray-800 text-sm mb-2 block">PIK</label>
                <InputNumber
                  name="PIK"
                  :useGrouping="false"
                  class="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
                  placeholder="Enter PIK"
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
                <Message v-if="$form.PIK?.invalid" severity="error" size="small" variant="simple">{{
                  $form.PIK?.error?.message
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
                  <Message
                    v-if="$form.name?.invalid"
                    severity="error"
                    size="small"
                    variant="simple"
                    >{{ $form.name?.error?.message }}</Message
                  >
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
                  <a
                    href="jajvascript:void(0);"
                    class="text-blue-600 hover:underline font-semibold"
                  >
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div class="!mt-8">
                <button
                  type="submit"
                  class="w-full py-3 px-4 text-sm tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  Sign in
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
        </div>
      </div>
    </div>
  </div>
</template>
