<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { Form, FormField, type FormProps, type FormSubmitEvent } from '@primevue/forms'
import { InputText, Message } from 'primevue'
import { useRoute } from 'vue-router'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import API from '@/services/API'

interface AuthFormProps extends FormProps {
  submit: (event: FormSubmitEvent) => void
  userData?: {
    NIK: string
    name: string
  }
  isResetPasswordPage?: boolean
  isForgotPasswordPage?: boolean
}

interface ShowFormField {
  name: boolean
  NIK: boolean
  password: boolean
  confirmPassword: boolean
}

const route = useRoute()

const resolver = computed(() => {
  if (isResetPasswordPage) {
    return zodResolver(
      z.object({
        password: showFormField.value.password
          ? z
              .string()
              .nonempty('Password is required')
              .min(3, 'Password must be at least 3 characters')
          : z.string().optional(),

        confirmPassword: showFormField.value.confirmPassword
          ? z
              .string()
              .nonempty('Confirm password is required')
              .min(3, 'Password must be at least 3 characters')
              .max(20, 'Password must be at most 20 characters')
              .refine((val) => val === password.value, {
                message: 'Password not match'
              })
          : z.string().optional()
      })
    )
  }

  return zodResolver(
    z.object({
      NIK: z
        .string()
        .nonempty('NIK is required')
        .length(7, 'NIK must be 7 characters')
        .regex(/^RK\d{5}$/, 'NIK must start with RK followed by 4 digits'),
      // required if page is sign up
      name: showFormField.value.name
        ? z.string().min(3, 'Name must be at least 3 characters')
        : z.string().optional(),
      password: showFormField.value.password
        ? z
            .string()
            .nonempty('Password is required')
            .min(3, 'Password must be at least 3 characters')
            .max(20, 'Password must be at most 20 characters')
        : z.string().optional(),

      confirmPassword: showFormField.value.confirmPassword
        ? z
            .string()
            .nonempty('Confirm password is required')
            .min(3, 'Password must be at least 3 characters')
            .max(20, 'Password must be at most 20 characters')
            .refine((val) => val === password.value, {
              message: 'Password not match'
            })
        : z.string().optional()
    })
  )
})

const { isForgotPasswordPage, isResetPasswordPage } = defineProps<AuthFormProps>()

const page = shallowRef<'Sign in' | 'Sign up'>(route.name === 'login' ? 'Sign in' : 'Sign up')
const password = ref<string | undefined>()
const showPassword = shallowRef<boolean>(false)
const showConfirmPassword = shallowRef<boolean>(false)

const showFormField = computed<ShowFormField>(() => {
  return {
    name: (page.value === 'Sign up' || isResetPasswordPage) && !isForgotPasswordPage,
    NIK: true,
    password: !isForgotPasswordPage,
    confirmPassword: (page.value === 'Sign up' || isResetPasswordPage) && !isForgotPasswordPage
  }
})

// const info = 'per tanggal 21-04-2025 jam 12:00 password diubah menjadi YAMAHA (huruf besar)'
const info = shallowRef<string | null>(null)

// Tambahkan fungsi untuk fetch data
const fetchTotalCommit = async () => {
  try {
    const { data } = await API().get('/total-commit')
    info.value = data.data
  } catch (error) {
    console.error('Error fetching total commit:', error)
    info.value = null
  }
}

onMounted(() => {
  fetchTotalCommit()
})
</script>

<template>
  <!-- login & register -->
  <h1 class="text-center text-xl font-bold text-red">{{ info ?? '' }}</h1>
  <Form
    v-slot="$form"
    @submit="submit"
    :resolver="resolver"
    :validate-on-blur="true"
    :validate-on-submit="true"
    :validate-on-value-update="true"
  >
    <!-- <template v-if="isResetPasswordPage && userData"> </template> -->
    <div class="mt-8 space-y-4">
      <div>
        <label class="text-gray-800 dark:text-white text-sm mb-2 block">NIK</label>
        <InputText
          :disabled="isResetPasswordPage"
          name="NIK"
          :default-value="userData?.NIK"
          :useGrouping="false"
          class="w-full text-gray-800 dark:text-white text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
          placeholder="Enter NIK"
        />
        <Message v-if="$form.NIK?.invalid" severity="error" size="small" variant="simple">{{
          $form.NIK?.error?.message
        }}</Message>
      </div>

      <FormField v-if="showFormField.name" name="name">
        <div>
          <label class="text-gray-800 dark:text-white text-sm mb-2 block">Name</label>
          <div class="relative flex items-center">
            <InputText
              :disabled="isResetPasswordPage"
              :default-value="userData?.name"
              type="text"
              required
              class="w-full dark:text-white text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
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

      <FormField v-if="showFormField.password" name="password">
        <div>
          <label class="text-gray-800 dark:text-white text-sm mb-2 block">Password</label>
          <div class="relative flex items-center">
            <InputText
              @update:model-value="password = $event"
              :type="showPassword ? 'text' : 'password'"
              required
              class="w-full text-gray-800 dark:text-white text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
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
          <Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple">{{
            $form.password?.error?.message
          }}</Message>
        </div>
      </FormField>

      <FormField v-if="showFormField.confirmPassword" name="confirmPassword">
        <div>
          <label class="text-gray-800 text-sm mb-2 block">Confirm Password</label>
          <div class="relative flex items-center">
            <InputText
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              class="w-full text-gray-800 text-sm border border-gray-300 px-4 py-3 rounded-md outline-blue-600"
              placeholder="Enter confirm password"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="w-4 h-4 absolute right-4"
            >
              <i :class="showConfirmPassword ? 'fa fa-eye-slash' : 'fa fa-eye'" />
            </button>
          </div>
          <Message
            v-if="$form.confirmPassword?.invalid"
            severity="error"
            size="small"
            variant="simple"
            >{{ $form.confirmPassword?.error?.message }}</Message
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
          {{ page !== 'Sign in' ? 'Submit' : page }}
        </button>
      </div>
      <!-- <p class="text-gray-800 text-sm !mt-8 text-center">
        {{ page === 'Sign in' ? "Don't have an account?" : 'Already have an account?' }}
        <a
          :href="page === 'Sign in' ? '/register' : '/login'"
          class="text-blue-600 hover:underline ml-1 whitespace-nowrap font-semibold"
          >{{ page === 'Sign in' ? 'Register' : 'Login' }} here</a
        >
      </p> -->

      <p v-if="page !== 'Sign in'" class="text-gray-800 text-sm !mt-8 text-center">
        {{ 'Already have an account?' }}
        <a href="/login" class="text-blue-600 hover:underline ml-1 whitespace-nowrap font-semibold"
          >Login here</a
        >
      </p>
    </div>
  </Form>
  <!-- component for page forgot password -->
  <!-- <template v-if="isResetPasswordPage && userData">
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
  </template> -->
</template>
