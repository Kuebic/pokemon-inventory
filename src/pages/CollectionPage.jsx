import { useState, useMemo, useEffect } from 'react';
import { useCards } from '../hooks/useDatabase';
import CardList from '../components/CardList';
import CardForm from '../components/CardForm';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Pagination from '../components/Pagination';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

export default function CollectionPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const itemsPerPage = 50;
  const allCards = useCards({ ...filter, searchTerm });
  
  // Handle loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (allCards !== undefined) {
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [allCards]);
  
  // Paginate cards
  const cards = useMemo(() => {
    if (!allCards) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allCards.slice(startIndex, endIndex);
  }, [allCards, currentPage]);
  
  const totalPages = Math.ceil((allCards?.length || 0) / itemsPerPage);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  const handleEdit = (card) => {
    setEditingCard(card);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCard(null);
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Collection</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your Pokemon card collection
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add Card
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <select
            onChange={(e) => setFilter({ ...filter, isAvailable: e.target.value === '' ? undefined : e.target.value === 'true' })}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Cards</option>
            <option value="true">Available</option>
            <option value="false">Lent Out</option>
          </select>
        </div>
      </div>

      {/* Card List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingSkeleton type="card" count={6} />
        </div>
      ) : (
        <>
          <CardList cards={cards} onEdit={handleEdit} />
          {allCards && allCards.length > itemsPerPage && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={allCards.length}
              />
            </div>
          )}
        </>
      )}

      {/* Add/Edit Card Dialog */}
      <Dialog open={isFormOpen} onClose={handleCloseForm} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingCard ? 'Edit Card' : 'Add New Card'}
            </Dialog.Title>
            <CardForm 
              card={editingCard} 
              onClose={handleCloseForm}
              onSave={handleCloseForm}
            />
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}