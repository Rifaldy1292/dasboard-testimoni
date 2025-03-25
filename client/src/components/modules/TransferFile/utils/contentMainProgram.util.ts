import type { ContentFile, ValueFromContent } from '@/types/ftp.type'
import type { MachineOption } from '@/types/machine.type'
import type { User } from '@/types/user.type'

type params = {
  inputFiles: ContentFile[]
  selectedOneMachine: MachineOption
  user: User
  selectedCoolant: number
  selectedCoordinate: number
  selectedWorkPosition: number
  inputStartPoint: number
  selectedProgramNumber: number
}
type DocsMacro =
  | 'USER_ID'
  | 'G_CODE_NAME'
  | 'K_NUM'
  | 'OUTPUT_WP'
  | 'TOOL_NAME'
  | 'TOTAL_CUTTING_TIME'
  | 'CALCULATE_TOTAL_CUTTING_TIME'
type Docs = Record<DocsMacro, string>

export const contentMainProgram = ({
  inputFiles,
  selectedOneMachine,
  user,
  selectedCoolant,
  selectedCoordinate,
  selectedWorkPosition,
  inputStartPoint,
  selectedProgramNumber
}: params): string => {
  const bodyContent = inputFiles.map((file) => {
    const {
      toolNumber,
      gCodeName,
      kNum,
      outputWP,
      toolName,
      totalCuttingTime,
      calculateTotalCuttingTime,
      totalProgram
    } = file

    let docs: Docs = {
      G_CODE_NAME: '',
      K_NUM: '',
      OUTPUT_WP: '',
      TOOL_NAME: '',
      TOTAL_CUTTING_TIME: '',
      USER_ID: '',
      CALCULATE_TOTAL_CUTTING_TIME: ''
    }

    switch (selectedOneMachine.startMacro) {
      case 500: {
        docs = {
          USER_ID: '#501',
          G_CODE_NAME: '#502',
          K_NUM: '#503',
          OUTPUT_WP: '#504',
          TOOL_NAME: '#505',
          TOTAL_CUTTING_TIME: '#506',
          CALCULATE_TOTAL_CUTTING_TIME: '#507'
        }
        break
      }
      case 540: {
        docs = {
          USER_ID: '#541',
          G_CODE_NAME: '#542',
          K_NUM: '#543',
          OUTPUT_WP: '#544',
          TOOL_NAME: '#545',
          TOTAL_CUTTING_TIME: '#546',
          CALCULATE_TOTAL_CUTTING_TIME: '#547'
        }
        break
      }
      case 560: {
        docs = {
          USER_ID: '#561',
          G_CODE_NAME: '#562',
          K_NUM: '#563',
          OUTPUT_WP: '#564',
          TOOL_NAME: '#565',
          TOTAL_CUTTING_TIME: '#566',
          CALCULATE_TOTAL_CUTTING_TIME: '#567'
        }
        break
      }
    }

    const M198P = 'M198P'

    const macroData = `${docs.USER_ID}=${user.id}
${docs.G_CODE_NAME}=${gCodeName}
${docs.K_NUM}=${kNum}
${docs.OUTPUT_WP}=${outputWP}
${docs.TOOL_NAME}=${toolName}
${docs.TOTAL_CUTTING_TIME}=${totalCuttingTime}
${docs.CALCULATE_TOTAL_CUTTING_TIME}=${totalProgram}.${calculateTotalCuttingTime}`

    const body500 = `${macroData}
G54 G90 G00 G01 Z0. F3000
G17
${M198P}${file.name.slice(1)}
G0Z0.
M05
`

    const body540 = `T${toolNumber}
M6
H${toolNumber}
${macroData}
G${selectedWorkPosition}
G90G00X0Y0
G${selectedCoordinate}Z${inputStartPoint}.00
M${selectedCoolant}
G05P10000
${M198P}${file.name.slice(1)}
G05P0
`

    const body560 = `T${toolNumber}
M6
${macroData}
G91G28Z0
G${selectedWorkPosition}G90G01X0.Y0.F5000
G90G43Z${selectedCoordinate}.H#4120
M07
M251
${M198P}${file.name.slice(1)}
M09
G91G28Z0.
G91G28Y0.
`

    const bodyMC16 = `T${toolNumber} M6
${macroData}
G${selectedWorkPosition} G90 G0 X0 Y0.
G43 Z${selectedCoordinate}. H${toolNumber}
Z0.
G5. 1 Q1
${'M98P'}${file.name.slice(1)}
G5. 1 Q0
G0 Z50.
`

    return { body500, body540, body560, bodyMC16 }
  })

  const content500 = `%
O00${selectedProgramNumber}
${bodyContent.map((item) => item.body500).join('\n')}
M30
%`

  const content540 = `%
O00${selectedProgramNumber}
${bodyContent.map((item) => item.body540).join('\n')}
M30
%`

  const content560 = `%
O00${selectedProgramNumber}
${bodyContent.map((item) => item.body560).join('\n')}
M30
%`

  const contentMC16 = `%
O00${selectedProgramNumber}
${bodyContent.map((item) => item.bodyMC16).join('\n')}
M30
%`

  if (selectedOneMachine.name === 'MC-16') return contentMC16

  const content = (startMacro: 500 | 540 | 560) => {
    const result = `%
O00${selectedProgramNumber}
${bodyContent.map((item) => item[`body${startMacro}`]).join('\n')}
M30
%`

    return result
  }

  // switch (selectedOneMachine.startMacro) {
  //   case 500:
  //     return content500
  //   case 540:
  //     return content540
  //   case 560:
  //     return content560
  // }

  return content(selectedOneMachine.startMacro)
}

export const getValueFromContent = (content: string): ValueFromContent => {
  const kNum = content.match(/K-NUM : ([^)]+)/g)
  const gCodeName = content.match(/NAMA G CODE : ([^)]+)/g)
  const outputWP = content.match(/OUTPUT WP : ([^)]+)/g)
  const toolName = content.match(/TOOL NAME : ([^)]+)/g)
  const totalCuttingTime = content.match(/TOTAL CUTTING TIME = ([^)]+)/g)

  const kNumValue = kNum ? kNum[0].replace('K-NUM : ', '') : ''
  const gCodeNameValue = gCodeName ? gCodeName[0].replace('NAMA G CODE : ', '') : ''
  const outputWPValue = outputWP ? outputWP[0].replace('OUTPUT WP : ', '') : ''
  const toolNameValue = toolName ? toolName[0].replace('TOOL NAME : ', '') : ''
  const totalCuttingTimeValue = totalCuttingTime
    ? totalCuttingTime[0].replace('TOTAL CUTTING TIME = ', '')
    : ''

  return {
    kNum: kNumValue,
    gCodeName: gCodeNameValue,
    outputWP: outputWPValue,
    toolName: toolNameValue,
    totalCuttingTime: totalCuttingTimeValue
  }
}
