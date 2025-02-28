<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import userPhoto from '@/assets/images/user/user-03.png'
import { InputNumber, InputText, Message } from 'primevue'
import { Form, FormField } from '@primevue/forms'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import useToast from '@/utils/useToast'
import { AxiosError } from 'axios'
import UserServices from '@/services/user.service'
import type { EditProfile } from '@/dto/user.dto'
import { useUsers } from '@/composables/useUsers'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'

onMounted(async () => {
  await getDetailUser()
})

const { getDetailUser, user, loadingFetch } = useUsers()
const toast = useToast()

const resolver = zodResolver(
  z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').optional(),
    profilePicture: z
      .instanceof(File)
      .refine((file) => file.type.startsWith('image/'), {
        message: 'Profile picture must be an image'
      })
      .optional()
  })
)

const defaultFormValue = computed<EditProfile & { imageUrl: string | null }>(() => {
  return {
    name: user.value?.name || '',
    imageUrl: user.value?.imageUrl || null,
    profilePicture: null
  }
})

const formValues = ref<EditProfile & { imageUrl: string | null }>(defaultFormValue.value)
watch(
  () => user.value,
  () => {
    formValues.value = {
      imageUrl: user.value?.imageUrl || null,
      name: user.value?.name,
      profilePicture: null
    }
  }
)

const handleSubmit = async () => {
  try {
    console.log(formValues.value === defaultFormValue.value)
    if (formValues.value === defaultFormValue.value) return
    console.log({ payload: formValues.value })
    const { data } = await UserServices.editprofile(formValues.value)
    formValues.value.imageUrl = data.data?.imageUrl
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: data.message
    })
    // Handle form submission for personal information
  } catch (error) {
    console.error(error)
    if (error instanceof AxiosError) {
      return toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data.message
      })
    }
  }
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  console.log(target.files)
  if (target.files?.length) {
    formValues.value.profilePicture = target.files[0]
  }
}
</script>

<template>
  <LoadingAnimation :state="loadingFetch" />
  <div
    v-if="!loadingFetch"
    class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
  >
    <div class="border-b border-stroke py-4 px-7 dark:border-strokedark">
      <h3 class="font-medium text-black dark:text-white text-center">Personal Information</h3>
    </div>
    <Form
      v-slot="$form"
      @submit="handleSubmit"
      :resolver="resolver"
      :validate-on-blur="true"
      :validate-on-submit="true"
      :validate-on-value-update="true"
    >
      <div class="grid grid-cols-5 p-7 gap-8">
        <div class="col-span-5 xl:col-span-3">
          <!-- NIK Section -->
          <div class="mb-5.5 cursor-not-allowed">
            <label class="mb-3 block text-sm font-medium text-black dark:text-white" for="Username"
              >NIK</label
            >
            <InputNumber
              name="NIK"
              :default-value="user?.NIK"
              :useGrouping="false"
              class="w-full rounded border border-stroke bg-gray font-normal text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
              placeholder="Enter NIK"
              disabled
            />
            <Message v-if="$form.NIK?.invalid" severity="error" size="small" variant="simple">{{
              $form.NIK?.error?.message
            }}</Message>
          </div>

          <!-- NAME Address Section -->
          <div class="mb-5.5">
            <FormField name="name">
              <div>
                <label class="mb-3 block text-sm font-medium text-black dark:text-white"
                  >Name</label
                >
                <div class="relative flex items-center">
                  <InputText
                    :default-value="defaultFormValue?.name"
                    v-model:model-value="formValues.name"
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
          </div>
        </div>
        <div class="col-span-5 xl:col-span-2">
          <!-- User Photo Section -->
          <div class="mb-4 flex items-center gap-3">
            <div class="h-14 w-14 rounded-full">
              <img :src="defaultFormValue.imageUrl || userPhoto" alt="User" />
            </div>
            <div class="h-14">
              <span class="mb-1.5 font-medium text-black dark:text-white">Edit your photo</span>
            </div>
          </div>

          <!-- File Upload Section -->
          <div
            id="FileUpload"
            class="relative mb-5.5 block w-full cursor-pointer appearance-none rounded border-2 border-dashed border-primary bg-gray py-4 px-4 dark:bg-meta-4 sm:py-7.5"
          >
            <FormField name="profilePicture">
              <input
                type="file"
                accept="image/*"
                class="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                @change="handleFileChange"
              />
              <Message v-if="$form.profilePicture?.invalid" severity="error" size="small">
                {{ $form.profilePicture?.error?.message }}
              </Message>
            </FormField>
            <div class="flex flex-col items-center justify-center space-y-3">
              <span
                class="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M1.99967 9.33337C2.36786 9.33337 2.66634 9.63185 2.66634 10V12.6667C2.66634 12.8435 2.73658 13.0131 2.8616 13.1381C2.98663 13.2631 3.1562 13.3334 3.33301 13.3334H12.6663C12.8431 13.3334 13.0127 13.2631 13.1377 13.1381C13.2628 13.0131 13.333 12.8435 13.333 12.6667V10C13.333 9.63185 13.6315 9.33337 13.9997 9.33337C14.3679 9.33337 14.6663 9.63185 14.6663 10V12.6667C14.6663 13.1971 14.4556 13.7058 14.0806 14.0809C13.7055 14.456 13.1968 14.6667 12.6663 14.6667H3.33301C2.80257 14.6667 2.29387 14.456 1.91879 14.0809C1.54372 13.7058 1.33301 13.1971 1.33301 12.6667V10C1.33301 9.63185 1.63148 9.33337 1.99967 9.33337Z"
                    fill="#3C50E0"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M7.5286 1.52864C7.78894 1.26829 8.21106 1.26829 8.4714 1.52864L11.8047 4.86197C12.0651 5.12232 12.0651 5.54443 11.8047 5.80478C11.5444 6.06513 11.1223 6.06513 10.8619 5.80478L8 2.94285L5.13807 5.80478C4.87772 6.06513 4.45561 6.06513 4.19526 5.80478C3.93491 5.54443 3.93491 5.12232 4.19526 4.86197L7.5286 1.52864Z"
                    fill="#3C50E0"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M7.99967 1.33337C8.36786 1.33337 8.66634 1.63185 8.66634 2.00004V10C8.66634 10.3682 8.36786 10.6667 7.99967 10.6667C7.63148 10.6667 7.33301 10.3682 7.33301 10V2.00004C7.33301 1.63185 7.63148 1.33337 7.99967 1.33337Z"
                    fill="#3C50E0"
                  />
                </svg>
              </span>
              <p class="text-sm font-medium">
                <span class="text-primary">Click to upload</span> or drag and drop
              </p>
              <p class="mt-1.5 text-sm font-medium">SVG, PNG, JPG or GIF</p>
              <p class="text-sm font-medium">(max 3MB)</p>
            </div>
          </div>
          <!-- Save  Buttons -->
          <div class="flex justify-end gap-4.5">
            <button
              class="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
              type="button"
              @click="$router.back()"
            >
              Cancel
            </button>
            <button
              class="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
              type="submit"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Form>
  </div>
</template>
