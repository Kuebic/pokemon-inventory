# Pokemon TCG API Integration Guide

## API Configuration

### Base Setup (src/services/pokemonTCGAPI.js)
```javascript
const API_BASE_URL = 'https://api.pokemontcg.io/v2';
// No API key required for basic usage (1000 requests/day)
// Optional: Get free key at https://dev.pokemontcg.io for 20,000 requests/day

const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    // 'X-Api-Key': 'your-api-key-here' // Optional
  }
};

// Rate limiting helper
const rateLimiter = {
  lastRequest: 0,
  minDelay: 2000, // 2 seconds between requests (safe margin)
  
  async throttle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minDelay - timeSinceLastRequest)
      );
    }
    
    this.lastRequest = Date.now();
  }
};
```

### Search Implementation
```javascript
// src/services/pokemonTCGService.js
export const pokemonTCGService = {
  async searchCards(searchTerm) {
    await rateLimiter.throttle();
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/cards?q=name:${encodeURIComponent(searchTerm)}&pageSize=20`,
        API_CONFIG
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformCardData(data.data);
    } catch (error) {
      console.error('Pokemon TCG API error:', error);
      throw error;
    }
  },

  async getCardBySetAndNumber(setCode, number) {
    await rateLimiter.throttle();
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/cards?q=set.id:${setCode} number:${number}`,
        API_CONFIG
      );
      
      const data = await response.json();
      return data.data[0] ? this.transformCardData([data.data[0]])[0] : null;
    } catch (error) {
      console.error('Failed to fetch card:', error);
      return null;
    }
  },

  transformCardData(apiCards) {
    return apiCards.map(card => ({
      tcgId: card.id,
      name: card.name,
      setName: card.set.name,
      setId: card.set.id,
      setSeries: card.set.series,
      setNumber: card.number,
      rarity: card.rarity || 'Common',
      types: card.types || [],
      hp: card.hp || null,
      imageSmall: card.images.small,
      imageLarge: card.images.large,
      marketPrice: card.tcgplayer?.prices?.holofoil?.market || 
                   card.tcgplayer?.prices?.normal?.market || 
                   null,
      releaseDate: card.set.releaseDate
    }));
  }
};
```

### Auto-complete Component
```javascript
// src/components/CardAutoComplete.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { pokemonTCGService } from '../services/pokemonTCGService';
import debounce from 'lodash/debounce';

export function CardAutoComplete({ onCardSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cache, setCache] = useState({});

  const searchCards = useCallback(
    debounce(async (term) => {
      if (term.length < 3) {
        setSuggestions([]);
        return;
      }

      // Check cache first
      if (cache[term]) {
        setSuggestions(cache[term]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await pokemonTCGService.searchCards(term);
        setSuggestions(results);
        
        // Update cache
        setCache(prev => ({
          ...prev,
          [term]: results
        }));
      } catch (error) {
        console.error('Search failed:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [cache]
  );

  useEffect(() => {
    searchCards(searchTerm);
  }, [searchTerm, searchCards]);

  return (
    <div className="card-autocomplete">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search Pokemon cards..."
        className="w-full p-2 border rounded"
      />
      
      {isLoading && <div className="loading">Searching...</div>}
      
      {suggestions.length > 0 && (
        <div className="suggestions-list absolute bg-white border rounded shadow-lg mt-1 max-h-60 overflow-y-auto">
          {suggestions.map(card => (
            <div
              key={card.tcgId}
              className="suggestion-item p-2 hover:bg-gray-100 cursor-pointer flex items-center"
              onClick={() => {
                onCardSelect(card);
                setSearchTerm('');
                setSuggestions([]);
              }}
            >
              <img 
                src={card.imageSmall} 
                alt={card.name}
                className="w-12 h-16 mr-2"
              />
              <div>
                <div className="font-semibold">{card.name}</div>
                <div className="text-sm text-gray-600">
                  {card.setName} - {card.setNumber}
                </div>
                {card.marketPrice && (
                  <div className="text-sm text-green-600">
                    ${card.marketPrice.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Caching Strategy with LocalStorage
```javascript
// src/services/cacheService.js
const CACHE_PREFIX = 'ptcg_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const cacheService = {
  get(key) {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      
      return data;
    } catch (error) {
      return null;
    }
  },

  set(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
    } catch (error) {
      // Handle quota exceeded
      this.clearOldest();
    }
  },

  clearOldest() {
    const cacheKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX));
    
    if (cacheKeys.length === 0) return;
    
    const oldest = cacheKeys.reduce((oldest, key) => {
      try {
        const { timestamp } = JSON.parse(localStorage.getItem(key));
        return !oldest || timestamp < oldest.timestamp 
          ? { key, timestamp } 
          : oldest;
      } catch {
        return oldest;
      }
    }, null);
    
    if (oldest) {
      localStorage.removeItem(oldest.key);
    }
  }
};
```

### Price Fetching Service
```javascript
// src/services/priceService.js
import { cacheService } from './cacheService';

