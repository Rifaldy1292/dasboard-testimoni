<script setup lang="ts">
import { useSidebarStore } from '@/stores/sidebar'
import { onClickOutside } from '@vueuse/core'
import { computed, ref } from 'vue'
import SidebarItem from './SidebarItem.vue'
import type { UserLocalStorage } from '@/types/localStorage.type'

export type MenuItem = {
  icon: string
  label: string
  route: string
  visible: boolean
  children?: MenuItem[]
}

type MenuGroup = {
  name: string
  menuItems: MenuItem[]
}

const target = ref(null)
const sidebarStore = useSidebarStore()
const { role }: UserLocalStorage = JSON.parse(localStorage.getItem('user') || '{}')

onClickOutside(target, () => {
  sidebarStore.isSidebarOpen = false
})

const menuGroups = computed<MenuGroup[]>(() => {
  return [
    {
      name: 'MENU',
      menuItems: [
        {
          label: 'Machine',
          route: '#',
          visible: true,
          icon: `<i class="fa-solid fa-industry fa-beat"></i>`,
          children: [
            {
              label: 'Running Time',
              route: '/running-time',
              visible: true,
              icon: `<i class="fa-solid fa-clock fa-spin-pulse"></i>`
            },
            {
              label: 'Timeline',
              route: '/timeline',
              visible: true,
              icon: `<i class="fa-solid fa-timeline fa-bounce"></i>`
            },
            {
              label: 'Transfer File',
              route: '/transfer-file',
              visible: true,
              icon: `<i class="fa-solid fa-money-bill-transfer fa-flip"></i>`
            },
            {
              label: 'Cutting Time',
              route: '/cutting-time',
              visible: true,
              icon: `<i class="fa-solid fa-table-cells fa-fade"></i>`
            },
            {
              label: 'For Operators',
              route: '/manual',
              visible: true,
              icon: `<i class="fa-solid fa-table fa-fade"></i>  `
            }
          ]
        },
        {
          label: 'Users',
          route: '/users',
          visible: role === 'Admin',
          icon: `<i class="fa-solid fa-users-gear fa-fade"></i>`
        },
        {
          label: 'Remaining',
          route: '/remaining',
          visible: true,
          icon: `<i class="fa-solid fa-forward-fast fa-fade"></i>`
        }
        // {
        //   icon: `<svg
        //             class="fill-current"
        //             width="18"
        //             height="18"
        //             viewBox="0 0 18 18"
        //             fill="none"
        //             xmlns="http://www.w3.org/2000/svg"
        //           >
        //             <path
        //               d="M1.43425 7.5093H2.278C2.44675 7.5093 2.55925 7.3968 2.58737 7.31243L2.98112 6.32805H5.90612L6.27175 7.31243C6.328 7.48118 6.46862 7.5093 6.58112 7.5093H7.453C7.76237 7.48118 7.87487 7.25618 7.76237 7.03118L5.428 1.4343C5.37175 1.26555 5.3155 1.23743 5.14675 1.23743H3.88112C3.76862 1.23743 3.59987 1.29368 3.57175 1.4343L1.153 7.08743C1.0405 7.2843 1.20925 7.5093 1.43425 7.5093ZM4.47175 2.98118L5.3155 5.17493H3.59987L4.47175 2.98118Z"
        //               fill=""
        //             />
        //             <path
        //               d="M10.1249 2.5031H16.8749C17.2124 2.5031 17.5218 2.22185 17.5218 1.85623C17.5218 1.4906 17.2405 1.20935 16.8749 1.20935H10.1249C9.7874 1.20935 9.47803 1.4906 9.47803 1.85623C9.47803 2.22185 9.75928 2.5031 10.1249 2.5031Z"
        //               fill=""
        //             />
        //             <path
        //               d="M16.8749 6.21558H10.1249C9.7874 6.21558 9.47803 6.49683 9.47803 6.86245C9.47803 7.22808 9.75928 7.50933 10.1249 7.50933H16.8749C17.2124 7.50933 17.5218 7.22808 17.5218 6.86245C17.5218 6.49683 17.2124 6.21558 16.8749 6.21558Z"
        //               fill=""
        //             />
        //             <path
        //               d="M16.875 11.1656H1.77187C1.43438 11.1656 1.125 11.4469 1.125 11.8125C1.125 12.1781 1.40625 12.4594 1.77187 12.4594H16.875C17.2125 12.4594 17.5219 12.1781 17.5219 11.8125C17.5219 11.4469 17.2125 11.1656 16.875 11.1656Z"
        //               fill=""
        //             />
        //             <path
        //               d="M16.875 16.1156H1.77187C1.43438 16.1156 1.125 16.3969 1.125 16.7625C1.125 17.1281 1.40625 17.4094 1.77187 17.4094H16.875C17.2125 17.4094 17.5219 17.1281 17.5219 16.7625C17.5219 16.3969 17.2125 16.1156 16.875 16.1156Z"
        //               fill="white"
        //             />
        //           </svg>`,
        //   label: 'Forms',
        //   route: '#',
        //   children: [
        //     { label: 'Form Elements', route: '/forms/form-elements' },
        //     { label: 'Form Layout', route: '/forms/form-layout' }
        //   ]
        // }
      ]
    }
  ]
})
</script>

<template>
  <aside
    class="absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0"
    :class="{
      'translate-x-0': sidebarStore.isSidebarOpen,
      '-translate-x-full': !sidebarStore.isSidebarOpen
    }"
    ref="target"
  >
    <!-- SIDEBAR HEADER -->
    <div class="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
      <router-link to="/">
        <img src="@/assets/images/logo/yamaha-motor2.svg" test-id="jon" alt="Logo" />
        <!-- <img src="@/assets/images/logo/logo.svg" test-id="jon" alt="Logo" /> -->
      </router-link>

      <button class="block lg:hidden" @click="sidebarStore.isSidebarOpen = false">
        <svg
          class="fill-current"
          width="20"
          height="18"
          viewBox="0 0 20 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
            fill=""
          />
        </svg>
      </button>
    </div>
    <!-- SIDEBAR HEADER -->

    <div class="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
      <!-- Sidebar Menu -->
      <nav class="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
        <template v-for="menuGroup in menuGroups" :key="menuGroup.name">
          <div>
            <h3 class="mb-4 ml-4 text-sm font-medium text-bodydark2">{{ menuGroup.name }}</h3>

            <ul class="mb-6 flex flex-col gap-1.5">
              <SidebarItem
                v-for="(menuItem, index) in menuGroup.menuItems"
                :item="menuItem"
                :key="index"
                :index="index"
              />
            </ul>
          </div>
        </template>
      </nav>
      <!-- Sidebar Menu -->
    </div>
  </aside>
</template>
