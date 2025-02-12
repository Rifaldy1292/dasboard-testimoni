// result = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ... 31]
export const getAllDayInMonth = () => {
  const result = []
  const date = new Date()
  const month = date.getMonth()
  const year = date.getFullYear()
  const days = new Date(year, month + 1, 0).getDate()
  for (let i = 1; i <= days; i++) {
    result.push(i)
  }
  return result
}
