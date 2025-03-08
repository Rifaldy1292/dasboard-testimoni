import type { ToastMessageOptions, ToastServiceMethods } from 'primevue'
import { useToast as primevueUseToast } from 'primevue/usetoast'
import successSound from '../assets/sounds/success.mp3'
import errorSound from '../assets/sounds/error.mp3'

// Custom hook to use PrimeVue Toast
const useToast = (): ToastServiceMethods & {
  add: (options: ToastMessageOptions & { customMusic?: string }) => void
} => {
  const toast = primevueUseToast()

  const severitySounds: { [key: string]: string } = {
    success: successSound, // Sesuaikan jalur
    error: errorSound, // Sesuaikan jalur
    warn: '/warn.mp3', // Sesuaikan jalur
    info: '/info.mp3' // Sesuaikan jalur
  }

  const playSound = (severity: string) => {
    const soundSrc = severitySounds[severity]
    if (soundSrc) {
      const audio = new Audio(soundSrc)
      audio.play()
    }
  }

  return {
    add: (options: ToastMessageOptions & { customMusic?: string }) => {
      toast.add({ life: 5000, ...options })
      if (options.severity) {
        if (!options.customMusic) return playSound(options.severity)
        const audio = new Audio(options.customMusic)
        return audio.play()
      }
    },
    remove: toast.remove,
    removeGroup: toast.removeGroup,
    removeAllGroups: toast.removeAllGroups
  }
}

export default useToast
