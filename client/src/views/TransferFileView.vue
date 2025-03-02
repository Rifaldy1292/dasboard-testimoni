<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import TransferFile from '@/components/modules/TransferFile/TransferFile.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const pageTitle = 'Transfer File'
</script>

<template>
  <DefaultLayout>
    <!-- Breadcrumb Start -->
    <BreadcrumbDefault :pageTitle="pageTitle" />
    <!-- Breadcrumb End -->
    <TransferFile />
  </DefaultLayout>
</template>
