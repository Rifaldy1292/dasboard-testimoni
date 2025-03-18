import { ref, shallowRef } from 'vue'
import type { ModalResetPasswordProps } from '@/components/modules/ListUser/ModalResetPassword.vue'
import UserServices from '@/services/user.service'
import type { OperatorMachine, User } from '@/types/user.type'
import useToast from '@/composables/useToast'
import { jwtDecode } from 'jwt-decode'
import { useConfirm } from 'primevue'
import type { ParamsGetUsers } from '@/dto/user.dto'
import { handleErrorAPI } from '@/utils/handleErrorAPI'

const user = ref<User | undefined>()

export const useUsers = () => {
  const toast = useToast()
  const confirm = useConfirm()
  const operatorMachines = ref<OperatorMachine[]>([])

  const users = ref<User[]>([])
  const loadingFetch = shallowRef(false)
  const loadingUserDropdown = shallowRef(false)
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
      handleErrorAPI(error, toast)
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
      handleErrorAPI(error, toast)
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
      handleErrorAPI(error, toast)
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
      handleErrorAPI(error, toast)
    }
  }

  const fetchOperatorMachine = async () => {
    try {
      loadingFetch.value = true
      const { data } = await UserServices.getOperatorMachines()
      operatorMachines.value = data.data
      console.log(operatorMachines.value, 'from fetch')
    } catch (error) {
      handleErrorAPI(error, toast)
    } finally {
      loadingFetch.value = false
    }
  }

  return {
    fetchOperatorMachine,
    operatorMachines,
    users,
    loadingFetch,
    fetchUsers,
    handleDeleteUser,
    handleResetPassword,
    visibleDialogResetPassword,
    tokenResetPassword,
    getDetailUser,
    user,
    loadingUserDropdown
  }
}
