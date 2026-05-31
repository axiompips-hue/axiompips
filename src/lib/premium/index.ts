// File: src/lib/premium/index.ts
// Main export file for premium features

export {
  getPremiumStatus,
  getUsageLimits,
  canUseCalculator,
  canAddJournalEntry,
  canUseAdvancedTool,
  canExportData,
  hasCloudSyncAccess,
  incrementCalculatorUse,
  incrementJournalEntry,
  incrementAdvancedToolUse,
  type PremiumStatus,
  type UsageLimits,
} from './service';

export {
  usePremiumStatus,
  useUsageLimits,
  useCalculatorPermission,
  useJournalPermission,
  useAdvancedToolPermission,
  useExportPermission,
  useCloudSyncAccess,
} from './hooks';

export {
  exportToCSV,
  downloadCSV,
  exportToExcel,
  exportToPDF,
  exportCalculatorResultsToCSV,
  exportStatsToCSV,
  prepareDataForExport,
} from './export';
