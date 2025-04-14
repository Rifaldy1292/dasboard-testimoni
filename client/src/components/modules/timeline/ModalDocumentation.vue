<script setup lang="ts">
import type { MachineTimeline } from '@/types/machine.type'
import TimelineMachine from './TimelineMachine.vue'
import { Dialog } from 'primevue'

const timelineDocs: MachineTimeline = {
  name: 'Documentation',
  status: 'Running',
  MachineLogs: [
    {
      createdAt: '07:00(last updated)',
      description: 'Manual operation(can be edited)',
      current_status: 'Running',
      g_code_name: '2501241D1705(G-CODE)',
      id: 1,
      k_num: '03.01 SEMI D10R2 L40 T0.06_ORG_1(K-NUM)',
      output_wp: 'BAWAH_24(OUTPUT WP)',
      operator: 'ANO(operator name)',
      total_cutting_time: 10,
      timeDifference: '1h 2m 3s(total)'
    },
    {
      createdAt: '10:00(last updated)',
      description: 'DANDORI(Description can be edited)',
      current_status: 'Stopped',
      g_code_name: '2501241D1705(GCODE)',
      id: 1,
      k_num: '03.01 SEMI D10R2 L40 T0.06_ORG_1(K-NUM)',
      output_wp: 'BAWAH_24(OUTPUT WP)',
      operator: 'ANO(operator name)',
      total_cutting_time: 10,
      timeDifference: '2h 2m 3s'
    }
  ]
}

const visibleDialogForm = defineModel<boolean>('visibleDialogForm', {
  required: true
})
</script>

<template>
  <Dialog v-model:visible="visibleDialogForm" :header="timelineDocs.name">
    <template #default>
      <div class="max-w-203">
        <TimelineMachine :machine="timelineDocs" is-docs />
      </div>
    </template>
  </Dialog>
</template>
