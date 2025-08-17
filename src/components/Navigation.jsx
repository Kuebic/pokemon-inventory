import { NavLink, useLocation } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import {
  HomeIcon,
  RectangleStackIcon,
  UserGroupIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useCollectionStats } from '../hooks/useDatabase';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Collection', href: '/collection', icon: RectangleStackIcon },
  { name: 'Lending', href: '/lending', icon: UserGroupIcon },
  { name: 'Trades', href: '/trades', icon: ArrowsRightLeftIcon },
  { name: 'Statistics', href: '/stats', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Navigation() {
  const location = useLocation();
  const stats = useCollectionStats();

  return (
    <Disclosure as="nav" className="bg-gray-800">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pokemon-red to-pokemon-blue flex items-center justify-center">
                      <span className="text-white font-bold text-sm">P</span>
                    </div>
                    <span className="ml-2 text-white font-bold text-lg hidden sm:block">
                      Pokemon Inventory
                    </span>
                  </div>
                </div>
                
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          className={clsx(
                            isActive
                              ? 'bg-gray-900 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                            'group rounded-md px-3 py-2 text-sm font-medium flex items-center'
                          )}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <item.icon
                            className={clsx(
                              isActive ? 'text-white' : 'text-gray-400 group-hover:text-white',
                              'mr-2 h-5 w-5 flex-shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                          {item.name === 'Collection' && stats && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                              {stats.totalCards || 0}
                            </span>
                          )}
                          {item.name === 'Lending' && stats && stats.lentCards > 0 && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                              {stats.lentCards}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                {stats && (
                  <div className="text-white text-sm mr-4 hidden sm:block">
                    <span className="text-gray-400">Total Value:</span>
                    <span className="ml-2 font-semibold">
                      ${stats.totalValue?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Disclosure.Button
                    key={item.name}
                    as={NavLink}
                    to={item.href}
                    className={clsx(
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'block rounded-md px-3 py-2 text-base font-medium'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={clsx(
                          isActive ? 'text-white' : 'text-gray-400',
                          'mr-3 h-5 w-5 flex-shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                      {item.name === 'Collection' && stats && (
                        <span className="ml-auto inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                          {stats.totalCards || 0}
                        </span>
                      )}
                      {item.name === 'Lending' && stats && stats.lentCards > 0 && (
                        <span className="ml-auto inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                          {stats.lentCards}
                        </span>
                      )}
                    </div>
                  </Disclosure.Button>
                );
              })}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}