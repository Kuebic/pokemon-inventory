import { useState } from 'react';
import { cardService } from '../services/cardService';
import { 
  PencilIcon, 
  TrashIcon, 
  ViewColumnsIcon, 
  Squares2X2Icon 
} from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

export default function CardList({ cards, onEdit }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleDelete = async (card) => {
    try {
      await cardService.deleteCard(card.id);
      setDeleteConfirm(null);
    } catch (error) {
      alert(error.message);
    }
  };

  const getConditionColor = (condition) => {
    const colors = {
      'Mint': 'bg-green-100 text-green-800',
      'Near Mint': 'bg-blue-100 text-blue-800',
      'Lightly Played': 'bg-yellow-100 text-yellow-800',
      'Moderately Played': 'bg-orange-100 text-orange-800',
      'Heavily Played': 'bg-red-100 text-red-800',
      'Damaged': 'bg-gray-100 text-gray-800'
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  const getRarityColor = (rarity) => {
    const colors = {
      'Common': 'text-gray-600',
      'Uncommon': 'text-green-600',
      'Rare': 'text-blue-600',
      'Rare Holo': 'text-purple-600',
      'Ultra Rare': 'text-yellow-600',
      'Secret Rare': 'text-pink-600'
    };
    return colors[rarity] || 'text-gray-600';
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-12">
        <Squares2X2Icon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No cards</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by adding a new card to your collection.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <ViewColumnsIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Card Image Placeholder */}
              <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                {card.imageUrl ? (
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Squares2X2Icon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No image</p>
                  </div>
                )}
              </div>
              
              {/* Card Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {card.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {card.setName} {card.setNumber && `#${card.setNumber}`}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-sm font-medium ${getRarityColor(card.rarity)}`}>
                    {card.rarity}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(card.condition)}`}>
                    {card.condition}
                  </span>
                </div>
                {card.marketPrice && (
                  <p className="mt-2 text-lg font-bold text-green-600">
                    ${card.marketPrice.toFixed(2)}
                  </p>
                )}
                <div className="mt-3 flex justify-between">
                  <button
                    onClick={() => onEdit(card)}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(card)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Availability Badge */}
              {!card.isAvailable && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  Lent Out
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {cards.map((card) => (
              <li key={card.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-20 w-16 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden">
                        {card.imageUrl ? (
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Squares2X2Icon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {card.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {card.setName} {card.setNumber && `#${card.setNumber}`}
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className={`text-xs font-medium ${getRarityColor(card.rarity)}`}>
                            {card.rarity}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getConditionColor(card.condition)}`}>
                            {card.condition}
                          </span>
                          {!card.isAvailable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Lent Out
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {card.marketPrice && (
                        <span className="text-lg font-bold text-green-600">
                          ${card.marketPrice.toFixed(2)}
                        </span>
                      )}
                      <button
                        onClick={() => onEdit(card)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(card)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Delete Card
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
            </Dialog.Description>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}