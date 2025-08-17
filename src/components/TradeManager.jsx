import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useCards } from '../hooks/useDatabase';
import { tradeService } from '../services/tradeService';
import CardAutoComplete from './CardAutoComplete';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function TradeManager({ onClose }) {
  const myCards = useCards({ isAvailable: true });
  const [tradeData, setTradeData] = useState({
    traderName: '',
    status: 'pending',
    notes: '',
    myCards: [],
    theirCards: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (tradeData.myCards.length === 0 && tradeData.theirCards.length === 0) {
      alert('Please add at least one card to the trade');
      return;
    }

    try {
      await tradeService.createTrade(tradeData);
      onClose();
    } catch (error) {
      alert('Error creating trade: ' + error.message);
    }
  };

  const addMyCard = (cardId) => {
    const card = myCards.find(c => c.id === cardId);
    if (card && !tradeData.myCards.find(c => c.cardId === cardId)) {
      setTradeData(prev => ({
        ...prev,
        myCards: [...prev.myCards, {
          cardId,
          name: card.name,
          quantity: 1,
          marketPrice: card.marketPrice || 0
        }]
      }));
    }
  };

  const removeMyCard = (cardId) => {
    setTradeData(prev => ({
      ...prev,
      myCards: prev.myCards.filter(c => c.cardId !== cardId)
    }));
  };

  const addTheirCard = (cardData) => {
    setTradeData(prev => ({
      ...prev,
      theirCards: [...prev.theirCards, {
        ...cardData,
        quantity: 1
      }]
    }));
  };

  const removeTheirCard = (index) => {
    setTradeData(prev => ({
      ...prev,
      theirCards: prev.theirCards.filter((_, i) => i !== index)
    }));
  };

  const myCardsValue = tradeData.myCards.reduce((sum, card) => 
    sum + (card.marketPrice * card.quantity), 0
  );
  
  const theirCardsValue = tradeData.theirCards.reduce((sum, card) => 
    sum + (card.marketPrice * card.quantity), 0
  );
  
  const tradeBalance = theirCardsValue - myCardsValue;

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Record Trade
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Trader Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trader Name *
                </label>
                <input
                  type="text"
                  required
                  value={tradeData.traderName}
                  onChange={(e) => setTradeData({...tradeData, traderName: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  value={tradeData.status}
                  onChange={(e) => setTradeData({...tradeData, status: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Trade Cards */}
            <div className="grid grid-cols-2 gap-6">
              {/* My Cards (Giving) */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cards I'm Giving
                </h3>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 min-h-[200px]">
                  <select
                    onChange={(e) => e.target.value && addMyCard(parseInt(e.target.value))}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-3"
                    value=""
                  >
                    <option value="">Select a card to add...</option>
                    {myCards?.filter(c => !tradeData.myCards.find(tc => tc.cardId === c.id))
                      .map(card => (
                        <option key={card.id} value={card.id}>
                          {card.name} - {card.setName} {card.marketPrice && `($${card.marketPrice})`}
                        </option>
                      ))
                    }
                  </select>
                  
                  {tradeData.myCards.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      No cards selected
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {tradeData.myCards.map(card => (
                        <li key={card.cardId} className="flex items-center justify-between bg-white dark:bg-gray-700 rounded p-2">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {card.name}
                            {card.marketPrice > 0 && (
                              <span className="ml-2 text-gray-500">
                                ${card.marketPrice.toFixed(2)}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeMyCard(card.cardId)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                      Total Value: ${myCardsValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Their Cards (Receiving) */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cards I'm Receiving
                </h3>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 min-h-[200px]">
                  <CardAutoComplete
                    onCardSelect={addTheirCard}
                    placeholder="Search to add their cards..."
                  />
                  
                  {tradeData.theirCards.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
                      No cards selected
                    </p>
                  ) : (
                    <ul className="space-y-2 mt-3">
                      {tradeData.theirCards.map((card, index) => (
                        <li key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 rounded p-2">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {card.name}
                            {card.marketPrice > 0 && (
                              <span className="ml-2 text-gray-500">
                                ${card.marketPrice.toFixed(2)}
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeTheirCard(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      Total Value: ${theirCardsValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trade Balance */}
            <div className={`rounded-lg p-4 ${
              tradeBalance > 0 ? 'bg-green-100 dark:bg-green-900/30' :
              tradeBalance < 0 ? 'bg-red-100 dark:bg-red-900/30' :
              'bg-gray-100 dark:bg-gray-900/30'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trade Balance:
                </span>
                <span className={`text-lg font-bold ${
                  tradeBalance > 0 ? 'text-green-600' :
                  tradeBalance < 0 ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {tradeBalance > 0 ? '+' : ''}{tradeBalance.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tradeBalance > 0 ? "You're gaining value" :
                 tradeBalance < 0 ? "You're losing value" :
                 "Even trade"}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes (Optional)
              </label>
              <textarea
                value={tradeData.notes}
                onChange={(e) => setTradeData({...tradeData, notes: e.target.value})}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Any additional notes about this trade..."
              />
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
                Record Trade
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}