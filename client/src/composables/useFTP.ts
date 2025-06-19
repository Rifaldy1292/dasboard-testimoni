import { getValueFromContent } from '@/components/modules/TransferFile/utils/contentMainProgram.util'
import MachineServices from '@/services/machine.service'
import type { ContentFile, ValueFromContent } from '@/types/ftp.type'
import { handleErrorAPI } from '@/utils/handleErrorAPI'
import { ref, shallowRef } from 'vue'

const inputFiles = ref<ContentFile[]>([])
const uploadType = shallowRef<'folder' | 'file'>('file')
type Action = 'Upload File' | 'Remove File'
const actionOPtions: Array<Action> = ['Upload File', 'Remove File']
const selectedAction = shallowRef<Action>(actionOPtions[0])
const selectedWorkPosition = shallowRef<number>(54)

export const useFTP = () => {
  const loadingUpload = shallowRef(false)
  const isCreatedMainProgram = shallowRef<boolean>(false)

  /**
   *
   * @param totalCuttingTime example 0 : 30 : 34
   */
  const getCuttingTimeInSecond = (totalCuttingTime: string): number => {
    if (!totalCuttingTime) return 0
    const hour = totalCuttingTime.split(':')[0]
    const minute = totalCuttingTime.split(':')[1]
    const second = totalCuttingTime.split(':')[2]
    const calculate = parseInt(hour) * 3600 + parseInt(minute) * 60 + parseInt(second)
    const result = Math.round(calculate)
    return result
  }

  const handleUploadFolder = async (event: Event): Promise<void> => {
    try {
      loadingUpload.value = true
      const { files } = event.target as HTMLInputElement
      if (!files) return

      const editFileValue = await Promise.all(
        Array.from(files || []).map(async (file) => {
          // 'O' + last 4 digit
          const fileName = file.name.split('.')[0]
          const res = await readFile(file)

          const { gCodeName, kNum, outputWP, toolName, totalCuttingTime } = res as ValueFromContent

          // const calculateTotalCuttingTime = Array.from(files)
          //   .slice(index)
          //   .reduce((acc, curr) => acc + getCuttingTimeInSecond(totalCuttingTime as string), 0)

          const { data } = await MachineServices.postEncryptContentValue({
            gCodeName,
            kNum,
            outputWP,
            toolName
          })

          return {
            ...res,
            name: 'O' + fileName.slice(-4),
            gCodeName: data.data.gCodeName,
            kNum: data.data.kNum,
            outputWP: data.data.outputWP,
            toolName: data.data.toolName,
            totalCuttingTime: getCuttingTimeInSecond(totalCuttingTime)
            // calculateTotalCuttingTime,
            // test: getCuttingTimeInSecond(totalCuttingTime)
          }
        })
      )

      const extendedFiles = [...inputFiles.value, ...editFileValue].sort((a, b) =>
        a.name.localeCompare(b.name)
      )

      const calculateTotalCuttingTimes = extendedFiles.map((item, index) => {
        const sliceFiles = extendedFiles.slice(index)
        const totalProgram = extendedFiles.length - index
        const calculateTotalCuttingTime = sliceFiles.reduce(
          (acc, curr) => acc + (curr.totalCuttingTime as number),
          0
        )
        return {
          ...item,
          calculateTotalCuttingTime,
          totalProgram
        }
      })

      inputFiles.value = calculateTotalCuttingTimes

      // console.log({ calculateTotalCuttingTime })

      console.log(inputFiles.value, 'inputFiles')
    } catch (error: unknown) {
      console.log({ error, message: (error as Error)?.message })
    } finally {
      loadingUpload.value = false
    }
  }

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
      totalCuttingTime,
      workPosition: selectedWorkPosition.value
    })
  }
  const handleClearFile = async () => {
    try {
      loadingUpload.value = true
      inputFiles.value = []
      isCreatedMainProgram.value = false
      await MachineServices.deleteClearCache()
    } catch (error) {
      handleErrorAPI(error)
    } finally {
      loadingUpload.value = false
    }
  }

  return {
    inputFiles,
    uploadType,
    handleUploadFolder,
    loadingUpload,
    selectedAction,
    actionOPtions,
    isCreatedMainProgram,
    handleClearFile,
    selectedWorkPosition
  }
}
