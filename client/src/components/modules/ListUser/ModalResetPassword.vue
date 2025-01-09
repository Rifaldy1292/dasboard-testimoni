<script setup lang="ts">
import type { DialogFormProps } from '@/components/DialogForm/DialogForm.type'
import DialogForm from '@/components/DialogForm/DialogForm.vue'
// import useToast from '@/utils/useToast'
import { Button, InputText, useToast } from 'primevue'
import { watch } from 'vue'
import { ref } from 'vue'

const { token } = defineProps<{
  token: string
}>()

const visibleDialogResetPassword = defineModel<boolean>('visibleDialogResetPassword', {
  required: true
})

const toast = useToast()

const dataDialogConfirm: DialogFormProps = {
  header: 'Reset Password',
  description: 'Copy this link to reset password for this user'
}

const resetPasswordLink = ref<string>(window.location.href)
watch(visibleDialogResetPassword, (value) => {
  if (value) {
    resetPasswordLink.value = `${window.location.href}/reset-password/${token}`
    toast.add({
      severity: 'success',
      summary: 'copied!'
    })
  }
})

const handleCopyLink = () => {
  navigator.clipboard.writeText(resetPasswordLink.value)
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
