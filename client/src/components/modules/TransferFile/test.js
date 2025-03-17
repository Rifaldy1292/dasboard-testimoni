// const test = `sddadadsdasda{key: 1}`;
// const nilai = test.match(/key: (\d+)/);
// if (nilai) {
//     console.log(nilai); // output: 1
// }

// test.

// const test = 'O0123'
// // get 4 digit latest
// const latest = test.slice(1)
// console.log(latest)

const test = '%\r\n( K-NUM : 24-K0021_05. FIX CAVITY)\r\n( NAMA G CODE : 2421051J0231)\r\n( OUTPUT WP : BAWAH05)\r\n( TOOL NAME : WDNW120420Z_JDMW120420ZDSR)\r\n( TOOL NUMBER : )\r\n( TOOL DIAMETER : 62.945)\r\n( TOOL RADIUS : TIP RAD.: 0.0)\r\n( TOOL OH : 205.0)\r\n( TOTAL CUTTING TIME = 2 : 37 : 13 )\r\n( TOOLPATH : 01.00. ROUG 63R3 L205 T1.00_ORG_2)\r\nS650M03\r\nG1G54G90X-181.609Y-336.381\r\nZ0\r\nZ-49.5F2125\r\nG3G17X-184.597Y-329.972I-4.698J1.71F2500\r\nG1X-221.669Y-316.479\r\nG2X-267.552Y-284.352I37.01J101.683\r\nG1X-298.972Y-246.907\r\nG3X-306.017Y-246.29I-3.831J-3.214\r\nG0Z-39.0\r\nX-%'

// get knum value in test

const knum = test.match(/K-NUM : ([^)]+)/g)
const gCodeName = test.match(/NAMA G CODE : ([^)]+)/g)
const outputWP = test.match(/OUTPUT WP : ([^)]+)/g)
const toolName = test.match(/TOOL NAME : ([^)]+)/g)
const totalCuttingTime = test.match(/TOTAL CUTTING TIME = ([^)]+)/g)
// get value

// console.log(knum[0].replace('K-NUM : ', ''))
// console.log(gCodeName[0].replace('NAMA G CODE : ', ''))
// console.log(outputWP[0].replace('OUTPUT WP : ', ''))
// console.log(toolName[0].replace('TOOL NAME : ', ''))
// console.log(totalCuttingTime[0].replace('TOTAL CUTTING TIME = ', ''))




const ex = [10, 20, 30, 40, 10, 80]

// [0] = 10 + 20 + 30 + 40 + 10 + 80
// [1] = 20 + 30 + 40 + 10 + 80
// [2] = 30 + 40 + 10 + 80
// [3] = 40 + 10 + 80
// [4] = 10 + 80
// [5] = 80
// expexted result = [190, 180, 160, 130, 90, 80]

const result = ex.map((item, index) => {
    return ex.slice(index).reduce((acc, curr) => acc + curr, 0)
})

console.log(result)

const arrObj = [
    {
        totalCuttingTime: '1 : 37 : 13',
        test: 'hiihi'
    },
    {
        totalCuttingTime: '2 : 37 : 13',
        test: 'hiihi'
    },
    {
        totalCuttingTime: '3 : 37 : 13',
        test: 'hiihi'
    },
    {
        totalCuttingTime: '4 : 37 : 13',
        test: 'hiihi'
    },
]


const getCuttingTimeMilisecond = (totalCuttingTime) => {
    const hour = totalCuttingTime.split(':')[0]
    const minute = totalCuttingTime.split(':')[1]
    const second = totalCuttingTime.split(':')[2]

    return parseInt(hour) * 3600000 + parseInt(minute) * 60000 + parseInt(second) * 1000
}

const calculate = arrObj.map((item, index) => {
    const result = arrObj.slice(index).reduce((acc, curr) => acc + getCuttingTimeMilisecond(curr.totalCuttingTime), 0)
    return result
})

console.log(calculate, { last: getCuttingTimeMilisecond(arrObj[arrObj.length - 1].totalCuttingTime) })    