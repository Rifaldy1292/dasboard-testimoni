import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import AuthView from '@/views/Authentication/AuthView.vue'
import ForgotPasswordView from '@/views/Authentication/ForgotPasswordView.vue'
import UsersView from '@/views/UsersView.vue'
import ResetPasswordView from '@/views/Authentication/ResetPasswordView.vue'
import EditProfileView from '@/views/EditProfileView.vue'
import CuttingTimeView from '@/views/CuttingTimeView.vue'
import RunningTimeView from '@/views/RunningTimeView.vue'
import TransferFileView from '@/views/TransferFileView.vue'
import DashboardSettingView from '@/views/DashboardSettingView.vue'
import Timeline2View from '@/views/Timeline2View.vue'
import Timeline1View from '@/views/Timeline1View.vue'
import RemainingView from '@/views/RemainingView.vue'

const routes: Readonly<RouteRecordRaw[]> = [
  {
    path: '/',
    name: 'dashboard',
    redirect: { name: 'runningTime' },
    children: [
      {
        path: 'running-time',
        name: 'runningTime',
        component: RunningTimeView,
        meta: {
          title: 'Running Time'
        }
      },
      {
        path: 'timeline1',
        name: 'timeline1',
        component: Timeline1View,
        meta: {
          title: 'Timeline 1'
        }
      },
      {
        path: 'timeline2',
        name: 'timeline2',
        component: Timeline2View,
        meta: {
          title: 'Timeline 2'
        }
      },
      {
        path: 'cutting-time',
        name: 'cuttingTime',
        component: CuttingTimeView,
        meta: {
          title: 'Cutting Time'
        }
      },
      {
        path: 'remaining',
        name: 'remaining',
        component: RemainingView,
        meta: {
          title: 'Remaining Time'
        }
      },
      {
        path: '/users',
        name: 'Users',
        component: UsersView,
        meta: {
          title: 'User List'
        }
      },

      {
        path: 'edit-profile',
        name: 'editProfile',
        component: EditProfileView,
        meta: {
          title: 'Edit Profile'
        }
      },
      {
        path: 'transfer-file',
        name: 'transferFile',
        component: TransferFileView,
        meta: {
          title: 'Transfer File'
        }
      },
      {
        path: 'dashboard-settings',
        name: 'dashboardSettings',
        component: DashboardSettingView,
        meta: {
          title: 'Dashboard Settings'
        }
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: AuthView,
    meta: {
      title: 'Login'
    }
  },
  {
    path: '/register',
    name: 'register',
    component: AuthView,
    meta: {
      title: 'Register'
    }
  },
  {
    path: '/forgot-password',
    name: 'forgotPassword',
    component: ForgotPasswordView,
    meta: {
      title: 'Forgot Password'
    }
  },
  {
    path: '/users/reset-password/:token',
    name: 'resetPassword',
    component: ResetPasswordView,
    meta: {
      title: 'Reset Password'
    },
    beforeEnter: (to, from, next) => {
      const token = to.params.token
      if (token) {
        next()
      } else {
        next({ name: 'login' })
      }
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  // Set document title berdasarkan meta.title
  document.title = `${to.meta.title} | Yamaha Dashboard`
  // document.title = `${to.meta.title} | Dashboard`

  const userData = localStorage.getItem('user') // Ambil userData dari localStorage

  // Temukan route root (routes[0]) dan semua children-nya
  const dashboardRoute = routes.find((route) => route.name === 'dashboard')

  const protectedRouteName = dashboardRoute
    ? [dashboardRoute.name, ...(dashboardRoute.children?.map((child) => child.name) || [])]
    : []

  const authRouteName = ['login', 'register', 'forgotPassword']

  // Cek apakah route yang dituju termasuk dalam protectedRouteName
  if (to.name && protectedRouteName.includes(to.name) && !userData) {
    // Jika tidak ada userData, redirect ke login
    return next({ name: 'login' }) // Redirect ke login jika tidak ada userData
  }

  // Cek apakah route yang dituju termasuk dalam authRouteName
  if (to.name && authRouteName.includes(to.name as string) && userData) {
    // Jika ada userData, redirect ke dashboard
    return next({ name: 'dashboard' }) // Redirect ke dashboard jika ada userData
  }

  next()
})
export default router
