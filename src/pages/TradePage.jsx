import { useState } from 'react';
import { useTrades } from '../hooks/useDatabase';
import TradeManager from '../components/TradeManager';
import { tradeService } from '../services/tradeService';
import { ArrowsRightLeftIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export default function TradePage() {
  const trades = useTrades();
  const [showTradeForm, setShowTradeForm] = useState(false);
  
  const handleUpdateStatus = async (tradeId, newStatus) => {
    try {
      await tradeService.updateTradeStatus(tradeId, newStatus);
      // Data will auto-refresh due to useLiveQuery in the hooks
    } catch (error) {
      console.error('Failed to update trade status:', error);
      alert('Failed to update trade status: ' + error.message);
    }
  };

  const completedTrades = trades?.filter(t => t.status === 'completed') || [];
  const pendingTrades = trades?.filter(t => t.status === 'pending') || [];
  
  const totalGiven = completedTrades.reduce((sum, t) => sum + (t.myCardsValue || 0), 0);
  const totalReceived = completedTrades.reduce((sum, t) => sum + (t.theirCardsValue || 0), 0);
  const netProfit = totalReceived - totalGiven;

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Trade Manager</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Track your Pokemon card trades
            </p>
          </div>
          <button
            onClick={() => setShowTradeForm(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <ArrowsRightLeftIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            New Trade
          </button>
        </div>
      </div>

      {/* Trade Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <ArrowsRightLeftIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Trades</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {trades?.length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <ArrowDownIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cards Given</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${totalGiven.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <ArrowUpIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cards Received</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${totalReceived.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {netProfit >= 0 ? (
                <ArrowUpIcon className="h-5 w-5 text-green-600" />
              ) : (
                <ArrowDownIcon className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Profit</p>
              <p className={`text-2xl font-semibold ${
                netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${Math.abs(netProfit).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Trades */}
      {pendingTrades.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
            Pending Trades ({pendingTrades.length})
          </h3>
          <ul className="space-y-2">
            {pendingTrades.map(trade => (
              <li key={trade.id} className="text-sm text-yellow-700 dark:text-yellow-300">
                Trade with {trade.traderName} - 
                Value: ${trade.myCardsValue?.toFixed(2)} ↔ ${trade.theirCardsValue?.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trade History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trade History</h2>
        </div>
        <div className="p-6">
          {!trades || trades.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No trades recorded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trader
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Given Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Received Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {trades.map(trade => {
                    const balance = (trade.theirCardsValue || 0) - (trade.myCardsValue || 0);
                    return (
                      <tr key={trade.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(trade.tradeDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {trade.traderName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ${trade.myCardsValue?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ${trade.theirCardsValue?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {balance >= 0 ? '+' : ''}{balance.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            trade.status === 'completed' ? 'bg-green-100 text-green-800' :
                            trade.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {trade.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateStatus(trade.id, 'completed')}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(trade.id, 'cancelled')}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
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

      {/* Trade Form Modal */}
      {showTradeForm && (
        <TradeManager onClose={() => setShowTradeForm(false)} />
      )}
    </div>
  );
}