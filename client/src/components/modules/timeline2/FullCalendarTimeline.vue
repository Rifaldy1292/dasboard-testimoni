<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import { type CalendarOptions } from '@fullcalendar/core'
import type {
  Machine,
  MachineTimeline,
  ObjMachineTimeline,
  Project,
  AllMachineTimeline
} from '@/types/machine.type'
import { useToast } from 'primevue'

interface Resource {
  id: string
  title: string
}

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
    next_projects: Project[]
  }
}

interface Props {
  showDetailsInTitle?: boolean
  slotLabelInterval?: number
  calendarKey?: number
  isNowDate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetailsInTitle: false,
  slotLabelInterval: 1_800_000, // Default 30mnt
  calendarKey: 0,
  isNowDate: false
})

// Using defineModel to share timeline data with parent
const timelineMachines = defineModel<AllMachineTimeline | null>({ required: true })

const toast = useToast()

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

// Fungsi untuk parsing timeDifference dengan penanganan error
const parseTimeDifference = (timeDiffMS: number, startDate: Date): Date => {
  try {
    const endDate = new Date(startDate.getTime())

    // Jika format timeDifference tidak valid, kembalikan tanggal 1 jam setelah startDate
    if (!timeDiffMS || isNaN(timeDiffMS)) {
      endDate.setTime(endDate.getTime() + 1)
      return endDate
    }

    // Tambahkan milidetik ke tanggal awal
    endDate.setTime(endDate.getTime() + timeDiffMS)

    // Jika tidak ada perubahan waktu, tambahkan 1 jam sebagai default
    if (endDate.getTime() === startDate.getTime()) {
      endDate.setTime(endDate.getTime() + 1)
    }

    return endDate
  } catch (error) {
    console.error('Error parsing timeDifference:', error)
    // Fallback: kembalikan tanggal 1 jam setelah startDate
    const fallbackDate = new Date(startDate.getTime())
    fallbackDate.setTime(fallbackDate.getTime() + 1)
    return fallbackDate
  }
}

// Konversi data log mesin menjadi events untuk FullCalendar
const events = computed<CalendarEvent[]>(() => {
  if (!timelineMachines.value?.data) {
    return []
  }

  const allEvents: CalendarEvent[] = []

  timelineMachines.value.data.forEach((machine: MachineTimeline) => {
    const resourceId = machine.name.toLowerCase().replace('-', '')

    machine.MachineLogs.forEach((log: ObjMachineTimeline) => {
      try {
        // Periksa apakah createdAt ada dan valid
        if (!log.createdAt) {
          return
        }

        // Mendapatkan tanggal dari createdAt dengan validasi
        const startDate = new Date(log.createdAt)
        if (!isValidDate(startDate)) {
          return // Skip this log
        }

        // Periksa apakah timeDifference ada
        if (!log.timeDifference) {
          // Gunakan waktu default (1 jam)
          const endDate = new Date(startDate.getTime())
          endDate.setTime(endDate.getTime() + 1) // + 1 ms
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
              status: log.current_status,
              next_projects: log.next_projects,
              remaining: log?.remaining
            }
          }
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
            status: log.current_status,
            next_projects: log.next_projects,
            remaining: log?.remaining
          }
        }
        allEvents.push(event)
      } catch (error) {
        console.error(`Error processing log ${log.id || 'unknown'}:`, error)
      }
    })
  })

  return allEvents
})

