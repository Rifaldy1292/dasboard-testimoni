<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import ListOperator from '@/components/Modules/ListOperator.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault pageTitle="Operator List" />
    <ListOperator />
  </DefaultLayout>
</template>
