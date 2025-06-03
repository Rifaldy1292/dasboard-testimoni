<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import CuttingTime from '@/components/modules/cuttingTime/CuttingTime.vue'
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault page-title="Cutting Time" />

    <div class="mt-4 grid grid-cols gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
      <CuttingTime />
    </div>
  </DefaultLayout>
</template>
