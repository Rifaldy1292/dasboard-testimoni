<script setup lang="ts">
defineProps<{ tittle?: string; condition: boolean }>()
</script>

<template>
  <div v-if="condition" class="text-center text-xl font-bold text-black dark:text-white">
    <h1 class="text-4xl font-bold">{{ tittle || 'Data' }} Not Found</h1>
  </div>
</template>
