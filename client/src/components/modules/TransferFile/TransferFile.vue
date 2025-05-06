<script setup lang="ts">
import { FormField } from '@primevue/forms'
import { computed, inject, onUnmounted } from 'vue'
import { useMachine } from '@/composables/useMachine'
import LoadingAnimation from '@/components/common/LoadingAnimation.vue'
import { useFTP } from '@/composables/useFTP'
import MachineServices from '@/services/machine.service'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import useToast from '@/composables/useToast'
import AdditionalFields from './AdditionalFields.vue'
import PreviewFile from './PreviewFile.vue'
import { contentMainProgram } from './utils/contentMainProgram.util'
import type { MachineOption } from '@/types/machine.type'
import type { ContentFile } from '@/types/ftp.type'
import type { UserLocalStorage } from '@/types/localStorage.type'
import { useConfirm } from 'primevue'
import { useRouter } from 'vue-router'
import happpySound from '@/assets/sounds/happy.mp3'
import RemoveFile from './RemoveFile.vue'
import { handleNullDescriptionTimeline } from './utils/handleSelectMachine.util'

onUnmounted(() => {
  handleClearFile()
})

const toast = useToast()
const confirm = useConfirm()
const router = useRouter()

const {
  selectedOneMachine,
  selectedProgramNumber,
  selectedCoordinate,
  inputStartPoint,
  selectedCoolant
} = useMachine()

const userData = inject('userData') as UserLocalStorage

const {
  handleUploadFolder,
  selectedWorkPosition,
  uploadType,
  inputFiles,
  loadingUpload,
  selectedAction,
  isCreatedMainProgram,
  handleClearFile
} = useFTP()

const disabled = computed<{ disableExecute: boolean; disableUpload: boolean }>(() => {
  const disableUpload = !selectedOneMachine.value
  const disableExecute = !inputFiles.value.length

  return { disableExecute, disableUpload }
})

const handleSubmit = async () => {
  loadingUpload.value = true
  try {
    const reverseObjectToFiles = inputFiles.value.map((item) => {
      return new File([item.content], item.name)
    })

    const { data } = await MachineServices.postFiles({
      machine_id: selectedOneMachine.value?.id as number,
      files: reverseObjectToFiles
    })
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: data.message
    })
    // logout confirm
    setTimeout(() => {
      confirm.require({
        header: 'Logout',
        message: 'Do you want to logout?',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          console.log('trigger')
          localStorage.clear()
          router.replace('/login')
          toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Logged out successfully',
            customMusic: happpySound
          })
        },
        rejectProps: {
          label: 'Cancel',
          severity: 'secondary',
          outlined: true
        },
        reject: handleClearFile
      })
    }, 1000)
  } catch (error) {
    handleErrorAPI(error, toast)
  } finally {
    loadingUpload.value = false
  }
}

const handleExecute = (): void => {
  try {
    loadingUpload.value = true

    const content = contentMainProgram({
      inputFiles: inputFiles.value,
      selectedCoolant: selectedCoolant.value,
      selectedCoordinate: selectedCoordinate.value,
      selectedOneMachine: selectedOneMachine.value as MachineOption,
      selectedProgramNumber: selectedProgramNumber.value,
      inputStartPoint: inputStartPoint.value,
      selectedWorkPosition: selectedWorkPosition.value,
      user: userData
    })

    const mainProgramContent: ContentFile = {
      content,
      name: 'O00' + selectedProgramNumber.value,
      gCodeName: '',
      kNum: '',
      outputWP: '',
      toolName: '',
      totalCuttingTime: '',
      toolNumber: 0,
      calculateTotalCuttingTime: 0,
      workPosition: 0
    }

    const extendedFiles: ContentFile[] = [mainProgramContent, ...inputFiles.value]
    inputFiles.value = extendedFiles
    isCreatedMainProgram.value = true
    console.log({ inputFiles: inputFiles.value })
    // console.log({ content })

    // const mainProgramFileWithContent = new File([content], `${inputFileName.value}`, {
    //   type: 'File'
    // })
    // const mainProgramFile = mainProgramFileWithContent
    // const convertInputFileToOriginalFiles = inputFiles.value.map((file) => {
    //   return new File([file], `${file.name}`, {
    //     type: 'File'
    //   })
    // })

    // const mainProgramFile = new File([content], `${inputFileName.value}`, {
    //   // type File
    //   type: 'File'
    // })

    // const convertInputFileToOriginalFiles = inputFiles.value.map((file) => {
    //   return new File([file], `${file.name}`, {
    //     type: 'File'
    //   })
    // })

    // const extendedFiles: FileWithContent[] = [mainProgramFile, ...convertInputFileToOriginalFiles]
    // resultFiles.value = extendedFiles
    // console.log({ resultFiles: resultFiles.value })

    // const url = URL.createObjectURL(mainProgramFile)
    // const a = document.createElement('a')
    // a.href = url
    // a.download = inputFileName.value
    // a.click()
    // URL.revokeObjectURL(url)

    // const fileReader = new FileReader()
    // // read new file and console
    // fileReader.onload = () => {
    //   console.log(fileReader.result)
    // }
    // fileReader.readAsText(mainProgramFile)
    // console.log(inputFiles.value[0].lastModified)
  } catch (error) {
    console.log(error)
  } finally {
    loadingUpload.value = false
  }
}
</script>

