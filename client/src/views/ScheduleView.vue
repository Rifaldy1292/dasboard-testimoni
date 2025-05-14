<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import { type CalendarOptions } from '@fullcalendar/core'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import useWebsocket from '@/composables/useWebsocket'
import type { PayloadWebsocket } from '@/types/websocket.type'
import type { Machine, MachineTimeline, ObjMachineTimeline } from '@/types/machine.type'
import DatePickerDay from '@/components/common/DatePickerDay.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import InputSwitch from 'primevue/inputswitch'

// Definisi type untuk resource
interface Resource {
  id: string
  title: string
}

// Definisi type untuk event
interface CalendarEvent {
  id: string
  resourceId: string
  title: string
  start: string
  end: string
  color: string
  extendedProps?: {
    description: string | null
    status: Machine['status']
    operator: string | null
    output_wp: string | null
    g_code_name: string | null
    k_num: string | null
  }
}

const dateOption = ref<Date>(new Date())
// Toggle untuk menampilkan extendedProps dalam title
const showDetailsInTitle = ref<boolean>(false)

// Payload untuk websocket
const payloadWs = computed<PayloadWebsocket>(() => {
  return {
    type: 'timeline',
    data: {
      date: dateOption.value.toISOString()
    }
  }
})

// Menggunakan composable useWebsocket untuk mendapatkan data
const { loadingWebsocket, timelineMachines, sendMessage } = useWebsocket(payloadWs.value)

// Konversi data mesin menjadi resources untuk FullCalendar
const resources = computed<Resource[]>(() => {
  if (!timelineMachines.value?.data) return []

  return timelineMachines.value.data.map((machine: MachineTimeline) => ({
    id: machine.name.toLowerCase().replace('-', ''),
    title: machine.name
  }))
})

// Fungsi untuk menentukan warna berdasarkan status
const getColorByStatus = (status: Machine['status']): string => {
  if (status === 'Running') return '#25c205'
  if (status === 'Stopped') return '#de2902'
  if (status === 'DISCONNECT') return '#ffffff' // Ubah menjadi putih
  return '#adaaa0' // default untuk status lainnya
}

// Fungsi untuk memvalidasi tanggal
const isValidDate = (date: Date): boolean => {
  return !isNaN(date.getTime())
}

// 21212
// Fungsi untuk parsing timeDifference dengan penanganan error
const parseTimeDifference = (timeDiffMS: number, startDate: Date): Date => {
  try {
    const endDate = new Date(startDate.getTime())

    // Jika format timeDifference tidak valid, kembalikan tanggal 1 jam setelah startDate
    if (!timeDiffMS || isNaN(timeDiffMS)) {
      endDate.setHours(endDate.getHours() + 1)
      return endDate
    }

    // Tambahkan milidetik ke tanggal awal
    endDate.setTime(endDate.getTime() + timeDiffMS)

    // Jika tidak ada perubahan waktu, tambahkan 1 jam sebagai default
    if (endDate.getTime() === startDate.getTime()) {
      endDate.setHours(endDate.getHours() + 1)
    }

    return endDate
  } catch (error) {
    console.error('Error parsing timeDifference:', error)
    // Fallback: kembalikan tanggal 1 jam setelah startDate
    const fallbackDate = new Date(startDate.getTime())
    fallbackDate.setHours(fallbackDate.getHours() + 1)
    return fallbackDate
  }
}

