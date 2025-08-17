import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { exportService } from '../services/exportService';
import { DocumentArrowDownIcon, TableCellsIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function ExportManager({ isOpen, onClose }) {
  const [exportType, setExportType] = useState('cards');
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === 'csv') {
        await exportService.exportToCSV(exportType);
      } else {
        await exportService.exportToPDF(exportType);
      }
      onClose();
    } catch (error) {
      alert('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      id: 'cards',
      name: 'Card Collection',
      description: 'Export all cards with details and values',
      icon: TableCellsIcon
    },
    {
      id: 'lending',
      name: 'Lending Records',
      description: 'Export all lending history and active loans',
      icon: DocumentArrowDownIcon
    },
    {
      id: 'trades',
      name: 'Trade History',
      description: 'Export all trades with values and balances',
      icon: DocumentTextIcon
    },
    {
      id: 'full',
      name: 'Full Report',
      description: 'Complete inventory report with all data',
      icon: DocumentTextIcon,
      pdfOnly: true
    }
  ];

  const selectedOption = exportOptions.find(opt => opt.id === exportType);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Export Data
          </Dialog.Title>
          
          <div className="space-y-4">
            {/* Export Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What to Export
              </label>
              <div className="space-y-2">
                {exportOptions.map((option) => (
                  <label
                    key={option.id}
                    className={`relative flex cursor-pointer rounded-lg border p-4 ${
                      exportType === option.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportType"
                      value={option.id}
                      checked={exportType === option.id}
                      onChange={(e) => {
                        setExportType(e.target.value);
                        if (option.pdfOnly) {
                          setExportFormat('pdf');
                        }
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <option.icon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {option.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`relative flex cursor-pointer rounded-lg border p-3 ${
                    exportFormat === 'csv'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  } ${selectedOption?.pdfOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value)}
                    disabled={selectedOption?.pdfOnly}
                    className="sr-only"
                  />
                  <div className="text-center w-full">
                    <TableCellsIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">CSV</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      For spreadsheets
                    </p>
                  </div>
                </label>
                
                <label
                  className={`relative flex cursor-pointer rounded-lg border p-3 ${
                    exportFormat === 'pdf'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="sr-only"
                  />
                  <div className="text-center w-full">
                    <DocumentTextIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">PDF</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      For printing/sharing
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {exportFormat === 'csv' 
                  ? 'CSV files can be opened in Excel, Google Sheets, or any spreadsheet application.'
                  : 'PDF files include formatting and summaries, perfect for printing or sharing.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Exporting...
                  </>
                ) : (
                  <>Export {exportFormat.toUpperCase()}</>
                )}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}