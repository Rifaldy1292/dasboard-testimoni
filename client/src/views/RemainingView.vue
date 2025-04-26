<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DataNotFound from '@/components/common/DataNotFound.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import RemainingCard from '@/components/modules/remaining/RemainingCard.vue'
import { useUsers } from '@/composables/useUsers'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { onMounted } from 'vue'

onMounted(async () => {
  await fetchOperatorMachine()
})

const { loadingFetch, fetchOperatorMachine, operatorMachines, fetchUsers, users } = useUsers()
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault pageTitle="Next Process" />
    <LoadingAnimation :state="loadingFetch" />
    <DataNotFound :condition="!operatorMachines.length" />
    <template v-if="operatorMachines.length">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-6">
        <template v-for="(operator, index) in operatorMachines" :key="index">
          <RemainingCard
            @refetch-machine="fetchOperatorMachine"
            @showDropdownUser="
              async () => {
                if (users.length) return
                await fetchUsers()
              }
            "
            :machine="operator"
            :users
            v-model:loadingfetch="loadingFetch"
          />
        </template>
      </div>
    </template>
  </DefaultLayout>
</template>
