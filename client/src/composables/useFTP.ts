import { getValueFromContent } from '@/components/modules/TransferFile/utils/contentMainProgram.util'
import MachineServices from '@/services/machine.service'
import type { ContentFile, ValueFromContent } from '@/types/ftp.type'
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
    console.log(totalCuttingTime, 'totalCuttingTime')
    if (!totalCuttingTime || !totalCuttingTime) return 0
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

      const readFileValue = (await Promise.all(
        Array.from(files || []).map(async (file) => {
          const res = await readFile(file)
          return {
            ...res,
            totalCuttingTime: getCuttingTimeInSecond(res.totalCuttingTime as string),
            name: 'O' + file.name.split('.')[0].slice(-4)
          }
        })
      )) as ContentFile[]

      const extendedFiles = [...inputFiles.value, ...readFileValue].sort((a, b) =>
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
          calculateTotalCuttingTime: `${totalProgram || 0}.${calculateTotalCuttingTime || 0}`
        }
      })

      const nextProjects = calculateTotalCuttingTimes.map((item, index) => {
        const nextProjects = calculateTotalCuttingTimes.slice(index).map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { content, ...rest } = item
          return {
            ...rest
          }
        })
        return {
          ...item,
          nextProjects: nextProjects.length ? nextProjects : []
        }
      })

      const editFileValue = await Promise.all(
        Array.from(nextProjects || []).map(async (file) => {
          const {
            gCodeName,
            kNum,
            outputWP,
            toolName,
            totalCuttingTime,
            calculateTotalCuttingTime,
            nextProjects
          } = file as unknown as Omit<ValueFromContent, 'transfer_file_id'>

          // const calculateTotalCuttingTime = Array.from(files)
          //   .slice(index)
          //   .reduce((acc, curr) => acc + getCuttingTimeInSecond(totalCuttingTime as string), 0)

          const { data } = await MachineServices.postEncryptContentValue({
            gCodeName,
            kNum,
            outputWP,
            toolName,
            totalCuttingTime,
            calculateTotalCuttingTime,
            nextProjects
          })

          return {
            ...file,
            gCodeName: data.data.gCodeName,
            kNum: data.data.kNum,
            outputWP: data.data.outputWP,
            toolName: data.data.toolName,
            transfer_file_id: data.data.transfer_file_id
            // calculateTotalCuttingTime,
            // test: getCuttingTimeInSecond(totalCuttingTime)
          }
        })
      )

      // const extendedFiles = [...inputFiles.value, ...editFileValue].sort((a, b) =>
      //   a.name.localeCompare(b.name)
      // )

      // const calculateTotalCuttingTimes = extendedFiles.map((item, index) => {
      //   const sliceFiles = extendedFiles.slice(index)
      //   const totalProgram = extendedFiles.length - index
      //   const calculateTotalCuttingTime = sliceFiles.reduce(
      //     (acc, curr) => acc + (curr.totalCuttingTime as number),
      //     0
      //   )
      //   return {
      //     ...item,
      //     calculateTotalCuttingTime,
      //     totalProgram
      //   }
      // })

      // inputFiles.value = calculateTotalCuttingTimes
      inputFiles.value = editFileValue as unknown as ContentFile[]

      console.log({ editFileValue })

      console.log(inputFiles.value, 'inputFiles')
    } catch (error: unknown) {
      console.log({ error, message: (error as Error)?.message })
    } finally {
      loadingUpload.value = false
    }
  }

  const handleUploadZooler = async (event: Event) => {
    try {
      loadingUpload.value = true
      const { files } = event.target as HTMLInputElement
      if (!files) return
      const fileWithNames: ContentFile[] = await Promise.all(
        Array.from(files).map(async (file) => {
          // example content
          /**
           * %
( K-NUM :  25-K0003_57AF)
( NAMA G CODE : 24232495J3101)
 ...
 %
           */

          //   add O0031 to the content
          /**
 * res
 * %
 * O0031
( K-NUM :  25-K0003_57AF)
( NAMA G CODE : 24232495J3101)
 ...
 %
 */

          const { content, ...res } = await readFile(file)
          // Find the first % and insert O0031 after it
          const percentIndex = content.indexOf('%')
          let newContent = content
          const name = 'O0031'

          if (percentIndex !== -1) {
            // Insert O0031 after the % and newline
            const afterPercent = content.substring(percentIndex + 1)
            newContent = content.substring(0, percentIndex + 1) + '\n' + name + afterPercent
          }

          return {
            ...res,
            name,
            transfer_file_id: 0,
            content: newContent
          }
        })
      )

      const combinedFiles = [...inputFiles.value, ...fileWithNames].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      inputFiles.value = combinedFiles

      // Check if machine has null description timeline before proceeding
    } catch (error) {
      console.error('Error in handleChange:', error)
    } finally {
      loadingUpload.value = false
    }
  }

  const readFile = async (file: File): Promise<Omit<ContentFile, 'transfer_file_id'>> => {
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
      toolNumber: 0,
      kNum,
      gCodeName,
      outputWP,
      toolName,
      totalCuttingTime,
      workPosition: selectedWorkPosition.value,
      content
    })
  }
  const handleClearFile = () => {
    inputFiles.value = []
    isCreatedMainProgram.value = false
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
    selectedWorkPosition,
    handleUploadZooler
  }
}
