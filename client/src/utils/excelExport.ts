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
      Start: log.start || '-',
      End: log.end || '-'
    }))

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const columnWidths = [
      { wch: 5 }, // No.
      { wch: 15 }, // Machine Name
      { wch: 12 }, // Date
      { wch: 10 }, // Time
      { wch: 15 }, // Current Status
      { wch: 20 }, // G Code Name
      { wch: 15 }, // K Number
      { wch: 12 }, // Output WP
      { wch: 20 }, // Operator
      { wch: 30 }, // Description
      { wch: 20 }, // Time Difference (seconds)
      { wch: 20 }, // Time Difference (minutes)
      { wch: 20 } // Time Difference (hours)
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