// Konversi data log mesin menjadi events untuk FullCalendar
const events = computed<CalendarEvent[]>(() => {
  if (!timelineMachines.value?.data) {
    console.log('No timeline data available')
    return []
  }

  console.log('Timeline data:', timelineMachines.value.data)

  const allEvents: CalendarEvent[] = []

  timelineMachines.value.data.forEach((machine: MachineTimeline) => {
    const resourceId = machine.name.toLowerCase().replace('-', '')

    console.log(`Processing machine ${machine.name} with ${machine.MachineLogs.length} logs`)

    machine.MachineLogs.forEach((log: ObjMachineTimeline) => {
      // Periksa apakah log valid dan memiliki properti yang diperlukan
      if (!log || typeof log !== 'object') {
        console.warn(`Invalid log object in machine ${machine.name}:`, log)
        return
      }

      // Periksa properti isNext dengan lebih hati-hati
      if (log.isNext === true) {
        console.log(`Skipping log ${log.id || 'unknown'} because it's a future log`)
        return
      }

      try {
        // Periksa apakah createdAt ada dan valid
        if (!log.createdAt) {
          console.warn(`Log ${log.id || 'unknown'} has no createdAt property`)
          return
        }

        // Mendapatkan tanggal dari createdAt dengan validasi
        const startDate = new Date(log.createdAt)
        if (!isValidDate(startDate)) {
          console.warn(`Invalid start date for log ${log.id || 'unknown'}:`, log.createdAt)
          return // Skip this log
        }

        // Periksa apakah timeDifference ada
        if (!log.timeDifference) {
          console.warn(`Log ${log.id || 'unknown'} has no timeDifference property`)
          // Gunakan waktu default (1 jam)
          const endDate = new Date(startDate.getTime())
          endDate.setHours(endDate.getHours() + 1)

          const event = {
            id: `${machine.name}-${log.id || Math.random().toString(36).substring(2, 9)}`,
            resourceId,
            title: log.description || (log.current_status === 'Running' ? 'Running' : 'Stopped'),
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            color: getColorByStatus(log.current_status),
            extendedProps: {
              description: log.description,
              operator: log.operator,
              output_wp: log.output_wp,
              g_code_name: log.g_code_name,
              k_num: log.k_num,
              status: log.current_status
            }
          }

          console.log(`Created event with default duration for log ${log.id || 'unknown'}:`, event)
          allEvents.push(event)
          return
        }

        // Menghitung tanggal akhir dengan penanganan error
        const endDate = parseTimeDifference(log.timeDifferenceMs, startDate)

        // Validasi tanggal akhir
        if (!isValidDate(endDate)) {
          console.warn(`Invalid end date calculated for log ${log.id || 'unknown'}`)
          return // Skip this log
        }

        // Pastikan tanggal akhir lebih besar dari tanggal mulai
        if (endDate <= startDate) {
          console.warn(
            `End date is not after start date for log ${log.id || 'unknown'}, adjusting...`
          )
          endDate.setHours(startDate.getHours() + 1) // Tambahkan 1 jam sebagai default
        }

        const event = {
          id: `${machine.name}-${log.id || Math.random().toString(36).substring(2, 9)}`,
          resourceId,
          title: log.timeDifference,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          color: getColorByStatus(log.current_status),
          extendedProps: {
            description: log.description,
            operator: log.operator,
            output_wp: log.output_wp,
            g_code_name: log.g_code_name,
            k_num: log.k_num,
            status: log.current_status
          }
        }

        console.log(`Created event for log ${log.id || 'unknown'}:`, event)
        allEvents.push(event)
      } catch (error) {
        console.error(`Error processing log ${log.id || 'unknown'}:`, error)
        // Skip this log on error
      }
    })
  })

  console.log(`Total events created: ${allEvents.length}`)
  return allEvents
})

