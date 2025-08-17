const CACHE_PREFIX = 'ptcg_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const cacheService = {
  get(key) {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache has expired
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  set(key, data, customDuration = null) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        expiry: customDuration || CACHE_DURATION
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache set error:', error);
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError') {
        this.clearOldest();
        // Try again
        try {
          localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
        } catch (retryError) {
          console.error('Cache retry failed:', retryError);
        }
      }
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  },

  clearOldest() {
    const cacheKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX));
    
    if (cacheKeys.length === 0) return;
    
    // Find the oldest cache entry
    const oldest = cacheKeys.reduce((oldest, key) => {
      try {
        const { timestamp } = JSON.parse(localStorage.getItem(key));
        return !oldest || timestamp < oldest.timestamp 
          ? { key, timestamp } 
          : oldest;
      } catch {
        // If parsing fails, consider this key for removal
        return { key, timestamp: 0 };
      }
    }, null);
    
    if (oldest) {
      localStorage.removeItem(oldest.key);
    }
  },

  clearAll() {
    const cacheKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX));
    
    cacheKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Failed to clear cache key:', key, error);
      }
    });
  },

  clearExpired() {
    const cacheKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX));
    
    const now = Date.now();
    cacheKeys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { timestamp, expiry = CACHE_DURATION } = JSON.parse(cached);
          if (now - timestamp > expiry) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        // If we can't parse it, remove it
        localStorage.removeItem(key);
      }
    });
  },

  getCacheSize() {
    const cacheKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX));
    
    let totalSize = 0;
    cacheKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        // Rough estimate of size in bytes
        totalSize += key.length + value.length;
      }
    });
    
    return {
      keys: cacheKeys.length,
      sizeInBytes: totalSize,
      sizeInKB: (totalSize / 1024).toFixed(2),
      sizeInMB: (totalSize / (1024 * 1024)).toFixed(2)
    };
  },

  // Specific cache methods for different data types
  cacheCardSearch(searchTerm, results) {
    this.set(`search_${searchTerm.toLowerCase()}`, results, 60 * 60 * 1000); // 1 hour cache
  },

  getCachedCardSearch(searchTerm) {
    return this.get(`search_${searchTerm.toLowerCase()}`);
  },

  cacheCardPrice(cardId, priceData) {
    this.set(`price_${cardId}`, priceData, 4 * 60 * 60 * 1000); // 4 hours cache for prices
  },

  getCachedCardPrice(cardId) {
    return this.get(`price_${cardId}`);
  },

  cacheApiResponse(endpoint, data) {
    this.set(`api_${endpoint}`, data);
  },

  getCachedApiResponse(endpoint) {
    return this.get(`api_${endpoint}`);
  }
};

export default cacheService;