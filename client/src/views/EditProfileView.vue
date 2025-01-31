<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import SettingsCard from '@/components/SettingsCard.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const pageTitle = 'Edit Profile'
</script>

<template>
  <DefaultLayout>
    <div class="mx-auto max-w-270">
      <!-- Breadcrumb Start -->
      <BreadcrumbDefault :pageTitle="pageTitle" />
      <!-- Breadcrumb End -->
      <SettingsCard />
    </div>
  </DefaultLayout>
</template>
