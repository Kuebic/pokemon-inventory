# Dexie.js IndexedDB Setup Guide for Pokemon Inventory

## Essential Implementation Guide

### Installation
```bash
npm install dexie@4.0.11
npm install dexie-react-hooks@1.1.7
```

### Database Schema Setup (src/db/database.js)
```javascript
import Dexie from 'dexie';

export const db = new Dexie('PokemonInventoryDB');

db.version(1).stores({
  cards: '++id, name, setName, setNumber, [setName+setNumber], rarity, condition, isAvailable, borrowerId',
  lending: '++id, cardId, borrowerName, lendDate, expectedReturnDate, actualReturnDate, status',
  trades: '++id, traderName, tradeDate, status, myCardsValue, theirCardsValue',
  tradeCards: '++id, tradeId, cardId, direction, quantity, valueAtTrade',
  borrowers: '++id, name, email, phone',
  priceHistory: '++id, cardId, marketPrice, timestamp',
  wishlist: '++id, cardName, setName, priority'
});

// Define table classes
db.cards.mapToClass(Card);
db.lending.mapToClass(LendingRecord);
db.trades.mapToClass(Trade);

class Card {
  constructor(data) {
    Object.assign(this, data);
    this.isAvailable = data.isAvailable ?? true;
    this.quantity = data.quantity ?? 1;
    this.createdAt = data.createdAt ?? new Date();
  }
}

class LendingRecord {
  constructor(data) {
    Object.assign(this, data);
    this.status = data.status ?? 'active';
    this.lendDate = data.lendDate ?? new Date();
  }
}

class Trade {
  constructor(data) {
    Object.assign(this, data);
    this.status = data.status ?? 'pending';
    this.tradeDate = data.tradeDate ?? new Date();
  }
}

export default db;
```

### React Hook Usage (Custom Hook)
```javascript
// src/hooks/useDatabase.js
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/database';

export function useCards(filter = {}) {
  return useLiveQuery(
    async () => {
      let query = db.cards.toCollection();
      
      if (filter.isAvailable !== undefined) {
        query = db.cards.where('isAvailable').equals(filter.isAvailable);
      }
      
      if (filter.setName) {
        query = db.cards.where('setName').equals(filter.setName);
      }
      
      return await query.toArray();
    },
    [filter]
  );
}

export function useLending() {
  const activeLendings = useLiveQuery(
    () => db.lending.where('status').equals('active').toArray()
  );
  
  const overdueItems = useLiveQuery(
    () => db.lending
      .where('expectedReturnDate')
      .below(new Date())
      .and(item => item.status === 'active')
      .toArray()
  );
  
  return { activeLendings, overdueItems };
}
```

### CRUD Operations Service
```javascript
// src/services/cardService.js
import db from '../db/database';

export const cardService = {
  async addCard(cardData) {
    try {
      const id = await db.cards.add(cardData);
      return await db.cards.get(id);
    } catch (error) {
      console.error('Failed to add card:', error);
      throw error;
    }
  },

  async updateCard(id, updates) {
    try {
      await db.cards.update(id, updates);
      return await db.cards.get(id);
    } catch (error) {
      console.error('Failed to update card:', error);
      throw error;
    }
  },

  async deleteCard(id) {
    try {
      await db.cards.delete(id);
    } catch (error) {
      console.error('Failed to delete card:', error);
      throw error;
    }
  },

  async searchCards(searchTerm) {
    return await db.cards
      .where('name')
      .startsWithIgnoreCase(searchTerm)
      .or('setName')
      .startsWithIgnoreCase(searchTerm)
      .toArray();
  }
};
```

### Transaction Pattern for Complex Operations
```javascript
// src/services/lendingService.js
import db from '../db/database';

export const lendingService = {
  async lendCards(cardIds, borrowerInfo, expectedReturnDate) {
    try {
      await db.transaction('rw', db.cards, db.lending, db.borrowers, async () => {
        // Check if borrower exists or create new
        let borrower = await db.borrowers
          .where('name').equals(borrowerInfo.name)
          .first();
        
        if (!borrower) {
          const borrowerId = await db.borrowers.add(borrowerInfo);
          borrower = await db.borrowers.get(borrowerId);
        }
        
        // Create lending records and update card availability
        for (const cardId of cardIds) {
          const card = await db.cards.get(cardId);
          
          if (!card.isAvailable) {
            throw new Error(`Card ${card.name} is not available for lending`);
          }
          
          await db.lending.add({
            cardId,
            borrowerId: borrower.id,
            borrowerName: borrower.name,
            expectedReturnDate,
            status: 'active'
          });
          
          await db.cards.update(cardId, { 
            isAvailable: false,
            borrowerId: borrower.id 
          });
        }
      });
    } catch (error) {
      console.error('Lending transaction failed:', error);
      throw error;
    }
  },

  async returnCards(lendingIds) {
    try {
      await db.transaction('rw', db.cards, db.lending, async () => {
        for (const lendingId of lendingIds) {
          const lending = await db.lending.get(lendingId);
          
          await db.lending.update(lendingId, {
            status: 'returned',
            actualReturnDate: new Date()
          });
          
          await db.cards.update(lending.cardId, {
            isAvailable: true,
            borrowerId: null
          });
        }
      });
    } catch (error) {
      console.error('Return transaction failed:', error);
      throw error;
    }
  }
};
```

## Critical Implementation Notes

### 1. Database Initialization
- Database is created automatically on first access
- Schema changes require version increment
- Always use transactions for multi-table operations

### 2. React Integration Best Practices
- Use `useLiveQuery` for reactive data binding
- Include dependencies array in useLiveQuery
- Handle loading states (useLiveQuery returns undefined initially)

### 3. Error Handling Pattern
```javascript
const [error, setError] = useState(null);
const [loading, setLoading] = useState(false);

const performOperation = async () => {
  setLoading(true);
  setError(null);
  try {
    await db.transaction('rw', db.cards, async () => {
      // operations
    });
  } catch (error) {
    setError(error.message);
    // Don't re-throw in UI components
  } finally {
    setLoading(false);
  }
};
```

### 4. Performance Optimization
- Use compound indexes for frequent queries: `[setName+setNumber]`
- Limit query results with `.limit(n)`
- Use `.offset(n)` for pagination
- Cache frequently accessed data in React state

### 5. Migration Strategy
```javascript
// Future schema changes
db.version(2).stores({
  cards: '++id, name, setName, setNumber, [setName+setNumber], rarity, condition, isAvailable, borrowerId, tcgPlayerId'
}).upgrade(trans => {
  return trans.cards.toCollection().modify(card => {
    card.tcgPlayerId = null; // Add new field with default
  });
});
```

## Common Pitfalls to Avoid

1. **Don't use async/await inside transactions without returning the promise**
2. **Don't access external APIs inside transactions**
3. **Always check if data exists before updating**
4. **Remember that useLiveQuery returns undefined on first render**
5. **Don't forget to handle browser IndexedDB storage limits (usually 50% of free disk)**

## Browser Compatibility
- Works in all modern browsers
- Private/Incognito mode may have storage restrictions
- Safari has lower storage limits than Chrome/Firefox
- Use feature detection: `if (!window.indexedDB) { /* fallback */ }`