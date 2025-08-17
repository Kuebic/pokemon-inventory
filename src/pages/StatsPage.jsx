import { useCollectionStats } from '../hooks/useDatabase';
import Statistics from '../components/Statistics';

export default function StatsPage() {
  const stats = useCollectionStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistics</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Detailed analytics about your Pokemon card collection
        </p>
      </div>

      {stats ? (
        <Statistics stats={stats} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Loading statistics...</p>
        </div>
      )}
    </div>
  );
}