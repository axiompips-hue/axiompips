// File: src/lib/premium/export.ts
// Export utilities for premium users

import { JournalEntry } from '@/lib/journal/types';

/**
 * Export journal entries to CSV format
 */
export function exportToCSV(entries: JournalEntry[]): string {
  const headers = [
    'Date',
    'Pair',
    'Type',
    'Entry Price',
    'Exit Price',
    'Lot Size',
    'Stop Loss',
    'Take Profit',
    'Result',
    'Profit/Loss',
    'Notes',
    'Emotions',
    'Setup Quality',
    'Created At',
  ];

  const rows = entries.map((entry) => [
    entry.date,
    entry.pair || '',
    entry.type || '',
    entry.entryPrice || '',
    entry.exitPrice || '',
    entry.lotSize || '',
    entry.stopLoss || '',
    entry.takeProfit || '',
    entry.result || '',
    entry.profitLoss || '',
    entry.notes?.replace(/"/g, '""') || '',
    entry.emotions || '',
    entry.setupQuality || '',
    entry.createdAt,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => (typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell)).join(',')
    ),
  ].join('\n');

  return csvContent;
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string = 'journal-export.csv'): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export journal entries to Excel format (using CSV with proper formatting)
 */
export function exportToExcel(entries: JournalEntry[]): void {
  const csv = exportToCSV(entries);
  downloadCSV(csv, `journal-export-${new Date().toISOString().split('T')[0]}.csv`);
}

/**
 * Export calculator results to CSV
 */
export function exportCalculatorResultsToCSV(results: any[], calculatorName: string): string {
  if (!results || results.length === 0) return '';

  // Get all unique keys from results
  const allKeys = new Set<string>();
  results.forEach((result) => {
    Object.keys(result).forEach((key) => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  const rows = results.map((result) => headers.map((header) => result[header] || ''));

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => (typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell)).join(',')
    ),
  ].join('\n');

  return csvContent;
}

/**
 * Export journal entries to PDF format (simple text-based PDF)
 */
export async function exportToPDF(entries: JournalEntry[]): Promise<void> {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Trading Journal Export</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 {
          color: #1a1a1a;
          border-bottom: 2px solid #4F46E5;
          padding-bottom: 10px;
        }
        .entry {
          margin-bottom: 30px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        .entry-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .entry-detail {
          margin: 5px 0;
        }
        .entry-label {
          font-weight: bold;
          color: #555;
        }
        .profit {
          color: #10b981;
        }
        .loss {
          color: #ef4444;
        }
        .page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
      <h1>Trading Journal Export</h1>
      <p>Generated on: ${new Date().toLocaleDateString()}</p>
      <p>Total Entries: ${entries.length}</p>
      <hr>
      ${entries
        .map(
          (entry, index) => `
        <div class="entry">
          <div class="entry-header">
            <span>Entry #${index + 1}</span>
            <span>${new Date(entry.date).toLocaleDateString()}</span>
          </div>
          <div class="entry-detail">
            <span class="entry-label">Pair:</span> ${entry.pair || 'N/A'}
          </div>
          <div class="entry-detail">
            <span class="entry-label">Type:</span> ${entry.type || 'N/A'}
          </div>
          <div class="entry-detail">
            <span class="entry-label">Entry Price:</span> ${entry.entryPrice || 'N/A'}
          </div>
          <div class="entry-detail">
            <span class="entry-label">Exit Price:</span> ${entry.exitPrice || 'N/A'}
          </div>
          <div class="entry-detail">
            <span class="entry-label">Lot Size:</span> ${entry.lotSize || 'N/A'}
          </div>
          <div class="entry-detail">
            <span class="entry-label">Stop Loss:</span> ${entry.stopLoss || 'N/A'}
          </div>
          <div class="entry-detail">
            <span class="entry-label">Take Profit:</span> ${entry.takeProfit || 'N/A'}
          </div>
          <div class="entry-detail">
            <span class="entry-label">Result:</span> 
            <span class="${(entry.profitLoss || 0) > 0 ? 'profit' : 'loss'}">
              ${entry.result || 'N/A'}
            </span>
          </div>
          <div class="entry-detail">
            <span class="entry-label">Profit/Loss:</span> 
            <span class="${(entry.profitLoss || 0) > 0 ? 'profit' : 'loss'}">
              ${entry.profitLoss || 'N/A'}
            </span>
          </div>
          ${
            entry.notes
              ? `
          <div class="entry-detail">
            <span class="entry-label">Notes:</span> ${entry.notes}
          </div>
          `
              : ''
          }
          ${
            entry.emotions
              ? `
          <div class="entry-detail">
            <span class="entry-label">Emotions:</span> ${entry.emotions}
          </div>
          `
              : ''
          }
        </div>
        ${(index + 1) % 3 === 0 ? '<div class="page-break"></div>' : ''}
      `
        )
        .join('')}
    </body>
    </html>
  `;

  // Open print dialog for PDF generation
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

/**
 * Export statistics to CSV
 */
export function exportStatsToCSV(stats: any): string {
  const headers = ['Metric', 'Value'];
  const rows = Object.entries(stats).map(([key, value]) => [
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
    value,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return csvContent;
}

/**
 * Prepare data for export with proper formatting
 */
export function prepareDataForExport(data: any[]): any[] {
  return data.map((item) => {
    const formatted: any = {};
    
    Object.entries(item).forEach(([key, value]) => {
      // Format dates
      if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
        formatted[key] = value ? new Date(value as string).toLocaleString() : '';
      }
      // Format numbers
      else if (typeof value === 'number') {
        formatted[key] = value.toFixed(2);
      }
      // Keep strings as is
      else {
        formatted[key] = value || '';
      }
    });
    
    return formatted;
  });
}
