import { useState, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { exportService } from '../services/exportService';
import { 
  CloudArrowDownIcon, 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

export default function BackupManager({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('backup');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedImportType, setSelectedImportType] = useState('cards');
  const [importProgress, setImportProgress] = useState(null);

  const handleBackupAll = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const result = await exportService.exportAllToZip();
      const counts = result.counts;
      setMessage({ 
        type: 'success', 
        text: `Full backup completed! Downloaded ZIP file with ${counts.cards} cards, ${counts.lending} lending records, ${counts.trades} trades, ${counts.borrowers} borrowers, and ${counts.wishlist} wishlist items.` 
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Backup failed. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isZipFile = file.name.endsWith('.zip');
    const isCsvFile = file.name.endsWith('.csv');
    
    if (!isZipFile && !isCsvFile) {
      setMessage({ type: 'error', text: 'Please select a CSV or ZIP file' });
      return;
    }

    setIsProcessing(true);
    setMessage(null);
    setImportProgress(null);
    
    try {
      if (isZipFile) {
        // Handle ZIP file import
        const progressCallback = (progress) => {
          setImportProgress(progress);
        };
        
        const result = await exportService.importFromZip(file, progressCallback);
        
        const { cards, lending, trades, borrowers, wishlist, errors } = result.results;
        const successParts = [];
        
        if (cards > 0) successParts.push(`${cards} cards`);
        if (lending > 0) successParts.push(`${lending} lending records`);
        if (trades > 0) successParts.push(`${trades} trades`);
        if (borrowers > 0) successParts.push(`${borrowers} borrowers`);
        if (wishlist > 0) successParts.push(`${wishlist} wishlist items`);
        
        if (errors.length > 0) {
          const errorMsg = errors.map(e => `${e.filename}: ${e.error}`).join(', ');
          setMessage({ 
            type: 'warning', 
            text: `Imported ${successParts.join(', ')} with errors: ${errorMsg}` 
          });
        } else if (successParts.length > 0) {
          setMessage({ 
            type: 'success', 
            text: `Successfully imported ${successParts.join(', ')} from ZIP file!` 
          });
        } else {
          setMessage({ 
            type: 'error', 
            text: 'No data was imported from the ZIP file' 
          });
        }
      } else {
        // Handle CSV file import (existing logic)
        const progressCallback = selectedImportType === 'cards' ? (progress) => {
          setImportProgress(progress);
        } : undefined;
        
        const result = await exportService.importFromCSV(file, selectedImportType, progressCallback);
        
        setMessage({ 
          type: 'success', 
          text: selectedImportType === 'cards' 
            ? `Successfully imported ${result.count} cards with images!` 
            : `Successfully imported ${result.count} ${selectedImportType}!`
        });
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Import failed: ${error.message}` });
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
    }
  };

  const handleExportSingle = async (type) => {
    setIsProcessing(true);
    setMessage(null);
    try {
      await exportService.exportToCSV(type);
      setMessage({ type: 'success', text: `${type} exported successfully!` });
    } catch (error) {
      setMessage({ type: 'error', text: `Export failed: ${error.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Backup & Restore
          </Dialog.Title>

          {/* Tabs */}
          <div className="flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-6">
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                activeTab === 'backup'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CloudArrowDownIcon className="h-5 w-5 mx-auto mb-1" />
              Backup
            </button>
            <button
              onClick={() => setActiveTab('restore')}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                activeTab === 'restore'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CloudArrowUpIcon className="h-5 w-5 mx-auto mb-1" />
              Restore
            </button>
          </div>

          {/* Message Alert */}
          {message && (
            <div className={`mb-4 rounded-lg p-3 flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : message.type === 'warning'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {message.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Full Backup */}
              <div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Full Backup (Recommended)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Export all your data at once: cards, lending records, trades, borrowers, and wishlist.
                  This creates a single ZIP file containing all CSV files for complete backup.
                </p>
                <button
                  onClick={handleBackupAll}
                  disabled={isProcessing}
                  className="w-full inline-flex justify-center items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                      Creating Backup...
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                      Create Full Backup
                    </>
                  )}
                </button>
              </div>

              {/* Individual Exports */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Individual Exports
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Export specific data types individually.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {['cards', 'lending', 'trades', 'borrowers'].map((type) => (
                    <button
                      key={type}
                      onClick={() => handleExportSingle(type)}
                      disabled={isProcessing}
                      className="inline-flex justify-center items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 capitalize"
                    >
                      Export {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Restore Tab */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              {/* Full Restore from ZIP */}
              <div className="border-2 border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Full Restore (Recommended)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Import all your data at once from a backup ZIP file created by this app.
                  The ZIP file will be automatically processed and all data types will be imported.
                </p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Backup ZIP File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,.csv"
                    onChange={handleImportFile}
                    disabled={isProcessing}
                    className="block w-full text-sm text-gray-900 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 dark:file:bg-green-900/20 file:text-green-700 dark:file:text-green-400 hover:file:bg-green-100 dark:hover:file:bg-green-900/30"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Accepts ZIP files from "Create Full Backup" or individual CSV files
                  </p>
                </div>
              </div>

              {/* Individual CSV Import */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Individual CSV Import
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Import specific data types from individual CSV files.
                </p>
                
                {/* Import Type Selection */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CSV Type to Import
                  </label>
                  <select
                    value={selectedImportType}
                    onChange={(e) => setSelectedImportType(e.target.value)}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="cards">Cards</option>
                    <option value="lending">Lending Records</option>
                    <option value="trades">Trades</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Only needed when importing individual CSV files
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      <strong>Important:</strong> Importing will add to your existing data. 
                      Duplicate cards will have their quantities combined.
                    </p>
                  </div>
                </div>
              </div>

              
              {/* Import Progress */}
              {isProcessing && importProgress && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {importProgress.type === 'file' 
                        ? `Processing ZIP file...`
                        : importProgress.type === 'cards'
                        ? 'Importing cards and fetching images...'
                        : 'Importing data...'}
                    </span>
                  </div>
                  
                  {importProgress.type === 'file' && (
                    <>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        Processing file: {importProgress.filename} ({importProgress.current}/{importProgress.total})
                      </div>
                      <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        />
                      </div>
                    </>
                  )}
                  
                  {importProgress.type === 'cards' && (
                    <>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        Processing: {importProgress.cardName} ({importProgress.current}/{importProgress.total})
                      </div>
                      <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        This may take a few moments as we fetch card images from the Pokemon TCG API
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Import Instructions */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Supported Formats:
                </h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <li className="text-green-600 dark:text-green-400">• <strong>ZIP Files:</strong> Import complete backups created with "Create Full Backup" - all data types imported automatically!</li>
                  <li>• <strong>Cards CSV:</strong> Name, Set, Number, Rarity, Condition, Quantity, Market Price, Status, TCG ID, Image URL</li>
                  <li>• <strong>Lending CSV:</strong> Card Name, Borrower, Email, Phone, Lend Date, Expected Return, Actual Return, Status</li>
                  <li>• <strong>Trades CSV:</strong> Date, Trader, My Cards Value, Their Cards Value, Status, Notes</li>
                  <li className="text-blue-600 dark:text-blue-400">• Card images are automatically fetched from Pokemon TCG API during import!</li>
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-6 border-t dark:border-gray-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}