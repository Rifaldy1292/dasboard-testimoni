<script setup lang="ts">
import HeaderArea from '@/components/Header/HeaderArea.vue'
import SidebarArea from '@/components/Sidebar/SidebarArea.vue'
import type { UserLocalStorage } from '@/types/localStorage.type'
import { provide } from 'vue'

defineProps<{ timelinePage?: boolean }>()

const userData: UserLocalStorage = JSON.parse(localStorage.getItem('user') || '{}')
provide('userData', userData)
</script>

<template>
  <!-- ===== Page Wrapper Start ===== -->
  <div class="flex h-screen overflow-hidden">
    <!-- ===== Sidebar Start ===== -->
    <SidebarArea />
    <!-- ===== Sidebar End ===== -->

    <!-- ===== Content Area Start ===== -->
    <div class="w-full flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
      <!-- ===== Header Start ===== -->
      <HeaderArea />
      <!-- ===== Header End ===== -->

      <!-- ===== Main Content Start ===== -->
      <main>
        <div class="mx-auto p-4 md:p-6 2xl:p-10 w-full h-full">
          <slot></slot>
        </div>
      </main>
      <!-- ===== Main Content End ===== -->
    </div>
  </div>
  <!-- ===== Page Wrapper End ===== -->
</template>
