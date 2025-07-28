import * as XLSX from 'xlsx'
import type { MonthlyLogs } from '@/types/timeline.type'

/**
 * Export MonthlyLogs data to Excel
 * @param data - Array of MonthlyLogs data
 * @param filename - Output filename without extension
 */
export function exportTimelineToExcel(data: MonthlyLogs[], filename: string): void {
  try {
    // Transform data for Excel export
    const excelData = data.map((log, index) => ({
      'No.': index + 1,
      'Machine Name': log.name,
      Date: log.date,
      Status: log.current_status,
      'G Code Name': log.g_code_name || '-',
      'K Number': log.k_num || '-',
      'Output WP': log.output_wp || '-',
      Operator: log.operator || '-',
      Description: log.description || '-',
      'Total (in seconds)': log.total || 0,
      // Gunakan objek sel untuk format angka kustom
      'Total (in hh:mm:ss)':
        log.total > 0 ? { v: log.total / 86400, t: 'n', z: '[hh]:mm:ss' } : '-', // Tetap tampilkan '-' jika tidak ada durasi

      Start: log.start || '-',
      End: log.end || '-'
    }))

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const columnWidths: XLSX.ColInfo[] = [
      { wch: 5 }, // No.
      { wch: 15 }, // Machine Name
      { wch: 12 }, // Date
      { wch: 10 }, // Status
      { wch: 15 }, // G Code Name
      { wch: 20 }, // K Number
      { wch: 15 }, // Output WP
      { wch: 12 }, // Operator
      { wch: 30 }, // Description
      { wch: 20 }, // Total (in seconds)
      { wch: 20 }, // Total (in hh:mm:ss)
      { wch: 12 }, // Start
      { wch: 12 } // End
    ]
    worksheet['!cols'] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timeline Data')

    // Write file
    XLSX.writeFile(workbook, `${filename}.xlsx`)
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error('Failed to export timeline data to Excel')
  }
}

/**
 * Format time difference for display
 * @param milliseconds - Time difference in milliseconds
 * @returns Formatted time string
 */
export function formatTimeDifference(milliseconds: number | null): string {
  if (!milliseconds || milliseconds <= 0) return '-'

  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}
