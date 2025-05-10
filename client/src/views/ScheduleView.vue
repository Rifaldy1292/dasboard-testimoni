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
import type { MachineTimeline, ObjMachineTimeline } from '@/types/machine.type'
import DatePickerDay from '@/components/common/DatePickerDay.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'

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
    status: 'Running' | 'Stopped'
    operator: string | null
    output_wp: string | null
    g_code_name: string | null
    k_num: string | null
  }
}

const dateOption = ref<Date>(new Date())

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
const getColorByStatus = (status: string): string => {
  if (status === 'Running') return '#25c205'
  if (status === 'Stopped') return '#de2902'
  return '#adaaa0' // default untuk status lainnya
}

// Fungsi untuk memvalidasi tanggal
const isValidDate = (date: Date): boolean => {
  return !isNaN(date.getTime())
}

// Fungsi untuk parsing timeDifference dengan penanganan error
const parseTimeDifference = (timeDiff: string, startDate: Date): Date => {
  try {
    const endDate = new Date(startDate.getTime())

    // Jika format timeDifference tidak valid, kembalikan tanggal 1 jam setelah startDate
    if (!timeDiff || typeof timeDiff !== 'string') {
      endDate.setHours(endDate.getHours() + 1)
      return endDate
    }

    const timeParts = timeDiff.split(' ')
    for (const part of timeParts) {
      if (part.includes('h')) {
        const hours = parseInt(part.replace('h', ''))
        if (!isNaN(hours)) endDate.setHours(endDate.getHours() + hours)
      } else if (part.includes('m')) {
        const minutes = parseInt(part.replace('m', ''))
        if (!isNaN(minutes)) endDate.setMinutes(endDate.getMinutes() + minutes)
      } else if (part.includes('s')) {
        const seconds = parseInt(part.replace('s', ''))
        if (!isNaN(seconds)) endDate.setSeconds(endDate.getSeconds() + seconds)
      }
    }

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
        const endDate = parseTimeDifference(log.timeDifference, startDate)

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
    eventDidMount: (info) => {
      // Menambahkan tooltip untuk event
      if (info.event.extendedProps) {
        const tooltip = document.createElement('div')
        tooltip.className = 'event-tooltip'
        tooltip.innerHTML = `
          <strong>Status:</strong> ${info.event.extendedProps.status || '-'}<br>
          <strong>Description:</strong> ${info.event.extendedProps.description || '-'}<br>
          <strong>K-Number:</strong> ${info.event.extendedProps.k_num || '-'}<br>
          <strong>G-Code:</strong> ${info.event.extendedProps.g_code_name || '-'}<br>
          <strong>Output:</strong> ${info.event.extendedProps.output_wp || '-'}<br>
          <strong>Operator:</strong> ${info.event.extendedProps.operator || '-'}<br>
        `

        // Menggunakan PrimeVue Tooltip atau tooltip sederhana
        info.el.title = tooltip.textContent || ''
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
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault pageTitle="Timeline2" />
    <LoadingAnimation :state="loadingWebsocket" />
    <template v-if="!loadingWebsocket">
      <div class="p-4">
        <div class="flex justify-between mb-4">
          <DatePickerDay v-model:date-option="dateOption" />
        </div>
        <FullCalendar :options="calendarOptions" />
      </div>
    </template>
  </DefaultLayout>
</template>

<style>
.event-tooltip {
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 8px;
  border-radius: 4px;
  z-index: 10000;
}
</style>
