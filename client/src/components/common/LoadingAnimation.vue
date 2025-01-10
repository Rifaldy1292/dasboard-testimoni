<script setup lang="ts">
defineProps<{
  state: boolean
}>()
</script>

<template>
  <!-- loader -->
  <div v-if="state" class="w-full h-full fixed top-0 left-0 bg-white opacity-75 z-50">
    <div class="flex justify-center items-center mt-[50vh]">
      <div class="fas fa-circle-notch fa-spin fa-5x text-violet-600"></div>
    </div>
  </div>
</template>
