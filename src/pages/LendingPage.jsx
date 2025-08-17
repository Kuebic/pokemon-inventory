import { useState } from 'react';
import { useLending, useLendingHistory, useBorrowers } from '../hooks/useDatabase';
import LendingManager from '../components/LendingManager';
import { lendingService } from '../services/lendingService';
import { UserGroupIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function LendingPage() {
  const { activeLendings, overdueItems } = useLending();
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(null);
  const lendingHistory = useLendingHistory(selectedBorrowerId);
  const borrowers = useBorrowers();
  const [showLendForm, setShowLendForm] = useState(false);
  
  const handleReturn = async (lendingId) => {
    try {
      await lendingService.returnCards([lendingId]);
      // Data will auto-refresh due to useLiveQuery in the hooks
    } catch (error) {
      console.error('Failed to return card:', error);
      alert('Failed to return card: ' + error.message);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Lending Manager</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Track cards you've lent to friends
            </p>
          </div>
          <button
            onClick={() => setShowLendForm(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <UserGroupIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Lend Cards
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Lendings</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {activeLendings?.length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {overdueItems?.length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Returned</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {lendingHistory?.filter(l => l.status === 'returned').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Items Alert */}
      {overdueItems && overdueItems.length > 0 && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2">
            Overdue Returns ({overdueItems.length})
          </h3>
          <ul className="space-y-2">
            {overdueItems.map(item => (
              <li key={item.id} className="text-sm text-red-700 dark:text-red-300">
                <span className="font-medium">{item.card?.name}</span> - 
                Borrowed by {item.borrowerName} ({item.daysOverdue} days overdue)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Active Lendings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Lendings</h2>
        </div>
        <div className="p-6">
          {!activeLendings || activeLendings.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No active lendings</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Card
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Borrower
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lend Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Expected Return
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {activeLendings.map(lending => (
                    <tr key={lending.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {lending.card?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {lending.borrowerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(lending.lendDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(lending.expectedReturnDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => handleReturn(lending.id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Mark Returned
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Lending History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mt-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lending History</h2>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Filter by borrower:</label>
              <select
                value={selectedBorrowerId || ''}
                onChange={(e) => setSelectedBorrowerId(e.target.value || null)}
                className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">All Borrowers</option>
                {borrowers?.map(borrower => (
                  <option key={borrower.id} value={borrower.id}>
                    {borrower.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="p-6">
          {!lendingHistory || lendingHistory.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              {selectedBorrowerId ? 'No lending history for this borrower' : 'No lending history yet'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Card
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Borrower
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lend Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Return Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Days Out
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {lendingHistory.map(lending => {
                    const lendDate = new Date(lending.lendDate);
                    const returnDate = lending.actualReturnDate ? new Date(lending.actualReturnDate) : new Date();
                    const daysOut = Math.floor((returnDate - lendDate) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <tr key={lending.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {lending.card?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {lending.borrowerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {lendDate.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {lending.actualReturnDate ? 
                            new Date(lending.actualReturnDate).toLocaleDateString() : 
                            '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lending.status === 'active' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            lending.status === 'returned' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                          }`}>
                            {lending.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {daysOut} {daysOut === 1 ? 'day' : 'days'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Lending Form Modal */}
      {showLendForm && (
        <LendingManager onClose={() => setShowLendForm(false)} />
      )}
    </div>
  );
}