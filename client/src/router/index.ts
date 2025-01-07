import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import SigninView from '@/views/Authentication2/SigninView.vue'
import SignupView from '@/views/Authentication2/SignupView.vue'
import CalendarView from '@/views/CalendarView.vue'
import BasicChartView from '@/views/Charts/BasicChartView.vue'
import ECommerceView from '@/views/Dashboard/ECommerceView.vue'
import FormElementsView from '@/views/Forms/FormElementsView.vue'
import FormLayoutView from '@/views/Forms/FormLayoutView.vue'
import SettingsView from '@/views/Pages/SettingsView.vue'
import ProfileView from '@/views/ProfileView.vue'
import TablesView from '@/views/TablesView.vue'
import AlertsView from '@/views/UiElements/AlertsView.vue'
import ButtonsView from '@/views/UiElements/ButtonsView.vue'
import RealTimeView from '@/views/RealTimeView.vue'
import ManualView from '@/views/ManualView.vue'
import AuthView from '@/views/Authentication/AuthView.vue'

const routes: Readonly<RouteRecordRaw[]> = [
  {
    path: '/',
    name: 'dashboard',
    redirect: { name: 'realTime' },
    children: [
      {
        path: 'real-time',
        name: 'realTime',
        component: RealTimeView,
        meta: {
          title: 'Real Time'
        }
      },
      {
        path: 'real-time/detail',
        name: 'realTimeDetail',
        component: ECommerceView,
        meta: {
          title: 'Detail Real Time'
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
        path: 'manual/detail',
        name: 'manualDetail',
        component: ECommerceView,
        meta: {
          title: 'Detail Manual Machine'
        }
      },
      {
        path: '/operator',
        name: 'operator',
        component: ManualView,
        meta: {
          title: 'Operator'
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
    path: '/pages/settings',
    name: 'settings',
    component: SettingsView,
    meta: {
      title: 'Settings'
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
  document.title = `${to.meta.title} | Yamaha Dashboard`
  next()
})

export default router
