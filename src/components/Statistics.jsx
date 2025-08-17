import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTrades, useLending } from '../hooks/useDatabase';
import { useState, useEffect } from 'react';
import { lendingService } from '../services/lendingService';
import { tradeService } from '../services/tradeService';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function Statistics({ stats }) {
  const trades = useTrades();
  const { activeLendings } = useLending();
  const [lendingStats, setLendingStats] = useState(null);
  const [tradeStats, setTradeStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const lending = await lendingService.getLendingStats();
      const trade = await tradeService.getTradeStats();
      setLendingStats(lending);
      setTradeStats(trade);
    };
    loadStats();
  }, []);

  // Prepare data for rarity pie chart
  const rarityData = Object.entries(stats.byRarity || {}).map(([name, value]) => ({
    name,
    value
  }));

  // Prepare data for condition bar chart
  const conditionData = Object.entries(stats.byCondition || {}).map(([name, value]) => ({
    name: name.replace('Lightly Played', 'LP').replace('Moderately Played', 'MP').replace('Heavily Played', 'HP'),
    cards: value
  }));

  // Prepare data for top sets bar chart
  const setData = Object.entries(stats.bySet || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      cards: value
    }));

  // Trade history line chart data (mock data for demonstration)
  const tradeHistoryData = trades?.slice(-10).map((trade, index) => ({
    date: new Date(trade.tradeDate).toLocaleDateString(),
    given: trade.myCardsValue || 0,
    received: trade.theirCardsValue || 0,
    balance: (trade.theirCardsValue || 0) - (trade.myCardsValue || 0)
  })) || [];

  return (
    <div className="space-y-6">
      {/* Collection Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Collection Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Cards</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalCards || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Quantity</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalQuantity || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
            <p className="text-2xl font-bold text-green-600">
              ${stats.totalValue?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Unique Sets</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.uniqueSets || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rarity Distribution Pie Chart */}
        {rarityData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cards by Rarity
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={rarityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {rarityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Condition Distribution Bar Chart */}
        {conditionData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Cards by Condition
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conditionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cards" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Sets Bar Chart */}
        {setData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Sets in Collection
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={setData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="cards" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trade Balance History */}
        {tradeHistoryData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Trade Values
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tradeHistoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="given" stroke="#EF4444" name="Given" />
                <Line type="monotone" dataKey="received" stroke="#10B981" name="Received" />
                <Line type="monotone" dataKey="balance" stroke="#3B82F6" name="Balance" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lending Statistics */}
        {lendingStats && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Lending Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Lendings</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{lendingStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Currently Lent</span>
                <span className="text-sm font-medium text-yellow-600">{lendingStats.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Returned</span>
                <span className="text-sm font-medium text-green-600">{lendingStats.returned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
                <span className="text-sm font-medium text-red-600">{lendingStats.overdue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg. Lending Days</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{lendingStats.averageLendingDays}</span>
              </div>
              {lendingStats.topBorrowers.length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Borrowers</p>
                  {lendingStats.topBorrowers.map((borrower, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{borrower.name}</span>
                      <span className="text-gray-900 dark:text-white">{borrower.count} times</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trade Statistics */}
        {tradeStats && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Trade Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Trades</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{tradeStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                <span className="text-sm font-medium text-green-600">{tradeStats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                <span className="text-sm font-medium text-yellow-600">{tradeStats.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Given</span>
                <span className="text-sm font-medium text-red-600">${tradeStats.totalGiven.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Received</span>
                <span className="text-sm font-medium text-green-600">${tradeStats.totalReceived.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Net Profit</span>
                <span className={`text-sm font-medium ${tradeStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(tradeStats.netProfit).toFixed(2)}
                </span>
              </div>
              {tradeStats.topTraders.length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Trading Partners</p>
                  {tradeStats.topTraders.map((trader, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{trader.name}</span>
                      <span className="text-gray-900 dark:text-white">{trader.count} trades</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}