export const priceService = {
  async fetchCardPrice(tcgId) {
    // Check cache first
    const cacheKey = `price_${tcgId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    await rateLimiter.throttle();
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/cards/${tcgId}`,
        API_CONFIG
      );
      
      const data = await response.json();
      const card = data.data;
      
      const priceData = {
        marketPrice: card.tcgplayer?.prices?.holofoil?.market || 
                     card.tcgplayer?.prices?.normal?.market || 
                     null,
        lowPrice: card.tcgplayer?.prices?.holofoil?.low || 
                  card.tcgplayer?.prices?.normal?.low || 
                  null,
        highPrice: card.tcgplayer?.prices?.holofoil?.high || 
                   card.tcgplayer?.prices?.normal?.high || 
                   null,
        updatedAt: new Date().toISOString()
      };
      
      // Cache the result
      cacheService.set(cacheKey, priceData);
      
      return priceData;
    } catch (error) {
      console.error('Failed to fetch price:', error);
      return null;
    }
  },

  async fetchBulkPrices(tcgIds) {
    const prices = {};
    
    // Process in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < tcgIds.length; i += batchSize) {
      const batch = tcgIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (tcgId) => {
          const price = await this.fetchCardPrice(tcgId);
          prices[tcgId] = price;
        })
      );
      
      // Add delay between batches
      if (i + batchSize < tcgIds.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return prices;
  }
};
```

## Response Format Reference

### Card Object Structure
```javascript
{
  "id": "base1-4",
  "name": "Charizard",
  "supertype": "Pokémon",
  "subtypes": ["Stage 2"],
  "hp": "120",
  "types": ["Fire"],
  "evolvesFrom": "Charmeleon",
  "attacks": [
    {
      "name": "Fire Spin",
      "cost": ["Fire", "Fire", "Fire", "Fire"],
      "convertedEnergyCost": 4,
      "damage": "100",
      "text": "Discard 2 Energy cards..."
    }
  ],
  "weaknesses": [
    {
      "type": "Water",
      "value": "×2"
    }
  ],
  "retreatCost": ["Colorless", "Colorless", "Colorless"],
  "convertedRetreatCost": 3,
  "set": {
    "id": "base1",
    "name": "Base",
    "series": "Base",
    "releaseDate": "1999/01/09",
    "totalCards": 102
  },
  "number": "4",
  "rarity": "Rare Holo",
  "images": {
    "small": "https://images.pokemontcg.io/base1/4.png",
    "large": "https://images.pokemontcg.io/base1/4_hires.png"
  },
  "tcgplayer": {
    "prices": {
      "holofoil": {
        "low": 200.0,
        "mid": 350.0,
        "high": 1000.0,
        "market": 400.0
      }
    }
  }
}
```

## Error Handling

```javascript
// src/hooks/usePokemonAPI.js
import { useState, useCallback } from 'react';

export function usePokemonAPI() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAPICall = useCallback(async (apiCall) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      if (error.message.includes('429')) {
        setError('Rate limit exceeded. Please try again later.');
      } else if (error.message.includes('404')) {
        setError('Card not found.');
      } else if (error.message.includes('Network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An error occurred while fetching data.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { handleAPICall, error, isLoading };
}
```

## Important Notes

1. **Rate Limiting**: Without API key: 1000 req/day, 30 req/min. With key: 20,000 req/day
2. **Image URLs**: Always use HTTPS. Small images are ~250x350px, large are ~500x700px
3. **Price Data**: Not all cards have price data. Always check for null values
4. **Search Syntax**: Supports wildcards (*), ranges ([1 TO 10]), and boolean (AND, OR)
5. **Pagination**: Default page size is 250. Use `page` and `pageSize` parameters
6. **Sets**: Over 100 sets available. Cache set list as it rarely changes

## Common Search Queries

```javascript
// All Charizard cards
'name:charizard'

// Specific set
'set.name:"Base Set"'

// Rarity filter
'rarity:"Rare Holo"'

// Type filter
'types:fire'

// Combined filters
'name:pikachu rarity:rare set.series:base'

// Wildcard search
'name:char*'

// Evolution chain
'evolvesFrom:charmeleon OR evolvesTo:charizard'
```