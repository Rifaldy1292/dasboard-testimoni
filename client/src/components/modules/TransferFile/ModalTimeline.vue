<script setup lang="ts">
import type { MachineTimeline } from '@/types/machine.type'
import TimelineMachine from '../timeline/TimelineMachine.vue'
import { Dialog } from 'primevue'

defineProps<{ timeline: MachineTimeline }>()

const visibleDialogForm = defineModel<boolean>('visibleDialogForm', {
  required: true
})
</script>

<template>
  <Dialog
    v-model:visible="visibleDialogForm"
    modal
    :style="{ width: '70vw' }"
    :header="timeline?.name ?? 'Timeline'"
    @hide="visibleDialogForm = false"
  >
    <template #default>
      <div class="max-w-203">
        <TimelineMachine :machine="timeline" :resize-count="2" />
      </div>
    </template>
  </Dialog>
</template>
