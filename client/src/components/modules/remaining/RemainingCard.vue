<script setup lang="ts">
import useToast from '@/composables/useToast'
import UserServices from '@/services/user.service'
import type { UserLocalStorage } from '@/types/localStorage.type'
import type { OperatorMachine, User } from '@/types/user.type'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import { Card, Checkbox, Knob, Message, Select } from 'primevue'
import { computed, inject, shallowRef } from 'vue'

type SelectedUser = OperatorMachine['User'] | null

const { machine } = defineProps<{
  machine: OperatorMachine
  users: User[]
}>()

const emit = defineEmits<{
  showDropdownUser: []
  refetchMachine: []
}>()

const toast = useToast()

const loadingfetch = defineModel<boolean>('loadingfetch', { required: true })
const userData = inject('userData') as UserLocalStorage
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const descriptionOptions = [
  { name: 'Manual Operation' },
  { name: 'Dandori Part' },
  { name: 'Dandori Tool' },
  { name: 'Cek Dimensi' },
  { name: 'Setting Nol Set' }
]

const selectedDescription = shallowRef<string | null>(machine.description)
const isChecked = shallowRef<boolean>(machine.is_work)
const showDropdown = shallowRef<boolean>(false)
const selectedUser = shallowRef<SelectedUser>(machine.User)

// watchEffect(() => {})

const remainingText = computed(() => {
  const { User, log } = machine
  const {
    createdAt,
    runningOn,
    g_code_name,
    current_status,
    calculate_total_cutting_time,
    total_cutting_time
  } = log
  const program = machine.log.g_code_name?.slice(-4)
  return {
    name: machine.name,
    current_status,
    User,
    createdAt,
    runningOn: runningOn ?? 0,
    program,
    calculate_total_cutting_time,
    total_cutting_time: total_cutting_time ?? 0,
    g_code_name: g_code_name ? `O${g_code_name.slice(-4)}` : '-',
    profile_image: User?.profile_image ? `${BASE_URL}/${User?.profile_image}` : ''
  }
})

const handleEditOperatorMachine = async () => {
  try {
    loadingfetch.value = true
    showDropdown.value = false
    const user_id = selectedUser.value?.id
    if (!user_id) {
      return toast.add({
        severity: 'info',
        summary: 'Gagal edit operator',
        detail: 'Pilih operator terlebih dahulu',
        life: 5000
      })
    }
    const { data } = await UserServices.patchOperatorMachines({
      machine_id: machine.id,
      user_id,
      description: selectedDescription.value,
      is_work: isChecked.value
    })
    emit('refetchMachine')
    toast.add({ severity: 'success', summary: 'Success', detail: data.message })
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loadingfetch.value = false
  }
}

function convertSecondsToHours(count: number, isMinute?: boolean) {
  if (isMinute) {
    return `${count}m`
  }
  const hours = Math.floor(count / 3600)
  const minutes = Math.floor((count % 3600) / 60)
  const countRemainder = count % 60

  let result = []
  if (hours > 0) result.push(`${hours}h`)
  if (minutes > 0) result.push(`${minutes}m`)
  if (countRemainder > 0) result.push(`${countRemainder}s`)

  return result.length > 0 ? result.join(' ') : '0s'
}
</script>

<template>
  <Card class="p-4 bg-white dark:bg-zinc-900 shadow-xl rounded-2xl transition-all duration-300">
    <template #header>
      <div
        :class="[
          'text-white text-center py-2 font-semibold rounded-t-xl',
          remainingText.current_status === 'Running' ? 'bg-green-600' : 'bg-red-600'
        ]"
      >
        <div class="border-b border-white inline-block pb-1">
          {{ remainingText.name }}
        </div>
        <!-- icon edit -->
        <div class="text-sm mt-1 flex flex-col gap-2 items-center justify-center">
          <span>
            {{ remainingText.User?.name ?? '-' }}
            <i
              @click="showDropdown = !showDropdown"
              v-tooltip.top="'Change Operator'"
              class="pi pi-pencil cursor-pointer"
            ></i>
          </span>

          <!-- dropdown user -->
          <Select
            @show="emit('showDropdownUser')"
            filter
            @update:model-value="
              async (e: SelectedUser) => {
                selectedUser = e
                await handleEditOperatorMachine()
              }
            "
            v-if="showDropdown"
            :options="users"
            optionLabel="name"
            :loading="loadingfetch"
            class=""
          />
        </div>
      </div>
    </template>

    <template #content>
      <div class="flex flex-col items-center mt-3 gap-3">
        <div class="flex items-center justify-between gap-4 w-full">
          <div>
            <h4 class="font-medium text-gray-700 dark:text-gray-200">Process Now</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ remainingText.g_code_name }}
            </p>
          </div>

          <img
            class="w-24 h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
            :src="remainingText.profile_image || 'https://dummyimage.com/600x400/000/fff.png'"
            alt="machine"
          />
        </div>

        <div class="flex justify-between text-sm text-gray-600 dark:text-gray-300 w-full mt-2">
          <span
            >Remaining:
            {{ remainingText.calculate_total_cutting_time?.split('.')[0] }} program</span
          >
          <span>
            {{
              convertSecondsToHours(
                remainingText.calculate_total_cutting_time?.split('.')[1]
                  ? Number(remainingText.calculate_total_cutting_time?.split('.')[1])
                  : 0
              )
            }}</span
          >
        </div>
      </div>
    </template>

    <template #footer>
      <Message
        v-if="selectedDescription"
        :severity="isChecked ? 'success' : 'error'"
        class="w-full mt-3 text-center font-bold text-2xl"
        size="large"
        :closable="selectedDescription !== null"
        @close="
          () => {
            selectedDescription = null
            isChecked = false
            handleEditOperatorMachine()
          }
        "
        :icon="`${isChecked ? 'pi pi-spin pi-cog' : 'pi pi-forward'}`"
        >{{ selectedDescription }}</Message
      >

      <div
        v-if="userData.role === 'Admin'"
        :class="`${isChecked ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-800' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-600'} w-full flex rounded-lg gap-2 justify-center items-center p-2 mt-2`"
      >
        <!-- dropdown desc -->
        <Select
          class="rounded-md flex-1 bg-transparent"
          :options="descriptionOptions"
          :model-value="selectedDescription"
          @update:model-value="
            async (e: string) => {
              selectedDescription = e
              await handleEditOperatorMachine()
            }
          "
          outlined
          option-label="name"
          option-value="name"
        />
        <Checkbox
          v-model:model-value="isChecked"
          @value-change="handleEditOperatorMachine"
          binary
        />
      </div>

      <div class="text-right mt-3 text-xs text-gray-500 dark:text-gray-400">
        <Knob
          v-model="remainingText.runningOn"
          :min="0.9"
          :max="remainingText.total_cutting_time"
          readonly
          :size="100"
          valueTemplate="{value}m"
        />

        <span
          >Total Cutting Time:
          {{ convertSecondsToHours(remainingText.total_cutting_time, true) }}</span
        >
        <br />
        <span
          >Last Update:
          {{
            // hide ms
            remainingText?.createdAt
              ? new Date(remainingText.createdAt).toLocaleTimeString('en-ID', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '-'
          }}</span
        >
      </div>
    </template>
  </Card>
</template>
