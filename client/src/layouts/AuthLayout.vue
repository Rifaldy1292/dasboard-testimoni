<script setup lang="ts">
defineProps<{
  page: string
}>()
</script>

<template>
  <div class="bg-gray-50 font-[sans-serif]">
    <div class="min-h-screen flex flex-col items-center justify-center py-6 px-4">
      <div class="max-w-md w-full">
        <a href="#"
          ><img
            src="@/assets/images/logo/yamaha-gakki.svg"
            alt="logo"
            class="w-40 mb-8 mx-auto block"
          />
        </a>

        <div class="p-8 rounded-2xl bg-white shadow">
          <h2 class="text-gray-800 text-center text-2xl font-bold">{{ page }}</h2>

          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
