<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import type { DialogFormProps } from '@/components/DialogForm/DialogForm.type'
import DialogForm from '@/components/DialogForm/DialogForm.vue'
import { formatTimeDifference } from '@/utils/formatDate.util'
import useToast from '@/composables/useToast'
import { Button, InputText } from 'primevue'

export interface ModalResetPasswordProps {
  token: string
  exp: number
  name: string
}

const { data } = defineProps<{ data: ModalResetPasswordProps }>()

const visibleDialogResetPassword = defineModel<boolean>('visibleDialogResetPassword', {
  required: true
})

const toast = useToast()

const dataDialogConfirm = computed<DialogFormProps>(() => ({
  header: `Copy this link to reset password for ${data.name}`,
  description: formatTimeDifference(data.exp)
}))

const resetPasswordLink = ref<string>(window.location.href)
watch(visibleDialogResetPassword, (value) => {
  if (value === true) {
    let url = window.location.href
    // hapus # dari indeks terakhir jika ada
    if (url[url.length - 1] === '#') {
      url = url.slice(0, -1)
    }
    resetPasswordLink.value = `${url}/reset-password/${data.token}`
  } else {
    resetPasswordLink.value = window.location.href
  }
})

const handleCopyLink = () => {
  navigator.clipboard.writeText(resetPasswordLink.value)
  toast.add({
    severity: 'success',
    summary: 'copied!'
  })
}
</script>

<template>
  <DialogForm v-model:visibleDialogForm="visibleDialogResetPassword" :data="dataDialogConfirm">
    <template #body>
      <div class="flex flex-col gap-4">
        <InputText v-model="resetPasswordLink" readonly />
        <Button label="Copy" @click="handleCopyLink" />
      </div>
    </template>
  </DialogForm>
</template>
