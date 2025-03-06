import type { FileWithContent } from '@/types/ftp.type'
import { ref, shallowRef } from 'vue'

const inputFiles = ref<FileWithContent[]>([])
export const useFTP = () => {
  const loadingUpload = shallowRef(false)

  const handleUploadFolder = async (event: Event): Promise<void> => {
    try {
      loadingUpload.value = true
      const { files } = event.target as HTMLInputElement
      if (!files) return

      const editFileValue = await Promise.all(
        Array.from(files || []).map(async (file) => {
          const res = await readFile(file)
          // res.content = addUserIdToNTFile(res.content || '')
          return res
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

  const handlePreviewContent = (file: FileWithContent): string => {
    const { content } = file
    if (!content) return '-'

    const lines = content.split('\n')
    const result: string[] = []

    for (const line of lines) {
      if (line.trim().startsWith('(') || line.trim() === '%') {
        result.push(line)
      }
    }

    return result.join('\n') || '-'
  }

  const readFile = async (file: File): Promise<FileWithContent> => {
    const reader = new FileReader()
    const content = (await new Promise((resolve, reject) => {
      reader.onload = (e) => {
        if (!e.target?.result) return
        resolve(e.target?.result as string)
      }
      reader.onerror = reject
      reader.readAsText(file)
    })) as string

    return Object.assign(file, { content })
  }

  return { inputFiles, handleUploadFolder, handlePreviewContent, loadingUpload }
}
