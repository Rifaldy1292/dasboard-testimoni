<script setup lang="ts">
import { useFTP } from '@/composables/useFTP'
import type { FileWithContent } from '@/types/ftp.type'
import { InputNumber } from 'primevue'
import { shallowRef } from 'vue'

const { file, index } = defineProps<{
  file: FileWithContent
  index: number
}>()

const { handlePreviewContent, inputFiles } = useFTP()
const inputToolNumber = shallowRef<number>(0)

const handleInputToolNumber = () => {
  console.log({ index, inputToolNumber: inputToolNumber.value })
  inputFiles.value[index].toolNumber = inputToolNumber.value
  console.log(inputFiles.value[index])
}

const addToolNumberToNTFile = (fileContent: string): string => {
  const lines = fileContent.split('\n')

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '%') {
      lines.splice(i + 1, 0, `{toolNumber: ${inputToolNumber.value}}`)
      break
    }
  }

  return lines.join('\n')
}
</script>

<template>
  <div class="p-5">
    <h3 class="mb-1.5 text-2xl font-medium text-black dark:text-white">
      Preview File {{ file.name || '-' }}
    </h3>
    <div class="flex items-center gap-1">
      <label class="text-semibold text-black dark:text-white" for="inputToolNumber"
        >Tool Number</label
      >
      <br />
      <InputNumber
        v-model:model-value="inputToolNumber"
        @update:model-value="handleInputToolNumber"
        size="small"
        aria-label="inputToolNumber"
        :useGrouping="false"
      />
    </div>
    <div class="max-w-100 overflow-x-scroll">
      <pre style="white-space: pre-wrap"> {{ handlePreviewContent(file) }}</pre>
    </div>
  </div>
  <div class="col-span-5"></div>
</template>
