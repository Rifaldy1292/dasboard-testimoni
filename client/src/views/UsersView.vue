<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import ListUser from '@/components/modules/ListUser/ListUser.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault pageTitle="User List" />
    <ListUser />
  </DefaultLayout>
</template>
