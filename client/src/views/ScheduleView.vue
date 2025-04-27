<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { VueCal, addDatePrototypes, stringToDate, countDays } from 'vue-cal'
import 'vue-cal/style'

// Definisikan tipe event
interface CalendarEvent {
  id: number
  title: string
  start: string // Format: 'YYYY-MM-DD HH:mm'
  end: string // Format: 'YYYY-MM-DD HH:mm'
  class?: string // Warna custom (opsional)
}

// Data event contoh
const events: CalendarEvent[] = [
  {
    id: 1,
    title: 'Phone Support - Renewals',
    start: '2025-10-25 09:00',
    end: '2025-10-25 10:00',
    class: 'phone-support' // Untuk styling custom
  },
  {
    id: 2,
    title: 'Server Installation',
    start: '2025-10-25 11:00',
    end: '2025-10-25 13:00',
    class: 'server-install'
  }
]

const schedules = [
  { id: 1, class: 'MC-1', label: 'MC-1' },
  { id: 2, class: 'MC-2', label: 'MC-2' },
  { id: 3, class: 'MC-3', label: 'MC-3' },
  { id: 4, class: 'MC-4', label: 'MC-4' },
  { id: 5, class: 'MC-5', label: 'MC-5' }
]
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault pageTitle="Next Process" />
    <vue-cal
      :views="['day', 'week']"
      :time-from="8 * 60"
      :time-to="24 * 60"
      editable-events
      :schedules
    />
    <!-- <LoadingAnimation :state="loadingFetch" />
    <DataNotFound :condition="!operatorMachines.length" /> -->
  </DefaultLayout>
</template>

<style>
/* You can easily set a different style for each schedule of your days. */
.vuecal__schedule.MC-1 {
  background-color: rgba(221, 238, 255, 0.5);
}
.vuecal__schedule.MC-2 {
  background-color: rgba(255, 232, 251, 0.5);
}
.vuecal__schedule.MC-3 {
  background-color: rgba(221, 255, 239, 0.5);
}
.vuecal__schedule.MC-4 {
  background-color: rgba(255, 250, 196, 0.5);
}
.vuecal__schedule.MC-5 {
  background-color: rgba(255, 206, 178, 0.5);
}
.vuecal__schedule--heading {
  color: rgba(0, 0, 0, 0.5);
  font-size: 26px;
}

.vuecal__event {
  color: #fff;
  border: 1px solid;
}
.vuecal__event.leisure {
  background-color: #fd9c42d9;
  border-color: #e9882e;
}
.vuecal__event.health {
  background-color: #57cea9cc;
  border-color: #90d2be;
}
.vuecal__event.sport {
  background-color: #ff6666d9;
  border-color: #eb5252;
}
</style>
