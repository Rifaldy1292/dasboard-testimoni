import { AxiosError } from 'axios'
import { type ToastServiceMethods } from 'primevue'

export const handleErrorAPI = (error: unknown, toast?: ToastServiceMethods) => {
  console.error(error)
  if (error instanceof AxiosError && toast) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data.message
    })
  }
}
