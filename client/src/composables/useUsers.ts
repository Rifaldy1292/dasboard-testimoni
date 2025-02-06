import { ref, shallowRef } from 'vue'
import type { ModalResetPasswordProps } from '@/components/modules/ListUser/ModalResetPassword.vue'
import UserServices from '@/services/user.service'
import type { User } from '@/types/user.type'
import useToast from '@/utils/useToast'
import { jwtDecode } from 'jwt-decode'
import { useConfirm } from 'primevue'
import type { ParamsGetUsers } from '@/dto/user.dto'
import { AxiosError } from 'axios'

export const useUsers = () => {
  const toast = useToast()
  const confirm = useConfirm()

  const users = ref<User[]>([])
  const user = ref<User | undefined>()
  const loadingFetch = shallowRef(false)
  const visibleDialogResetPassword = shallowRef(false)
  const tokenResetPassword = ref<ModalResetPasswordProps>({
    token: '',
    exp: 0,
    name: ''
  })

  const getDetailUser = async () => {
    try {
      loadingFetch.value = true
      const { data } = await UserServices.findById()
      user.value = data.data
      console.log({ value: user.value })
    } catch (error) {
      console.error(error)
      if (error instanceof AxiosError) {
        return toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data.message
        })
      }
    } finally {
      loadingFetch.value = false
    }
  }
  const fetchUsers = async (params?: ParamsGetUsers): Promise<void> => {
    try {
      loadingFetch.value = true
      const { data } = await UserServices.getUsers(params)
      users.value = data.data
    } catch (error) {
      console.error(error)
      toast.add({
        severity: 'error',
        summary: 'error',
        detail: 'failed to get user list'
      })
    } finally {
      loadingFetch.value = false
    }
  }

  const handleDeleteUser = async (selectedUser: User): Promise<void> => {
    confirm.require({
      message: `Are you sure you want to delete ${selectedUser.name}?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      acceptProps: {
        label: 'Delete',
        severity: 'danger'
      },
      accept: async (): Promise<void> => {
        await deleteUser(selectedUser)
      }
    })
  }
  const deleteUser = async (selectedUser: User): Promise<void> => {
    try {
      await UserServices.deleteById(selectedUser.id)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: `${selectedUser.name} has been deleted`
      })
      await fetchUsers()
    } catch (error) {
      console.error(error)
      toast.add({
        severity: 'error',
        summary: 'error',
        detail: `failed to delete ${selectedUser.name}`
      })
    }
  }

  const handleResetPassword = async (selectedUser: User): Promise<void> => {
    try {
      const { data } = await UserServices.resetPassword(selectedUser.id)
      const { token } = data.data
      const decoded = jwtDecode(token)
      tokenResetPassword.value = {
        token,
        exp: decoded.exp as number,
        name: selectedUser.name
      }
      console.log(tokenResetPassword.value.exp, 22)
      visibleDialogResetPassword.value = true
    } catch (error) {
      console.error(error)
      toast.add({
        severity: 'error',
        summary: 'error',
        detail: `failed to reset password ${selectedUser.name}`
      })
    }
  }

  return {
    users,
    loadingFetch,
    fetchUsers,
    handleDeleteUser,
    handleResetPassword,
    visibleDialogResetPassword,
    tokenResetPassword,
    getDetailUser,
    user
  }
}