// Opsi untuk FullCalendar
const calendarOptions = computed<CalendarOptions>(() => {
  const dateFrom = timelineMachines.value?.dateFrom
    ? new Date(timelineMachines.value.dateFrom)
    : new Date()
  const dateTo = timelineMachines.value?.dateTo
    ? new Date(timelineMachines.value.dateTo)
    : new Date()
  const stringDateTo = new Date(dateTo).toLocaleTimeString('en-US', {
    hour12: false
  })
  console.log(dateTo, dateFrom)
  let slotMaxTime: string = stringDateTo
  // if day dateTo > dateFrom, set slotMaxTime to +1 day
  if (new Date(dateTo).getDate() > new Date(dateFrom).getDate()) {
    const newHour = new Date(dateTo).getHours() + 24
    slotMaxTime = `${newHour}:${stringDateTo.split(':')[1]}:${stringDateTo.split(':')[2]}`
  } else if (
    [30, 31].includes(new Date(dateFrom).getDate()) &&
    new Date(dateTo).getDate() === 1 &&
    new Date(dateFrom).getMonth() !== new Date(dateTo).getMonth() &&
    new Date(dateTo).getTime() > new Date(dateFrom).getTime()
  ) {
    console.log('ini terpanggil')
    const newHour = new Date(dateTo).getHours() + 24
    slotMaxTime = `${newHour}:${stringDateTo.split(':')[1]}:${stringDateTo.split(':')[2]}`
  }
  console.log(slotMaxTime)
  return {
    noEventsText: 'No Timeline Found',
    plugins: [resourceTimelinePlugin, interactionPlugin, timeGridPlugin, dayGridPlugin],
    resourceOrder: (a: any, b: any) => {
      // Urutkan resources berdasarkan nama mesin
      const nameA = parseInt(a.title.slice(2))
      const nameB = parseInt(b.title.slice(2))
      return nameB - nameA
    },
    initialView: 'resourceTimelineDay',
    resources: resources.value,
    events: events.value,
    slotMinTime: timelineMachines.value
      ? new Date(timelineMachines.value?.dateFrom).toLocaleTimeString('en-US', {
          hour12: false
        })
      : '00:00:00',
    slotMaxTime,
    height: 'auto',
    initialDate: timelineMachines.value?.date,
    headerToolbar: {
      left: undefined,
      right: undefined,
      center: 'title'
    },
    titleFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    slotDuration: '00:05:00', // Set slot per 5 menit
    slotLabelInterval: props.slotLabelInterval, // Menggunakan prop slotLabelInterval
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    snapDuration: '00:05:00', // Snapping events ke interval 5 menit
    scrollTime: '00:00:00', // Mulai scroll dari jam 00:00
    resourceAreaWidth: '15%',
    nowIndicator: props.isNowDate,
    eventContent: (arg) => {
      // Custom event content
      const eventEl = document.createElement('div')
      eventEl.className = 'custom-event-content'

      // Menambahkan judul event
      const titleEl = document.createElement('div')
      titleEl.className = 'event-title'
      titleEl.textContent = arg.event.title
      eventEl.appendChild(titleEl)

      // Jika toggle aktif, tambahkan detail dari extendedProps
      if (props.showDetailsInTitle && arg.event.extendedProps) {
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
      if (!info.event) return

      // Type assertion for extendedProps
      const extendedProps = info.event.extendedProps as CalendarEvent['extendedProps']
      if (!extendedProps) return
      const { status, description, g_code_name, k_num, operator, output_wp, next_projects } =
        extendedProps

      if (status) {
        info.el.setAttribute('data-status', status)
      }

      if (extendedProps) {
        const tooltipText = []
        // time
        tooltipText.push(`time: ${info.event.title || '-'}`)
        tooltipText.push(`Status: ${status || '-'}`)
        status !== 'Running' && tooltipText.push(`Description: ${description || '-'}`)
        tooltipText.push(`K-NUMBER: ${k_num || '-'}`)
        tooltipText.push(`G-CODE: ${g_code_name || '-'}`)
        tooltipText.push(`Output WP: ${output_wp || '-'}`)
        tooltipText.push(`Operator: ${operator || '-'}`)
        if (next_projects.length) {
          tooltipText.push(`\nNext Projects:`)
          next_projects.forEach((project: any, index: any) => {
            tooltipText.push(`${index + 1}.`)
            tooltipText.push(`Time: ${project.total_cutting_time}`)
            tooltipText.push(`G-Code: ${project.g_code_name}`)
            tooltipText.push(`Output WP: ${project.output_wp}`)
            tooltipText.push(`K_NUM: ${project.k_num}`)
            project?.remaining && tooltipText.push(`Remaining: ${project.remaining}`)
            tooltipText.push(' ')
          })
        }

        info.el.title = tooltipText.join('\n')
      } else {
        info.el.removeAttribute('title')
      }
    },
    eventClick: (info) => {
      const {
        status,
        description,
        k_num,
        g_code_name,
        output_wp,
        operator,
        next_projects = []
      } = info.event.extendedProps

      const tooltipText = []
      // time
      tooltipText.push(`Time: ${info.event.title || '-'}`)
      // const title = info.event.title || ''

      // const match = title.match(/(?:(\d+)m)?\s*(?:(\d+)s)?/)
      // let minutes = 0
      // let seconds = 0

      // if (match) {
      //   minutes = Number(match[1]) || 0
      //   seconds = Number(match[2]) || 0
      // }

      // // total detik × 2
      // const totalSeconds = (minutes * 60 + seconds) * 2

      // // konversi ke jam-menit-detik
      // const hours = Math.floor(totalSeconds / 3600)
      // const remainingSeconds = totalSeconds % 3600
      // const finalMinutes = Math.floor(remainingSeconds / 60)
      // const finalSeconds = remainingSeconds % 60

      // // buat string tampilan waktu
      // let timeText = ''
      // if (hours > 0) {
      //   timeText += `${hours}h `
      // }
      // if (finalMinutes > 0 || hours > 0) {
      //   timeText += `${finalMinutes}m `
      // }
      // timeText += `${finalSeconds}s`

      // tooltipText.push(`Time: ${timeText.trim()}`)

      console.log(info.event.title)
      console.log('tes')
      tooltipText.push(`Status: ${status || '-'}`)
      status !== 'Running' && tooltipText.push(`Description: ${description || '-'}`)
      tooltipText.push(`K-NUMBER: ${k_num || '-'}`)
      tooltipText.push(`G-CODE: ${g_code_name || '-'}`)
      tooltipText.push(`Output WP: ${output_wp || '-'}`)
      tooltipText.push(`Operator: ${operator || '-'}`)
      if (next_projects.length) {
        tooltipText.push(`\nNext Projects:`)
        next_projects.forEach((project: any, index: any) => {
          tooltipText.push(`${index + 1}.`)
          tooltipText.push(`  G-Code: ${project.g_code_name}`)
          tooltipText.push(`  Output WP: ${project.output_wp}`)
          tooltipText.push(`  K_NUM: ${project.k_num}`)
          tooltipText.push(`  Time: ${project.total_cutting_time}s`)
        })
      }
      toast.add({
        severity: 'info',
        summary: 'Log Details',
        detail: tooltipText.join('\n'),
        life: 10000
      })
    },
    viewDidMount: (arg) => {
      // Auto-scroll to current time when calendar is mounted
      setTimeout(() => {
        const calendarApi = arg.view.calendar
        const currentTime = new Date()

        // Check if current time is within the calendar's visible range
        const viewStart = arg.view.currentStart
        const viewEnd = arg.view.currentEnd

        if (currentTime >= viewStart && currentTime <= viewEnd && props.isNowDate) {
          // Format current time as HH:MM:SS string for scrollToTime
          const hours = (currentTime.getHours() - 1).toString().padStart(2, '0')
          const minutes = currentTime.getMinutes().toString().padStart(2, '0')
          const seconds = currentTime.getSeconds().toString().padStart(2, '0')
          const timeString = `${hours}:${minutes}:${seconds}`

          // Use FullCalendar's built-in scrollToTime method
          calendarApi.scrollToTime(timeString)
        }
      }, 100) // Small delay to ensure calendar is fully rendered
    }
  }
})

// Reference to FullCalendar instance
const calendarRef = ref<InstanceType<typeof FullCalendar>>()

// Auto-scroll to current time after calendar re-renders
watch(
  () => props.calendarKey,

  () => {
    // Wait for next tick to ensure calendar is fully rendered
    setTimeout(() => {
      if (calendarRef.value) {
        const calendarApi = calendarRef.value.getApi()
        const currentTime = new Date()

        if (!props.isNowDate) return // Skip if not current date

        // Format current time as HH:MM:SS string for scrollToTime
        const hours = (currentTime.getHours() - 1).toString().padStart(2, '0')
        const minutes = currentTime.getMinutes().toString().padStart(2, '0')
        const seconds = currentTime.getSeconds().toString().padStart(2, '0')
        const timeString = `${hours}:${minutes}:${seconds}`

        // Use FullCalendar's built-in scrollToTime method
        calendarApi.scrollToTime(timeString)
      }
    }, 200)
  }
)
</script>

<template>
  <FullCalendar
    ref="calendarRef"
    v-if="timelineMachines?.data?.length"
    :options="calendarOptions"
    :key="calendarKey"
  />
</template>

<style>
/* Styling untuk event kustom */
.custom-event-content {
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
  height: auto !important;
  min-height: 30px;
}

.fc-timeline-event .fc-event-main {
  height: auto !important;
  padding: 0 !important;
  overflow: hidden !important;
  max-height: 30px !important;
}

/* Memperbaiki tampilan slot waktu */
.fc .fc-timeline-event .fc-event-title {
  white-space: normal !important;
}

/* Styling untuk label waktu */
.fc-timeline-slot-label {
  font-size: 0.8em !important;
  padding: 2px !important;
}

/* Styling untuk now indicator */
.fc-timeline-now-indicator-line {
  border-color: #ff0000 !important;
  border-width: 2px !important;
  z-index: 1000 !important;
}

.fc-timeline-now-indicator-arrow {
  border-color: #ff0000 !important;
  border-width: 5px !important;
}
</style>
