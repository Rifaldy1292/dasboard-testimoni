/**
 * 
 * @description Cara Penggunaan
Contoh Konversi ke UTC

const timestamp = 1736471885;
console.log(convertTimestamp(timestamp)); 
// Output: "2025-01-09 10:58:05"

Contoh Konversi ke WIB (UTC+7)

const timestamp = 1736471885;
console.log(convertTimestamp(timestamp, 7)); 
// Output: "2025-01-09 17:58:05"

Penjelasan

    Parameter timestamp: Nilai Unix timestamp dalam detik.
    Parameter timezoneOffset: Offset zona waktu dalam jam. Misalnya:
        UTC+7 untuk WIB.
        UTC-5 untuk EST.
    Output: String tanggal dalam format YYYY-MM-DD HH:mm:ss.
 */
export function convertTimestamp(timestamp: number, timezoneOffset: number = 0): string {
  // Convert timestamp to milliseconds
  const date = new Date(timestamp * 1000)

  // Apply timezone offset (in hours)
  date.setHours(date.getHours() + timezoneOffset)

  // Format the date
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0') // Month is 0-based
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  // Return formatted date string
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function formatTimeDifference(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000) // Waktu saat ini dalam detik
  const difference = Math.abs(timestamp - now) // Selisih waktu dalam detik

  const minutes = Math.floor(difference / 60)
  const seconds = difference % 60
  return `this link expires in ${convertTimestamp(
    timestamp
  )}, ${minutes} minutes - ${seconds} seconds ${timestamp > now ? 'ahead' : 'ago'} `
}
