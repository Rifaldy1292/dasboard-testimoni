<script setup lang="ts">
import { useFTP } from '@/composables/useFTP'
import type { ContentFile } from '@/types/ftp.type'
import { InputNumber, Select, type InputNumberInputEvent } from 'primevue'

const { file, index } = defineProps<{
  file: ContentFile
  index: number
  isResultFile?: boolean
}>()

const { inputFiles } = useFTP()

const workPositionOptions = Array.from({ length: 6 }, (_, i) => i + 54)

const handleInputToolNumber = (event: InputNumberInputEvent): void => {
  const inputToolNumber = event.value as number
  // 1234 to 34
  const fileName = inputFiles.value[index].name.slice(-2)

  inputFiles.value = inputFiles.value.map((item, indexFile) => {
    const hasSameFileNameSuffix = fileName === item.name.slice(-2)
    if (!hasSameFileNameSuffix || indexFile < index) return item
    return { ...item, toolNumber: inputToolNumber }
  })
}
</script>

<template>
  <div class="p-5">
    <h3 class="mb-1.5 text-2xl font-medium text-black dark:text-white">
      Preview {{ isResultFile ? 'Main Program' : 'File' }} {{ file.name || '-' }}
    </h3>
    <div v-if="!isResultFile" class="flex items-center gap-1">
      <div>
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

      <div>
        <label class="mb-1.5 block text-sm font-medium text-black dark:text-white"
          >Work Position</label
        >
        <div class="relative flex items-center">
          <Select
            filter
            v-model:model-value="inputFiles[index].workPosition"
            :options="workPositionOptions"
            placeholder="Select Work Position"
            fluid
          />
        </div>
      </div>
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
