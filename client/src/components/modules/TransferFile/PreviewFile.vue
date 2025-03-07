<script setup lang="ts">
import { useFTP } from '@/composables/useFTP'
import type { ContentFile } from '@/types/ftp.type'
import { InputNumber } from 'primevue'
import { shallowRef } from 'vue'

const { file, index } = defineProps<{
  file: ContentFile
  index: number
  isResultFile?: boolean
}>()

const { inputFiles } = useFTP()
const inputToolNumber = shallowRef<number>(0)

const handleInputToolNumber = () => {
  // console.log({ index, inputToolNumber: inputToolNumber.value })
  inputFiles.value[index].toolNumber = inputToolNumber.value
  // console.log(inputFiles.value[index])
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
        v-model:model-value="inputToolNumber"
        @update:model-value="handleInputToolNumber"
        size="small"
        aria-label="inputToolNumber"
        :useGrouping="false"
      />
    </div>
    <div class="max-h-70 overflow-x-scroll">
      <!-- <pre v-if="!isResultFile" style="white-space: pre-wrap">
 {{ handlePreviewContent(file) }}</pre
      > -->
      <pre style="white-space: pre-wrap">{{ file.content }}</pre>
    </div>
  </div>
  <div class="col-span-5"></div>
</template>
