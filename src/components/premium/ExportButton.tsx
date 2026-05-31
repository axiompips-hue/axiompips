// File: src/components/premium/ExportButton.tsx
// Export button component with premium check

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Download, FileText, FileSpreadsheet, Lock } from 'lucide-react';
import { useExportPermission } from '@/lib/premium/hooks';
import { UpgradePrompt } from './UpgradePrompt';
import {
  exportToCSV,
  downloadCSV,
  exportToExcel,
  exportToPDF,
} from '@/lib/premium/export';

interface ExportButtonProps {
  data: any[];
  filename?: string;
  type: 'journal' | 'calculator';
  className?: string;
}

export function ExportButton({ data, filename, type, className = '' }: ExportButtonProps) {
  const { canExport, loading } = useExportPermission();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExportClick = () => {
    if (!canExport) {
      setShowUpgrade(true);
      return;
    }
    setShowMenu(!showMenu);
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!canExport) return;

    const defaultFilename = filename || `${type}-export`;

    try {
      switch (format) {
        case 'csv':
          const csvContent = exportToCSV(data);
          downloadCSV(csvContent, `${defaultFilename}.csv`);
          break;
        case 'excel':
          exportToExcel(data);
          break;
        case 'pdf':
          await exportToPDF(data);
          break;
      }
      setShowMenu(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  if (loading) {
    return (
      <Button variant="outline" disabled className={className}>
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
    );
  }

  return (
    <>
      <div className="relative">
        <Button
          onClick={handleExportClick}
          variant={canExport ? 'outline' : 'outline'}
          className={`${className} ${!canExport ? 'opacity-60' : ''}`}
        >
          {canExport ? (
            <Download className="w-4 h-4 mr-2" />
          ) : (
            <Lock className="w-4 h-4 mr-2" />
          )}
          Export
        </Button>

        {/* Export format dropdown */}
        {showMenu && canExport && (
          <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg py-1 z-10">
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export as Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export as PDF
            </button>
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {showMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />
      )}

      <UpgradePrompt
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="export"
      />
    </>
  );
}
