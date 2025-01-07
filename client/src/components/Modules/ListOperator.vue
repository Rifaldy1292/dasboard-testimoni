<script setup lang="ts">
import { DataTable } from 'primevue'
import BreadcrumbDefault from '../Breadcrumbs/BreadcrumbDefault.vue'
</script>

<template>
  <h1>List Operator</h1>
  <BreadcrumbDefault pageTitle="Operator List" />
  <DataTable
    :value="machine"
    :size="'large'"
    lazy
    showGridlines
    tableStyle="min-width: 50rem "
    selection-mode="single"
  >
    <Column
      v-for="col of columns"
      :key="col.field"
      :field="col.field"
      :header="col.header"
      :sortable="col.sortable"
    >
      <template v-if="col.field === 'status'" #body="{ data }">
        <Badge
          v-if="col.field === 'status'"
          :severity="badgeSeverity(data.status)"
          :value="data.status"
        />
      </template>
    </Column>
    <Column :header="'Actions'" class="w-24 !text-end">
      <template #body="{ data }">
        <div class="flex gap-3">
          <i
            v-if="pageTitle === 'Manual'"
            v-tooltip.top="'Edit'"
            @click="handleClickIcon('edit', data)"
            class="pi pi-pencil"
            style="font-size: 1rem"
          />
          <i
            v-tooltip.top="'Details'"
            @click="handleClickIcon('details', data)"
            class="pi pi-info-circle"
            style="font-size: 1rem"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
