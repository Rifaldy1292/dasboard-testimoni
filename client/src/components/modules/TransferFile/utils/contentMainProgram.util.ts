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

const M98P7000 = 'M98P7000'

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
      calculateTotalCuttingTime
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

    const macroData = `${docs.USER_ID}=${user.id}
${docs.G_CODE_NAME}=${gCodeName}
${docs.K_NUM}=${kNum}
${docs.OUTPUT_WP}=${outputWP}
${docs.TOOL_NAME}=${toolName}
${docs.TOTAL_CUTTING_TIME}=${totalCuttingTime}
${docs.CALCULATE_TOTAL_CUTTING_TIME}=${calculateTotalCuttingTime}`

    const body = `${M98P7000}
T${toolNumber}
M06
H${toolNumber}
${macroData}
G${selectedWorkPosition}
G90G00X0Y0
G${selectedCoordinate}Z${inputStartPoint}.00
M${selectedCoolant}
G05P10000
M198P${file.name.slice(1)}
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
M198P${file.name.slice(1)}
M09
G91G28Z0.
G91G28Y0.
`

    return { body, body560 }
  })
  const content = `%
O00${selectedProgramNumber}
${bodyContent.map((item) => item.body).join('\n')}
${M98P7000}
M30
%`
  if (selectedOneMachine.startMacro !== 560) return content

  const content560 = `%
O00${selectedProgramNumber}
${bodyContent.map((item) => item.body560).join('\n')}
M30
%`
  return content560
}

// const expectedFormat = `%
// O3054
// M98P7000
// T3
// M06
// G05.1Q1NUM(AICC ON)
// G65P9684H3Z0CK-NUMR-NUM :
// G65P0092Q0.1E3D-NUM :
// H3
// G54
// G90G00X0Y0
// G45Z200.00
// M50
// M07
// G05P10000
// M198P0300
// G05P0
// G05.1Q0(AICC OFF)
// G65P9685H3Q0.1Z0

// M98P7000
// T5
// M06
// G05.1Q1NUM(AICC ON)
// G65P9684H5Z0CK-NUMR-NUM :
// G65P0092Q0.1E5D-NUM :
// H5
// G54
// G90G00X0Y0
// G45Z200.00
// M50
// M07
// G05P10000
// M198P0301
// G05P0
// G05.1Q0(AICC OFF)
// G65P9685H5Q0.1Z0

// M98P7000
// M30
// %`

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
