<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { VueCal } from 'vue-cal'
import 'vue-cal/style'
import { ref, watchEffect } from 'vue'

// Definisikan tipe event
interface CalendarEvent {
  id: number
  title: string
  start: string // Format: 'YYYY-MM-DD HH:mm'
  end: string // Format: 'YYYY-MM-DD HH:mm'
  class?: string // Warna custom (opsional)
  schedule?: number // ID schedule (opsional)
}

const date = new Date()
const formatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
})
const formattedDate = formatter.format(date).replace(',', '')

const events = ref<CalendarEvent[]>([
  {
    id: 1,
    title: 'Contoh KNUM',
    start: '2025-04-28 12:00',
    end: '2025-04-28 17:00',
    class: 'leisure',
    schedule: 1
  }
])

watchEffect(() => console.log(events.value, 'events'))

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
    <BreadcrumbDefault pageTitle="Schedule" />
    <vue-cal
      :views="['day', 'week']"
      view="day"
      @event-created="console.log(events.length)"
      :time-from="8 * 60"
      :time-to="24 * 60"
      v-model:events="events"
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
