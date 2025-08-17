import { useCollectionStats, useRecentActivity, useLending } from '../hooks/useDatabase';
import { CalendarIcon, CurrencyDollarIcon, UsersIcon, RectangleStackIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const stats = useCollectionStats();
  const recentActivity = useRecentActivity(5);
  const { overdueItems } = useLending();

  const statCards = [
    {
      name: 'Total Cards',
      value: stats?.totalCards || 0,
      icon: RectangleStackIcon,
      change: stats?.availableCards || 0,
      changeLabel: 'available',
      color: 'blue'
    },
    {
      name: 'Total Value',
      value: `$${stats?.totalValue?.toFixed(2) || '0.00'}`,
      icon: CurrencyDollarIcon,
      color: 'green'
    },
    {
      name: 'Cards Lent',
      value: stats?.lentCards || 0,
      icon: UsersIcon,
      change: overdueItems?.length || 0,
      changeLabel: 'overdue',
      color: overdueItems?.length > 0 ? 'red' : 'yellow'
    },
    {
      name: 'Unique Sets',
      value: stats?.uniqueSets || 0,
      icon: CalendarIcon,
      color: 'purple'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome to your Pokemon Card Inventory Manager
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className={`absolute rounded-md ${getColorClasses(stat.color)} p-3`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              {stat.change !== undefined && (
                <p className="ml-2 flex items-baseline text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{stat.change}</span>
                  <span className="ml-1">{stat.changeLabel}</span>
                </p>
              )}
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          {!recentActivity || recentActivity.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
          ) : (
            <ul className="space-y-3">
              {recentActivity.map((activity, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      activity.type === 'card_added' ? 'bg-green-100' :
                      activity.type === 'card_lent' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      {activity.type === 'card_added' && (
                        <RectangleStackIcon className="h-5 w-5 text-green-600" />
                      )}
                      {activity.type === 'card_lent' && (
                        <UsersIcon className="h-5 w-5 text-yellow-600" />
                      )}
                      {activity.type === 'card_returned' && (
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Overdue Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Overdue Returns
          </h2>
          {!overdueItems || overdueItems.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No overdue items</p>
          ) : (
            <ul className="space-y-3">
              {overdueItems.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-600">
                        {item.daysOverdue}d
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {item.card?.name || 'Unknown card'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Borrowed by {item.borrowerName}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Collection Distribution */}
      {stats && Object.keys(stats.byRarity || {}).length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Collection by Rarity
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.byRarity).map(([rarity, count]) => (
              <div key={rarity} className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{rarity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}