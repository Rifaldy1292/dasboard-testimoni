<script setup lang="ts">
defineProps<{
  pageTitle: string
}>()
</script>

<template>
  <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <h2 class="text-title-md2 font-semibold text-black dark:text-white">
      {{ pageTitle }}
    </h2>

    <nav>
      <ol class="flex items-center gap-2">
        <li>
          <router-link class="font-medium" to="/"> Machine / </router-link>
        </li>
        <li class="font-medium text-primary">{{ pageTitle }}</li>
      </ol>
    </nav>
  </div>
</template>
