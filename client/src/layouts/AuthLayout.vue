<script setup lang="ts">
defineProps<{
  page: string
  description?: string | null
}>()
</script>

<template>
  <div class="bg-gray-900 text-white font-[sans-serif]">
    <div class="min-h-screen flex flex-col items-center justify-center py-10 px-4">
      <div class="max-w-md w-full">
        <a href="#">
          <img
            src="@/assets/images/logo/yamaha-motor.svg"
            alt="logo"
            class="w-40 mb-6 mx-auto block brightness-200 contrast-125"
          />
        </a>

        <div class="p-8 rounded-2xl bg-gray-800 shadow-lg ring-1 ring-blue-500/30 backdrop-blur-md">
          <h2 class="text-center text-3xl font-bold text-white tracking-wide">{{ page }}</h2>
          <h5 v-if="description" class="text-blue-300 text-center mt-2">{{ description }}</h5>

          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
