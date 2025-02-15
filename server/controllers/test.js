const now = new Date()
const month = now.getMonth() + 1
const year = now.getFullYear()
const date = new Date(year, month, 0)


console.log({ month, year, date })