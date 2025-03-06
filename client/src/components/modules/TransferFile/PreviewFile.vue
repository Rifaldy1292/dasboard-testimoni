<script setup lang="ts">
import { useFTP } from '@/composables/useFTP'
import { InputNumber } from 'primevue'
import { shallowRef } from 'vue'

const { inputFiles, handlePreviewContent } = useFTP()
const inputToolNumber = shallowRef<number>(0)
</script>

<template>
  <template v-for="file in inputFiles" :key="file.name">
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
          size="small"
          aria-label="inputToolNumber"
          v-model="inputToolNumber"
          :useGrouping="false"
        />
      </div>
      <div class="max-w-100 overflow-x-scroll">
        <pre style="white-space: pre-wrap"> {{ handlePreviewContent(file) }}</pre>
      </div>
    </div>
    <div class="col-span-5"></div>
  </template>
</template>
