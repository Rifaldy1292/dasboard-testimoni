import type { MachineOption } from '@/types/machine.type'
import type { User } from '@/types/user.type'
import { ref, shallowRef, type Ref } from 'vue'

type contentFile = File & {
  content: string | null
}

export const useFTP = (
  user: Ref<User | undefined>,
  selectedOneMachine: Ref<MachineOption | undefined>
) => {
  const inputFiles = ref<contentFile[]>([])
  const loadingUpload = shallowRef(false)

  const handleUploadFolder = async (event: Event): Promise<void> => {
    try {
      loadingUpload.value = true
      const { files } = event.target as HTMLInputElement
      if (!files) return

      const extendedFiles = await Promise.all(
        Array.from(files || []).map(async (file) => {
          const res = await readFile(file)
          res.content = addUserIdToNTFile(res.content || '')
          return res
        })
      )
      // console.log(extendedFiles)

      const fileWithoutExtension = extendedFiles.map((file) => {
        const fileName = file.name.split('.')[0]
        // 4 digit terakhir
        const res = 'O' + fileName.slice(fileName.length - 4)
        return {
          ...file,
          name: res
        }
      })
      inputFiles.value = fileWithoutExtension

      console.log(inputFiles.value, 'inputFiles')
    } catch (error: unknown) {
      console.log({ error, message: (error as Error)?.message })
    } finally {
      loadingUpload.value = false
    }
  }

  const handlePreviewContent = (file: contentFile): string => {
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

  const readFile = async (file: File): Promise<contentFile> => {
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

  // Fungsi untuk menambahkan userId setelah "%" dan komentar pertama
  const addUserIdToNTFile = (fileContent: string): string => {
    const lines = fileContent.split('\n')

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '%') {
        lines.splice(i + 2, 0, `( user_id: ${user.value} )`) // Tambahkan userId setelah "%"
        lines.splice(i + 3, 0, `( ip_address: ${selectedOneMachine.value} )`)
        break
      }
    }

    return lines.join('\n')
  }

  return { inputFiles, handleUploadFolder, handlePreviewContent, loadingUpload }
}
