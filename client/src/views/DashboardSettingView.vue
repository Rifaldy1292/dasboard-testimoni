<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import StartTime from '@/components/modules/dashboardSetting/StartTime.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { TabList, TabPanel, TabPanels, Tabs } from 'primevue'
import { h, provide, shallowRef } from 'vue'
import CuttingTime from '@/components/modules/dashboardSetting/CuttingTime.vue'
import MachineTable from '@/components/modules/dashboardSetting/MachineTable.vue'

const activeTab = shallowRef<number>(0)
provide('activeTab', activeTab)

const tabbItems = [
  {
    id: 0,
    label: 'Start Time',
    content: h(StartTime)
  },
  {
    id: 1,
    label: 'Cutting Time',
    content: h(CuttingTime)
  },
  {
    id: 2,
    label: 'Machines',
    content: h(MachineTable)
  }
]
</script>

<template>
  <DefaultLayout>
    <!-- Breadcrumb Start -->
    <BreadcrumbDefault pageTitle="Dashboard Settings" />
    <!-- Breadcrumb End -->
    <div class="border-b border-stroke py-4 px-7 dark:border-strokedark">
      <h3 class="font-medium text-black dark:text-white text-center">
        Dashboard Configuration Settings
      </h3>
    </div>

    <Tabs :value="activeTab" class="bg-white dark:bg-boxdark rounded-lg shadow-md">
      <TabList class="flex items-center gap-4 p-4 border-b border-stroke dark:border-strokedark">
        <template v-for="tab in tabbItems" :key="tab.id">
          <Tab
            @click="activeTab = tab.id"
            :value="tab.id"
            class="px-6 py-3 rounded-lg font-medium text-black dark:text-white hover:bg-bodydark1 dark:hover:bg-boxdark-2 transition-all duration-300 cursor-pointer"
          >
            {{ tab.label }}
          </Tab>
        </template>
      </TabList>
      <TabPanels class="p-4">
        <TabPanel v-for="tab in tabbItems" :key="tab.id" :value="tab.id">
          <component :is="tab.content" />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </DefaultLayout>
</template>
