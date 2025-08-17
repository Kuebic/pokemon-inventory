import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useCards } from '../hooks/useDatabase';
import { lendingService } from '../services/lendingService';

export default function LendingManager({ onClose }) {
  const availableCards = useCards({ isAvailable: true });
  const [selectedCards, setSelectedCards] = useState([]);
  const [borrowerInfo, setBorrowerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [expectedReturnDate, setExpectedReturnDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCards.length === 0) {
      alert('Please select at least one card');
      return;
    }
    
    try {
      await lendingService.lendCards(selectedCards, borrowerInfo, expectedReturnDate);
      onClose();
    } catch (error) {
      alert('Error lending cards: ' + error.message);
    }
  };

  const toggleCardSelection = (cardId) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl w-full rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Lend Cards
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Borrower Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Borrower Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={borrowerInfo.name}
                    onChange={(e) => setBorrowerInfo({...borrowerInfo, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={borrowerInfo.email}
                    onChange={(e) => setBorrowerInfo({...borrowerInfo, email: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={borrowerInfo.phone}
                    onChange={(e) => setBorrowerInfo({...borrowerInfo, phone: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Return Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Expected Return Date *
              </label>
              <input
                type="date"
                required
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Card Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Cards to Lend ({selectedCards.length} selected)
              </h3>
              <div className="border dark:border-gray-600 rounded-md max-h-64 overflow-y-auto">
                {!availableCards || availableCards.length === 0 ? (
                  <p className="p-4 text-center text-gray-500">No available cards to lend</p>
                ) : (
                  <div className="divide-y dark:divide-gray-700">
                    {availableCards.map(card => (
                      <label
                        key={card.id}
                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCards.includes(card.id)}
                          onChange={() => toggleCardSelection(card.id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-900 dark:text-white">
                          {card.name} - {card.setName} {card.setNumber && `#${card.setNumber}`}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Lend Cards
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}