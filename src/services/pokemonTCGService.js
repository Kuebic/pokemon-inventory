import { cacheService } from './cacheService.js';
import { mockPokemonCards, searchMockCards } from './mockPokemonData.js';

const API_BASE_URL = 'https://api.pokemontcg.io/v2';
// Using API key from environment for 20,000 requests/day
const API_KEY = import.meta.env.VITE_POKEMONTCG_API;

const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'X-Api-Key': API_KEY }) // Add API key if available
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

export const pokemonTCGService = {
  async searchCards(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      return { cards: [], isMockData: false };
    }

    // Normalize search term for consistency
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    // Check cache first
    const cached = cacheService.getCachedCardSearch(normalizedSearch);
    if (cached) {
      console.log(`Returning ${cached.length} cached results for "${searchTerm}"`);
      return { cards: cached, isMockData: false };
    }

    await rateLimiter.throttle();
    
    try {
      // Use wildcard search to find all cards containing the search term
      // The API supports wildcards (*) for partial matching
      const searchQuery = `name:${normalizedSearch}*`;
      const response = await fetch(
        `${API_BASE_URL}/cards?q=${encodeURIComponent(searchQuery)}&pageSize=250&orderBy=set.releaseDate`,
        API_CONFIG
      );
      
      if (!response.ok) {
        // Check specific error types
        if (response.status === 403) {
          throw new Error(`API Key issue: Please check your Pokemon TCG API key`);
        } else if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Please wait a moment and try again.`);
        } else if (response.status >= 500) {
          throw new Error(`Pokemon TCG API server error (${response.status}). The service may be temporarily unavailable.`);
        } else {
          throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      
      // Check if we actually got results
      if (!data.data || data.data.length === 0) {
        return { cards: [], isMockData: false, message: `No cards found for "${searchTerm}"` };
      }
      
      const transformedData = this.transformCardData(data.data);
      
      console.log(`Found ${transformedData.length} cards for "${searchTerm}"`);
      
      // Cache the results with normalized key for consistency
      cacheService.cacheCardSearch(normalizedSearch, transformedData);
      
      return { cards: transformedData, isMockData: false };
    } catch (error) {
      console.error('Pokemon TCG API error:', error);
      
      // Only use mock data if explicitly requested or for network errors
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.warn('Network error detected. The Pokemon TCG API may be unreachable.');
        // For network errors, we could optionally return mock data with a warning
        // But let's prefer to show the actual error to the user
        throw new Error('Unable to connect to Pokemon TCG API. Please check your internet connection.');
      }
      
      // Re-throw the error so the UI can handle it appropriately
      throw error;
    }
  },

  async getCardById(cardId) {
    // Check cache first
    const cached = cacheService.getCachedApiResponse(`card_${cardId}`);
    if (cached) {
      return cached;
    }

    await rateLimiter.throttle();
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/cards/${cardId}`,
        API_CONFIG
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      const transformedCard = this.transformCardData([data.data])[0];
      
      // Cache the result
      cacheService.cacheApiResponse(`card_${cardId}`, transformedCard);
      
      return transformedCard;
    } catch (error) {
      console.error('Failed to fetch card:', error);
      return null;
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

  async getSets() {
    // Check cache first
    const cached = cacheService.getCachedApiResponse('sets');
    if (cached) {
      return cached;
    }

    await rateLimiter.throttle();
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/sets?orderBy=releaseDate`,
        API_CONFIG
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache for 7 days (sets don't change often)
      cacheService.set('api_sets', data.data, 7 * 24 * 60 * 60 * 1000);
      
      return data.data;
    } catch (error) {
      console.error('Failed to fetch sets:', error);
      return [];
    }
  },

  transformCardData(apiCards) {
    if (!apiCards || !Array.isArray(apiCards)) {
      return [];
    }

    return apiCards.map(card => ({
      tcgId: card.id,
      name: card.name,
      setName: card.set?.name || '',
      setId: card.set?.id || '',
      setSeries: card.set?.series || '',
      setNumber: card.number || '',
      rarity: card.rarity || 'Common',
      types: card.types || [],
      hp: card.hp || null,
      imageSmall: card.images?.small || '',
      imageLarge: card.images?.large || '',
      imageUrl: card.images?.large || card.images?.small || '',
      marketPrice: this.extractMarketPrice(card),
      releaseDate: card.set?.releaseDate || null,
      artist: card.artist || '',
      evolvesFrom: card.evolvesFrom || null,
      evolvesTo: card.evolvesTo || [],
      attacks: card.attacks || [],
      weaknesses: card.weaknesses || [],
      resistances: card.resistances || [],
      retreatCost: card.retreatCost || [],
      convertedRetreatCost: card.convertedRetreatCost || 0,
      supertype: card.supertype || '',
      subtypes: card.subtypes || [],
      rules: card.rules || [],
      abilities: card.abilities || []
    }));
  },

  extractMarketPrice(card) {
    if (!card.tcgplayer?.prices) {
      return null;
    }

    const prices = card.tcgplayer.prices;
    
    // Priority order for price extraction
    const priceTypes = [
      'holofoil',
      '1stEditionHolofoil',
      'normal',
      '1stEditionNormal',
      'reverseHolofoil',
      'unlimitedHolofoil'
    ];

    for (const type of priceTypes) {
      if (prices[type]?.market) {
        return prices[type].market;
      }
    }

    // If no market price, try to get any available price
    for (const type of priceTypes) {
      if (prices[type]?.mid) {
        return prices[type].mid;
      }
    }

    return null;
  },

  // Advanced search with filters
  async advancedSearch(params) {
    const {
      name,
      set,
      types,
      supertype,
      subtype,
      rarity,
      artist,
      pageSize = 20,
      page = 1
    } = params;

    let query = '';
    const queryParts = [];

    if (name) queryParts.push(`name:"${name}*"`);
    if (set) queryParts.push(`set.name:"${set}"`);
    if (types) queryParts.push(`types:${types}`);
    if (supertype) queryParts.push(`supertype:${supertype}`);
    if (subtype) queryParts.push(`subtypes:${subtype}`);
    if (rarity) queryParts.push(`rarity:"${rarity}"`);
    if (artist) queryParts.push(`artist:"${artist}"`);

    query = queryParts.join(' ');

    await rateLimiter.throttle();

    try {
      const response = await fetch(
        `${API_BASE_URL}/cards?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`,
        API_CONFIG
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        cards: this.transformCardData(data.data),
        page: data.page,
        pageSize: data.pageSize,
        count: data.count,
        totalCount: data.totalCount
      };
    } catch (error) {
      console.error('Advanced search error:', error);
      throw error;
    }
  },

  // Get all rarities available
  async getRarities() {
    const cached = cacheService.getCachedApiResponse('rarities');
    if (cached) {
      return cached;
    }

    await rateLimiter.throttle();

    try {
      const response = await fetch(
        `${API_BASE_URL}/rarities`,
        API_CONFIG
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache for 30 days
      cacheService.set('api_rarities', data.data, 30 * 24 * 60 * 60 * 1000);
      
      return data.data;
    } catch (error) {
      console.error('Failed to fetch rarities:', error);
      return [];
    }
  },

  // Get all types available
  async getTypes() {
    const cached = cacheService.getCachedApiResponse('types');
    if (cached) {
      return cached;
    }

    await rateLimiter.throttle();

    try {
      const response = await fetch(
        `${API_BASE_URL}/types`,
        API_CONFIG
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache for 30 days
      cacheService.set('api_types', data.data, 30 * 24 * 60 * 60 * 1000);
      
      return data.data;
    } catch (error) {
      console.error('Failed to fetch types:', error);
      return [];
    }
  }
};

export default pokemonTCGService;