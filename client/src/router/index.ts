import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import SigninView from '@/views/Authentication2/SigninView.vue'
import SignupView from '@/views/Authentication2/SignupView.vue'
import CalendarView from '@/views/CalendarView.vue'
import BasicChartView from '@/views/Charts/BasicChartView.vue'
import FormElementsView from '@/views/Forms/FormElementsView.vue'
import FormLayoutView from '@/views/Forms/FormLayoutView.vue'
import TablesView from '@/views/TablesView.vue'
import AlertsView from '@/views/UiElements/AlertsView.vue'
import ButtonsView from '@/views/UiElements/ButtonsView.vue'
import ManualView from '@/views/ManualView.vue'
import AuthView from '@/views/Authentication/AuthView.vue'
import ForgotPasswordView from '@/views/Authentication/ForgotPasswordView.vue'
import UsersView from '@/views/UsersView.vue'
import ResetPasswordView from '@/views/Authentication/ResetPasswordView.vue'
import OperatorsView from '@/views/OperatorsView.vue'
import EditProfileView from '@/views/EditProfileView.vue'
import TimelineView from '@/views/TimelineView.vue'
import CuttingTimeView from '@/views/CuttingTimeView.vue'
import RunningTimeView from '@/views/RunningTimeView.vue'

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
        path: 'timeline',
        name: 'timeline',
        component: TimelineView,
        meta: {
          title: 'Timeline'
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
        path: 'manual',
        name: 'manual',
        component: ManualView,
        meta: {
          title: 'Manual'
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
        path: '/operators',
        name: 'Operators',
        component: OperatorsView,
        meta: {
          title: 'Operator List'
        }
      },
      {
        path: 'edit-profile',
        name: 'editProfile',
        component: EditProfileView,
        meta: {
          title: 'Edit Profile'
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
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: CalendarView,
    meta: {
      title: 'Calendar'
    }
  },

  {
    path: '/forms/form-elements',
    name: 'formElements',
    component: FormElementsView,
    meta: {
      title: 'Form Elements'
    }
  },
  {
    path: '/forms/form-layout',
    name: 'formLayout',
    component: FormLayoutView,
    meta: {
      title: 'Form Layout'
    }
  },
  {
    path: '/tables',
    name: 'tables',
    component: TablesView,
    meta: {
      title: 'Tables'
    }
  },

  {
    path: '/charts/basic-chart',
    name: 'basicChart',
    component: BasicChartView,
    meta: {
      title: 'Basic Chart'
    }
  },
  {
    path: '/ui-elements/alerts',
    name: 'alerts',
    component: AlertsView,
    meta: {
      title: 'Alerts'
    }
  },
  {
    path: '/ui-elements/buttons',
    name: 'buttons',
    component: ButtonsView,
    meta: {
      title: 'Buttons'
    }
  },
  {
    path: '/auth/signin',
    name: 'signin',
    component: SigninView,
    meta: {
      title: 'Signin'
    }
  },
  {
    path: '/auth/signup',
    name: 'signup',
    component: SignupView,
    meta: {
      title: 'Signup'
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
