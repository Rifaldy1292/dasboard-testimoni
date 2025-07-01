<script setup lang="ts">
import { Button, Inplace, InputNumber } from 'primevue'
import { computed } from 'vue'

type ColorCount = {
  green: number
  yellow: number
  red: number
}
const colorCount = defineModel<ColorCount>({
  required: true
})
const colorInformation = computed<
  { color: string; label: string; value: number; colorText: keyof ColorCount }[]
>(() => [
  {
    color: '#22c55e',
    colorText: 'green',
    label: `Target >= ${colorCount.value.green}`,
    value: colorCount.value.green
  },
  {
    color: '#f59e0b',
    colorText: 'yellow',
    label: `Mendekati >= ${colorCount.value.yellow}`,
    value: colorCount.value.yellow
  },
  {
    color: '#ef4444',
    colorText: 'red',
    label: `Tidak Target < ${colorCount.value.red}`,
    value: colorCount.value.red
  }
])
</script>

<template>
  <div class="flex gap-15 border-y border-stroke px-6 py-7.5 dark:border-strokedark">
    <template v-for="item of colorInformation" :key="item.label">
      <Inplace class="flex gap-2 cursor-pointer">
        <template #display>
          <div class="w-10 h-10" :style="{ backgroundColor: item.color }" />
          <span>{{ item.label }}</span>
        </template>
        <template #content="{ closeCallback }">
          <div class="flex gap-2">
            <InputNumber
              @update:model-value="(e) => (colorCount[item.colorText] = e)"
              :model-value="item.value"
              :min="1"
              :max="100"
              inputId="input-number"
              :style="{ backgroundColor: item.color, color: '#fff' }"
              :aria-label="item.label"
            />
            <!-- icon x red -->
            <Button severity="danger" icon="pi pi-times" @click="closeCallback" />
          </div>
        </template>
      </Inplace>
    </template>
  </div>
</template>