<template>
  <div
    class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
  >
    <LoadingAnimation :state="loadingUpload" />

    <div class="border-b border-stroke px-7 dark:border-strokedark">
      <h3 class="font-bold text-xl my-2 text-black dark:text-white text-center">
        Transfer File Form
      </h3>
    </div>
    <div class="grid grid-cols-1 px-7 py-6 gap-5">
      <!-- <div class="col-span-5 xl:col-span-3"> -->
      <!-- Machine Section -->
      <AdditionalFields :is-disable-all="isCreatedMainProgram" />
      <template v-if="selectedAction === 'Upload File'">
        <template v-if="!isCreatedMainProgram">
          <!-- upload folder -->
          <div class="flex items-center">
            <div class="h-10">
              <span class="font-medium text-black dark:text-white"
                >Upload your {{ uploadType }}</span
              >
            </div>
          </div>

          <!-- File Upload Section -->
          <div
            id="FileUpload"
            :class="`relative mb-2  block w-full h-60 cursor-pointer appearance-none rounded border-2 border-dashed border-primary bg-gray py-4 px-4 dark:bg-meta-4 sm:py-7.5 ${
              disabled.disableUpload ? 'cursor-not-allowed opacity-50' : ''
            }`"
          >
            <FormField name="files">
              <input
                type="file"
                :disabled="disabled.disableUpload"
                @change="
                  async (event) => {
                    await handleNullDescriptionTimeline(selectedOneMachine, confirm, toast).then(
                      () => handleUploadFolder(event)
                    )
                  }
                "
                :webkitdirectory="uploadType === 'folder'"
                multiple
                :style="{
                  cursor: disabled.disableUpload ? 'not-allowed' : 'pointer'
                }"
                class="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
              />
            </FormField>
            <div class="flex flex-col items-center justify-center space-y-3">
              <span
                class="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M1.99967 9.33337C2.36786 9.33337 2.66634 9.63185 2.66634 10V12.6667C2.66634 12.8435 2.73658 13.0131 2.8616 13.1381C2.98663 13.2631 3.1562 13.3334 3.33301 13.3334H12.6663C12.8431 13.3334 13.0127 13.2631 13.1377 13.1381C13.2628 13.0131 13.333 12.8435 13.333 12.6667V10C13.333 9.63185 13.6315 9.33337 13.9997 9.33337C14.3679 9.33337 14.6663 9.63185 14.6663 10V12.6667C14.6663 13.1971 14.4556 13.7058 14.0806 14.0809C13.7055 14.456 13.1968 14.6667 12.6663 14.6667H3.33301C2.80257 14.6667 2.29387 14.456 1.91879 14.0809C1.54372 13.7058 1.33301 13.1971 1.33301 12.6667V10C1.33301 9.63185 1.63148 9.33337 1.99967 9.33337Z"
                    fill="#3C50E0"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M7.5286 1.52864C7.78894 1.26829 8.21106 1.26829 8.4714 1.52864L11.8047 4.86197C12.0651 5.12232 12.0651 5.54443 11.8047 5.80478C11.5444 6.06513 11.1223 6.06513 10.8619 5.80478L8 2.94285L5.13807 5.80478C4.87772 6.06513 4.45561 6.06513 4.19526 5.80478C3.93491 5.54443 3.93491 5.12232 4.19526 4.86197L7.5286 1.52864Z"
                    fill="#3C50E0"
                  />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M7.99967 1.33337C8.36786 1.33337 8.66634 1.63185 8.66634 2.00004V10C8.66634 10.3682 8.36786 10.6667 7.99967 10.6667C7.63148 10.6667 7.33301 10.3682 7.33301 10V2.00004C7.33301 1.63185 7.63148 1.33337 7.99967 1.33337Z"
                    fill="#3C50E0"
                  />
                </svg>
              </span>
              <p class="text-sm font-medium">
                <span class="text-primary">Click to upload</span> or drag and drop
              </p>
              <!-- <p class="mt-1.5 text-sm font-medium">SVG, PNG, JPG or GIF</p> -->
              <!-- <p class="text-sm font-medium">(max 3MB)</p> -->
            </div>
          </div>
        </template>
        <!-- Save  Buttons -->
        <div class="flex justify-end gap-4.5">
          <button
            class="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
            type="button"
            @click="handleClearFile"
          >
            Clear File
          </button>
          <button
            v-if="isCreatedMainProgram"
            :disabled="disabled.disableExecute"
            class="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
            type="submit"
            @click="handleSubmit"
          >
            Submit
          </button>
          <button
            v-if="!isCreatedMainProgram"
            :disabled="disabled.disableExecute"
            @click="handleExecute"
            :style="{
              cursor: disabled.disableExecute ? 'not-allowed' : 'pointer'
            }"
            class="flex justify-center rounded bg-primary py-2 px-6 font-medium text-gray hover:bg-opacity-90"
            type="submit"
          >
            Execute
          </button>
        </div>
      </template>
      <template v-else-if="selectedAction === 'Remove File'">
        <RemoveFile />
      </template>
    </div>
    <template v-if="!isCreatedMainProgram">
      <template v-for="(file, index) in inputFiles" :key="file.name">
        <PreviewFile :file :index />
      </template>
    </template>

    <PreviewFile v-else :file="inputFiles[0]" :index="0" isResultFile />
  </div>
</template>
