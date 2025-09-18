<script setup lang="ts">
import { useDarkModeStore } from '@/stores/darkMode'
import { onMounted } from 'vue'
import video from '@/assets/videos/tf_mc3.mp4'

defineProps<{
  page: string
  description?: string | null
}>()

const { setDarkMode } = useDarkModeStore()

onMounted(() => {
  setDarkMode(true)
})
</script>

<template>
  <div
    class="bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 dark text-white font-[sans-serif]"
  >
    <div class="min-h-screen flex flex-col items-center justify-center py-10 px-4">
      <div class="max-w-md w-full">
        <a href="#">
          <img alt="logo" class="w-40 mb-6 mx-auto block brightness-200 contrast-125" />
        </a>

        <div class="p-8 rounded-2xl bg-white/10 shadow-xl backdrop-blur-xl border border-white/20">
          <h2 class="text-center text-3xl font-bold text-white tracking-wide">{{ page }}</h2>
          <h5 v-if="description" class="text-blue-300 text-center mt-2">{{ description }}</h5>
          <!-- link video tutorial -->
          <p class="text-center text-red-400 mt-2">
            <a :href="video" target="_blank" rel="noopener noreferrer" class="hover:underline">
              Tutorial Transfer File MC-3
            </a>
          </p>

          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
