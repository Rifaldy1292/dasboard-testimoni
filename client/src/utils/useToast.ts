import type { ToastServiceMethods } from 'primevue'
import { useToast as primevueUseToast } from 'primevue/usetoast'

// Custom hook to use PrimeVue Toast
const useToast = (): ToastServiceMethods => {
  const toast = primevueUseToast()
  return {
    add: (options) => toast.add({ life: 5000, ...options }),
    remove: toast.remove,
    removeGroup: toast.removeGroup,
    removeAllGroups: toast.removeAllGroups
  }
}

export default useToast
