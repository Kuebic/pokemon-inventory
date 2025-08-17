export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const CardSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-28 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );

  const TableRowSkeleton = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
      </td>
    </tr>
  );

  const StatSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
      <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    </div>
  );

  const ChartSkeleton = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
      <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
      <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
    </div>
  );

  const ListSkeleton = () => (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
            <div className="h-8 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const skeletons = {
    card: CardSkeleton,
    table: TableRowSkeleton,
    stat: StatSkeleton,
    chart: ChartSkeleton,
    list: ListSkeleton
  };

  const SkeletonComponent = skeletons[type] || CardSkeleton;

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </>
  );
}