<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DataNotFound from '@/components/common/DataNotFound.vue'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import RemainingCard from '@/components/modules/remaining/RemainingCard.vue'
import { useUsers } from '@/composables/useUsers'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { animate, stagger } from 'motion'
import { nextTick, onMounted, watch } from 'vue'

const { loadingFetch, fetchOperatorMachine, operatorMachines, fetchUsers, users } = useUsers()

onMounted(async () => {
  await fetchOperatorMachine()
})

watch(
  () => operatorMachines.value,
  async (newData) => {
    if (newData.length) {
      await nextTick()
      animate(
        '.remaining-card',
        {
          opacity: [0, 1],
          y: [50, 0]
        },
        {
          duration: 1, // Durasi lebih panjang
          delay: stagger(0.2), // Delay antar card lebih lama
          ease: 'backInOut' // Easing yang lebih dinamis
        }
      )
    }
  },
  { immediate: true }
)
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
            class="remaining-card"
          />
        </template>
      </div>
    </template>
  </DefaultLayout>
</template>
