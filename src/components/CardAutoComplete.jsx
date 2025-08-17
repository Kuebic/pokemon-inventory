import React, { useState, useEffect, useCallback } from 'react';
import { pokemonTCGService } from '../services/pokemonTCGService';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash';

export default function CardAutoComplete({ onCardSelect, placeholder = "Search Pokemon cards..." }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [apiError, setApiError] = useState(false);

  // Debounced search function
  const searchCards = useCallback(
    debounce(async (term) => {
      if (term.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setApiError(false);
      try {
        const response = await pokemonTCGService.searchCards(term);
        // Handle the new response format {cards: [], isMockData: boolean}
        const cards = response.cards !== undefined ? response.cards : response;
        
        setSuggestions(cards);
        setShowSuggestions(true);
        
        // Show message if provided (e.g., "No cards found")
        if (response.message) {
          console.info(response.message);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSuggestions([]);
        // Only show error for actual API issues, not for "no results"
        if (!error.message.includes('No cards found')) {
          setApiError(true);
        }
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    searchCards(searchTerm);
  }, [searchTerm, searchCards]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedIndex(-1);
    
    if (value.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleCardSelect = (card) => {
    // Transform API data to match our database schema
    const cardData = {
      name: card.name,
      setName: card.setName,
      setNumber: card.setNumber,
      rarity: card.rarity,
      tcgId: card.tcgId,
      imageUrl: card.imageUrl,
      marketPrice: card.marketPrice,
      types: card.types,
      hp: card.hp,
      artist: card.artist,
      evolvesFrom: card.evolvesFrom,
      attacks: card.attacks,
      weaknesses: card.weaknesses,
      resistances: card.resistances,
      retreatCost: card.retreatCost,
      supertype: card.supertype,
      subtypes: card.subtypes
    };
    
    onCardSelect(cardData);
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleCardSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const getRarityColor = (rarity) => {
    const colors = {
      'Common': 'text-gray-600',
      'Uncommon': 'text-green-600',
      'Rare': 'text-blue-600',
      'Rare Holo': 'text-purple-600',
      'Ultra Rare': 'text-yellow-600',
      'Secret Rare': 'text-pink-600',
      'Amazing Rare': 'text-red-600'
    };
    return colors[rarity] || 'text-gray-600';
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}
      </div>
      
      {apiError && (
        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
          Error connecting to Pokemon TCG API. Please try again later.
        </div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-96 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5">
          {suggestions.map((card, index) => (
            <div
              key={card.tcgId}
              className={`flex items-center px-3 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleCardSelect(card)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {card.imageSmall && (
                <img 
                  src={card.imageSmall} 
                  alt={card.name}
                  className="h-16 w-12 object-cover rounded mr-3 flex-shrink-0"
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {card.name}
                  </p>
                  {card.marketPrice && (
                    <span className="ml-2 text-sm font-semibold text-green-600 dark:text-green-400">
                      ${card.marketPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400 truncate">
                    {card.setName}
                  </span>
                  {card.setNumber && (
                    <span className="text-gray-400 dark:text-gray-500">
                      #{card.setNumber}
                    </span>
                  )}
                  {card.rarity && (
                    <span className={`font-medium ${getRarityColor(card.rarity)}`}>
                      {card.rarity}
                    </span>
                  )}
                </div>
                {card.types && card.types.length > 0 && (
                  <div className="flex items-center mt-1 space-x-1">
                    {card.types.map(type => (
                      <span
                        key={type}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      >
                        {type}
                      </span>
                    ))}
                    {card.hp && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        HP: {card.hp}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showSuggestions && searchTerm.length >= 3 && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-800 py-2 px-3 shadow-lg ring-1 ring-black ring-opacity-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No cards found for "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
}