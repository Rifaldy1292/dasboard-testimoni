import type { FormSubmitEvent } from '@primevue/forms'

export interface FormValue<T extends Record<string, any>> extends FormSubmitEvent {
  values: T
}
