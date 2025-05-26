<script setup lang="ts">
import TimelineMachine from '../timeline/TimelineMachine.vue'
import { Dialog } from 'primevue'
import { storeToRefs } from 'pinia'
import { useDialogStore } from '@/stores/dialog'
import { useTimelineStore } from '@/stores/timeline'

const { dialogState } = storeToRefs(useDialogStore())
const { closeTimelineDialog } = useDialogStore()
const { timelineNullDescription } = storeToRefs(useTimelineStore())
</script>

<template>
  <Dialog
    v-if="timelineNullDescription"
    v-model:visible="dialogState.visibleTimelineDialog"
    modal
    :style="{ width: '70vw' }"
    :header="timelineNullDescription.name ?? 'Timeline'"
    @hide="closeTimelineDialog()"
  >
    <template #default>
      <div class="max-w-203">
        <TimelineMachine :machine="timelineNullDescription" :resize-count="2" />
      </div>
    </template>
  </Dialog>
</template>
