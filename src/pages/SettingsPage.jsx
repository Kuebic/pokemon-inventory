import { useState } from 'react';
import { cacheService } from '../services/cacheService';
import reminderService from '../services/reminderService';
import ExportManager from '../components/ExportManager';
import BackupManager from '../components/BackupManager';
import db from '../db/database';
import { BellIcon, TrashIcon, CloudArrowDownIcon, CloudArrowUpIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const [notificationStatus, setNotificationStatus] = useState(reminderService.getNotificationStatus());
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const cacheSize = cacheService.getCacheSize();

  const handleEnableNotifications = async () => {
    const enabled = await reminderService.requestNotificationPermission();
    setNotificationStatus(reminderService.getNotificationStatus());
    if (enabled) {
      await reminderService.sendTestNotification();
    }
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear all cached data?')) {
      cacheService.clearAll();
      alert('Cache cleared successfully');
    }
  };

  const handleClearAllData = async () => {
    const confirmed = confirm(
      'WARNING: This will permanently delete ALL your data including:\n\n' +
      '• All Pokemon cards\n' +
      '• All lending records\n' +
      '• All trade history\n' +
      '• All borrower information\n' +
      '• All wishlist items\n\n' +
      'This action cannot be undone!\n\n' +
      'Are you absolutely sure you want to delete all data?'
    );
    
    if (confirmed) {
      const doubleConfirmed = confirm(
        'This is your final warning!\n\n' +
        'Type "DELETE" to confirm you want to permanently delete all data.'
      );
      
      if (doubleConfirmed) {
        const userInput = prompt('Type DELETE to confirm:');
        if (userInput === 'DELETE') {
          try {
            // Clear all tables
            await db.cards.clear();
            await db.lending.clear();
            await db.trades.clear();
            await db.borrowers.clear();
            await db.wishlist.clear();
            
            // Also clear cache
            cacheService.clearAll();
            
            alert('All data has been cleared successfully. You can now import fresh data.');
            
            // Reload the page to reset the UI
            window.location.reload();
          } catch (error) {
            console.error('Failed to clear data:', error);
            alert('Failed to clear data. Please try again.');
          }
        } else {
          alert('Data deletion cancelled.');
        }
      }
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your application preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BellIcon className="h-6 w-6 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Browser Notifications
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Get reminders for overdue card returns
                  </p>
                </div>
              </div>
              <div>
                {notificationStatus === 'granted' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Enabled
                  </span>
                ) : notificationStatus === 'denied' ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Blocked
                  </span>
                ) : (
                  <button
                    onClick={handleEnableNotifications}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Enable
                  </button>
                )}
              </div>
            </div>
            
            {notificationStatus === 'denied' && (
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Notifications are blocked. Please enable them in your browser settings.
                </p>
              </div>
            )}
            
            {notificationStatus === 'granted' && (
              <button
                onClick={() => reminderService.sendTestNotification()}
                className="mt-4 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Send test notification
              </button>
            )}
          </div>
        </div>

        {/* Cache Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cache Management</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TrashIcon className="h-6 w-6 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Clear Cache
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Remove all cached API responses and search results
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearCache}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Clear Cache
              </button>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cache Size: <span className="font-medium">{cacheSize.sizeInKB} KB</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cached Items: <span className="font-medium">{cacheSize.keys}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Management</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Backup & Restore */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CloudArrowUpIcon className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Backup & Restore
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Full backup of all data or restore from CSV files
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBackupDialog(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Backup & Restore
                </button>
              </div>
              
              {/* Export Data */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CloudArrowDownIcon className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Export Data
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Download specific data as CSV or PDF
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportDialog(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Export
                </button>
              </div>
              
              {/* Clear All Data */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Clear All Data
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Permanently delete all data for a fresh start
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearAllData}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:bg-gray-800 dark:hover:bg-red-900/20"
                  >
                    Clear All Data
                  </button>
                </div>
                <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Warning:</strong> This will permanently delete all your data. Make sure to create a backup first if you want to keep your data.
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Tip:</strong> Use "Backup & Restore" for complete data backup in one click. 
                  Your data is stored locally in your browser - backup regularly to prevent data loss.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">About</h2>
          </div>
          <div className="p-6">
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Pokemon Inventory Manager v1.0.0</p>
              <p>Built with React, Vite, and IndexedDB</p>
              <p>© 2025 - Personal Use Application</p>
              <div className="pt-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Features:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Local storage with IndexedDB</li>
                  <li>Pokemon TCG API integration</li>
                  <li>Card lending management</li>
                  <li>Trade tracking and valuation</li>
                  <li>Collection statistics and charts</li>
                  <li>CSV import and export</li>
                  <li>Full backup and restore</li>
                  <li>PDF report generation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportManager 
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
      
      {/* Backup Dialog */}
      <BackupManager
        isOpen={showBackupDialog}
        onClose={() => setShowBackupDialog(false)}
      />
    </div>
  );
}