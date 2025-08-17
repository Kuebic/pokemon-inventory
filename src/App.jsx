import { createBrowserRouter, RouterProvider, createHashRouter } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSkeleton from './components/LoadingSkeleton';
import reminderService from './services/reminderService';

// Lazy load pages for better performance
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const LendingPage = lazy(() => import('./pages/LendingPage'));
const TradePage = lazy(() => import('./pages/TradePage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Use HashRouter for GitHub Pages compatibility
const router = createHashRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        {
          index: true,
          element: <Dashboard />,
        },
        {
          path: 'collection',
          element: (
            <Suspense fallback={<LoadingSkeleton type="list" count={3} />}>
              <CollectionPage />
            </Suspense>
          ),
        },
        {
          path: 'lending',
          element: (
            <Suspense fallback={<LoadingSkeleton type="list" count={3} />}>
              <LendingPage />
            </Suspense>
          ),
        },
        {
          path: 'trades',
          element: (
            <Suspense fallback={<LoadingSkeleton type="list" count={3} />}>
              <TradePage />
            </Suspense>
          ),
        },
        {
          path: 'stats',
          element: (
            <Suspense fallback={<LoadingSkeleton type="chart" count={2} />}>
              <StatsPage />
            </Suspense>
          ),
        },
        {
          path: 'settings',
          element: (
            <Suspense fallback={<LoadingSkeleton type="list" count={3} />}>
              <SettingsPage />
            </Suspense>
          ),
        },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);

function App() {
  useEffect(() => {
    // Initialize reminder service on app load
    reminderService.init();
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;