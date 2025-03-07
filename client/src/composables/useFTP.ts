import { getValueFromContent } from '@/components/modules/TransferFile/utils/contentMainProgram.util'
import MachineServices from '@/services/machine.service'
import type { ContentFile, ValueFromContent } from '@/types/ftp.type'
import { ref, shallowRef } from 'vue'

const inputFiles = ref<ContentFile[]>([])
const resultFiles = ref<File[]>([])

export const useFTP = () => {
  const loadingUpload = shallowRef(false)

  const handleUploadFolder = async (event: Event): Promise<void> => {
    try {
      loadingUpload.value = true
      const { files } = event.target as HTMLInputElement
      if (!files) return

      const editFileValue = await Promise.all(
        Array.from(files || []).map(async (file) => {
          const fileName = file.name.split('.')[0]
          const res = await readFile(file)

          const { gCodeName, kNum, outputWP, toolName, totalCuttingTime } = res as ValueFromContent

          const { data } = await MachineServices.postEncryptContentValue({
            gCodeName,
            kNum,
            outputWP,
            toolName,
            totalCuttingTime
          })

          return {
            ...res,
            name: fileName,
            gCodeName: data.data.gCodeName,
            kNum: data.data.kNum,
            outputWP: data.data.outputWP,
            toolName: data.data.toolName,
            totalCuttingTime: data.data.totalCuttingTime
          }
        })
      )

      inputFiles.value = editFileValue

      console.log(inputFiles.value, 'inputFiles')
    } catch (error: unknown) {
      console.log({ error, message: (error as Error)?.message })
    } finally {
      loadingUpload.value = false
    }
  }

  // // Fungsi untuk menambahkan userId setelah "%" dan komentar pertama
  // const addUserIdToNTFile = (fileContent: string): string => {
  //   const lines = fileContent.split('\n')

  //   for (let i = 0; i < lines.length; i++) {
  //     if (lines[i].trim() === '%') {
  //       lines.splice(i + 2, 0, `( user_id: ${user.value?.id} )`) // Tambahkan userId setelah "%"
  //       lines.splice(i + 3, 0, `( machine_id: ${selectedOneMachine.value?.id} )`)
  //       break
  //     }
  //   }

  //   return lines.join('\n')
  // }

  const readFile = async (file: File): Promise<ContentFile> => {
    const reader = new FileReader()
    const content = (await new Promise((resolve, reject) => {
      reader.onload = (e) => {
        if (!e.target?.result) return
        resolve(e.target?.result as string)
      }
      reader.onerror = reject
      reader.readAsText(file)
    })) as string

    const { gCodeName, kNum, outputWP, toolName, totalCuttingTime } = getValueFromContent(content)
    return Object.assign(file, {
      content,
      toolNumber: 0,
      kNum,
      gCodeName,
      outputWP,
      toolName,
      totalCuttingTime
    })
  }

  return { inputFiles, handleUploadFolder, loadingUpload, resultFiles }
}
