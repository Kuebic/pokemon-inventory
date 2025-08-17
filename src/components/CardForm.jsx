import { useState } from 'react';
import { cardService } from '../services/cardService';
import CardAutoComplete from './CardAutoComplete';

const conditions = ['Mint', 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'];
const rarities = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Ultra Rare', 'Secret Rare'];

export default function CardForm({ card, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: card?.name || '',
    setName: card?.setName || '',
    setNumber: card?.setNumber || '',
    rarity: card?.rarity || 'Common',
    condition: card?.condition || 'Near Mint',
    quantity: card?.quantity || 1,
    marketPrice: card?.marketPrice || '',
    imageUrl: card?.imageUrl || '',
    tcgId: card?.tcgId || '',
    ...card
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (card?.id) {
        await cardService.updateCard(card.id, formData);
      } else {
        await cardService.addCard(formData);
      }
      onSave();
    } catch (error) {
      alert('Error saving card: ' + error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleCardSelect = (apiCard) => {
    // Populate form with API data
    setFormData(prev => ({
      ...prev,
      name: apiCard.name || prev.name,
      setName: apiCard.setName || prev.setName,
      setNumber: apiCard.setNumber || prev.setNumber,
      rarity: apiCard.rarity || prev.rarity,
      marketPrice: apiCard.marketPrice || prev.marketPrice,
      imageUrl: apiCard.imageUrl || prev.imageUrl,
      tcgId: apiCard.tcgId || prev.tcgId,
      // Keep user's selected condition and quantity
      condition: prev.condition,
      quantity: prev.quantity
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Search - Only show for new cards */}
      {!card?.id && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search for Card (Optional)
          </label>
          <CardAutoComplete 
            onCardSelect={handleCardSelect}
            placeholder="Type to search Pokemon TCG database..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Search the Pokemon TCG database to auto-fill card details
          </p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Card Name *
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="setName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Set Name
          </label>
          <input
            type="text"
            name="setName"
            id="setName"
            value={formData.setName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="setNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Set Number
          </label>
          <input
            type="text"
            name="setNumber"
            id="setNumber"
            value={formData.setNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="rarity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Rarity
          </label>
          <select
            name="rarity"
            id="rarity"
            value={formData.rarity}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {rarities.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Condition
          </label>
          <select
            name="condition"
            id="condition"
            value={formData.condition}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            {conditions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            id="quantity"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="marketPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Market Price ($)
          </label>
          <input
            type="number"
            name="marketPrice"
            id="marketPrice"
            step="0.01"
            min="0"
            value={formData.marketPrice}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Image URL
        </label>
        <input
          type="url"
          name="imageUrl"
          id="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        {formData.imageUrl && (
          <div className="mt-2">
            <img 
              src={formData.imageUrl} 
              alt="Card preview" 
              className="h-32 w-24 object-cover rounded"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
        >
          {card?.id ? 'Update' : 'Add'} Card
        </button>
      </div>
    </form>
  );
}