// Opsi untuk FullCalendar
const calendarOptions = computed<CalendarOptions>(() => {
  const today = new Date(dateOption.value)
  today.setHours(0, 0, 0, 0)

  return {
    schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
    plugins: [resourceTimelinePlugin, interactionPlugin, timeGridPlugin, dayGridPlugin],
    initialView: 'resourceTimelineDay',
    resources: resources.value,
    events: events.value,
    slotMinTime: '00:00:00',
    slotMaxTime: '24:00:00',
    height: 'auto',
    initialDate: today,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth'
    },
    eventContent: (arg) => {
      // Membuat konten kustom untuk event
      const eventEl = document.createElement('div')
      eventEl.className = 'custom-event-content'

      // Menambahkan judul event
      const titleEl = document.createElement('div')
      titleEl.className = 'event-title'
      titleEl.textContent = arg.event.title
      eventEl.appendChild(titleEl)

      // Jika toggle aktif, tambahkan detail dari extendedProps
      if (showDetailsInTitle.value && arg.event.extendedProps) {
        const detailsEl = document.createElement('div')
        detailsEl.className = 'event-details'

        // Status
        if (arg.event.extendedProps.status) {
          const statusEl = document.createElement('div')
          statusEl.innerHTML = `<strong>Status:</strong> ${arg.event.extendedProps.status}`
          detailsEl.appendChild(statusEl)
        }

        // K-Number
        if (arg.event.extendedProps.k_num) {
          const knumEl = document.createElement('div')
          knumEl.innerHTML = `<strong>K-Num:</strong> ${arg.event.extendedProps.k_num}`
          detailsEl.appendChild(knumEl)
        }

        // G-Code
        if (arg.event.extendedProps.g_code_name) {
          const gcodeEl = document.createElement('div')
          gcodeEl.innerHTML = `<strong>G-Code:</strong> ${arg.event.extendedProps.g_code_name}`
          detailsEl.appendChild(gcodeEl)
        }

        // Output
        if (arg.event.extendedProps.output_wp) {
          const outputEl = document.createElement('div')
          outputEl.innerHTML = `<strong>Output:</strong> ${arg.event.extendedProps.output_wp}`
          detailsEl.appendChild(outputEl)
        }

        // Operator
        if (arg.event.extendedProps.operator) {
          const operatorEl = document.createElement('div')
          operatorEl.innerHTML = `<strong>Operator:</strong> ${arg.event.extendedProps.operator}`
          detailsEl.appendChild(operatorEl)
        }

        // Description (jika berbeda dari title)
        if (arg.event.extendedProps.description) {
          const descEl = document.createElement('div')
          descEl.innerHTML = `<strong>Desc:</strong> ${arg.event.extendedProps.description}`
          detailsEl.appendChild(descEl)
        }

        eventEl.appendChild(detailsEl)
      }

      return { domNodes: [eventEl] }
    },
    eventDidMount: (info) => {
      // Add status as a data attribute
      if (info.event.extendedProps?.status) {
        info.el.setAttribute('data-status', info.event.extendedProps.status)
      }

      // Existing tooltip code
      if (info.event.extendedProps) {
        const tooltipText = [
          `Status: ${info.event.extendedProps.status || '-'}`,
          `Description: ${info.event.extendedProps.description || '-'}`,
          `K-NUMBER: ${info.event.extendedProps.k_num || '-'}`,
          `G-CODE: ${info.event.extendedProps.g_code_name || '-'}`,
          `Output WP: ${info.event.extendedProps.output_wp || '-'}`,
          `Operator: ${info.event.extendedProps.operator || '-'}`
        ].join('\n')

        info.el.title = tooltipText
      } else {
        info.el.removeAttribute('title')
      }
    }
  }
})

// Watch perubahan pada payload untuk mengirim ulang request
watch(
  () => payloadWs.value,
  (newPayload) => {
    sendMessage(newPayload)
  }
)

// Debug: log data saat berubah
watch(
  () => timelineMachines.value,
  (newData) => {
    console.log('Timeline data updated:', newData)
  }
)

const calendarKey = ref(0)

// Watch perubahan pada toggle untuk memperbarui tampilan
watch(
  () => showDetailsInTitle.value,
  () => {
    calendarKey.value += 1 // Ubah key untuk memicu re-render
  }
)
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault pageTitle="Timeline2" />
    <LoadingAnimation :state="loadingWebsocket" />
    <template v-if="!loadingWebsocket">
      <div class="p-4">
        <div class="flex justify-between mb-4">
          <DatePickerDay v-model:date-option="dateOption" />
          <div class="flex items-center">
            <div class="flex items-center mr-4">
              <label for="toggleDetails" class="mr-2">Show Details:</label>
              <InputSwitch id="toggleDetails" v-model="showDetailsInTitle" />
            </div>
          </div>
        </div>
        <FullCalendar :options="calendarOptions" :key="calendarKey" />
      </div>
    </template>
  </DefaultLayout>
</template>

<style>
/* Styling untuk event kustom */
.custom-event-content {
  padding: 4px;
  overflow: hidden;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Styling untuk event dengan status DISCONNECT */
.fc-timeline-event[data-status='DISCONNECT'] .custom-event-content {
  color: #000000;
  background-color: #ffffff;
}

/* Memperbaiki tampilan event di FullCalendar */
.fc-timeline-event {
  overflow: visible !important;
  height: auto !important;
  min-height: 30px;
}

.fc-timeline-event .fc-event-main {
  overflow: visible !important;
  height: auto !important;
  padding: 0 !important;
}

.fc-timeline-event-harness {
  height: auto !important;
}

/* Memastikan teks dapat wrap */
.fc .fc-timeline-event .fc-event-title {
  white-space: normal !important;
}
</style>
