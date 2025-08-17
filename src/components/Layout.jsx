import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}