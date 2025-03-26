<script setup lang="ts">
import { useFTP } from '@/composables/useFTP'
import type { ContentFile } from '@/types/ftp.type'
import { InputNumber, type InputNumberInputEvent } from 'primevue'

const { file, index } = defineProps<{
  file: ContentFile
  index: number
  isResultFile?: boolean
}>()

const { inputFiles } = useFTP()

const handleInputToolNumber = (event: InputNumberInputEvent): void => {
  const inputToolNumber = event.value as number
  // O1234  to 34
  const fileName = inputFiles.value[index].name.slice(-2)
  const newInputFiles = inputFiles.value.map((item) => {
    const test = fileName === item.name.slice(-2)
    if (!test) return item
    return { ...item, toolNumber: inputToolNumber }
  })

  inputFiles.value = newInputFiles
}
</script>

<template>
  <div class="p-5">
    <h3 class="mb-1.5 text-2xl font-medium text-black dark:text-white">
      Preview {{ isResultFile ? 'Main Program' : 'File' }} {{ file.name || '-' }}
    </h3>
    <div v-if="!isResultFile" class="flex items-center gap-1">
      <label class="text-semibold text-black dark:text-white" for="inputToolNumber"
        >Tool Number</label
      >
      <br />
      <InputNumber
        v-model:model-value="inputFiles[index].toolNumber"
        @input="handleInputToolNumber"
        size="small"
        aria-label="inputToolNumber"
        :useGrouping="false"
      />
    </div>
    <div class="max-h-70 overflow-x-auto">
      <!-- <pre v-if="!isResultFile" style="white-space: pre-wrap">
 {{ handlePreviewContent(file) }}</pre
      > -->
      <pre style="white-space: pre-wrap">{{ file.content }}</pre>
    </div>
  </div>
  <div class="col-span-5"></div>
</template>
