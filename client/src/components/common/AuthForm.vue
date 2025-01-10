<script setup lang="ts">
import { Form, FormField, type FormProps, type FormSubmitEvent } from '@primevue/forms'
import { InputNumber, InputText, Message } from 'primevue'
import { shallowRef } from 'vue'
import { useRoute } from 'vue-router'

interface AuthFormProps extends FormProps {
  resolver: Required<FormProps>['resolver']
  submit: (event: FormSubmitEvent) => void
  userData?: {
    NIK: number
    name: string
  }
  isForgotPasswordPage?: boolean
}

defineProps<AuthFormProps>()

const route = useRoute()
const page = shallowRef(route.name === 'login' ? 'Sign in' : 'Sign up')

const showPassword = shallowRef<boolean>(false)
</script>

<template>
  <!-- component for page forgot password -->
  <template v-if="isForgotPasswordPage && userData">
    <Form
      v-slot="$form"
      @submit="submit"
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
  <!-- login & register -->
  <template v-else>
    <Form
      v-slot="$form"
      @submit="submit"
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
  </template>
</template>
