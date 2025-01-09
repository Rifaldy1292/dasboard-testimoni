<script setup lang="ts">
import type { DialogFormProps } from '@/components/DialogForm/DialogForm.type'
import DialogForm from '@/components/DialogForm/DialogForm.vue'
import { Button, InputText } from 'primevue'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const visibleDialogResetPassword = defineModel<boolean>('visibleDialogResetPassword', {
  required: true
})

const dataDialogConfirm: DialogFormProps = {
  header: 'Reset Password',
  description: 'Copy this link to reset password for this user'
}

const route = useRoute()

const resetPasswordLink = ref<string>(window.location.href)

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
