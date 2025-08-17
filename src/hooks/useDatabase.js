import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/database.js';
import { lendingService } from '../services/lendingService.js';

// Hook for cards
export function useCards(filter = {}) {
  return useLiveQuery(
    async () => {
      let cards;
      
      // Use indexed fields for initial query when possible
      if (filter.setName) {
        cards = await db.cards.where('setName').equals(filter.setName).toArray();
      } else if (filter.rarity) {
        cards = await db.cards.where('rarity').equals(filter.rarity).toArray();
      } else if (filter.condition) {
        cards = await db.cards.where('condition').equals(filter.condition).toArray();
      } else {
        // Get all cards if no indexed filter is provided
        cards = await db.cards.toArray();
      }
      
      // Apply non-indexed filters in memory
      if (filter.isAvailable !== undefined) {
        cards = cards.filter(card => card.isAvailable === filter.isAvailable);
      }
      
      // Apply additional filters if multiple criteria provided
      if (filter.setName && (filter.rarity || filter.condition)) {
        if (filter.rarity) {
          cards = cards.filter(card => card.rarity === filter.rarity);
        }
        if (filter.condition) {
          cards = cards.filter(card => card.condition === filter.condition);
        }
      }
      
      // Apply search filter if provided
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        cards = cards.filter(card => 
          card.name?.toLowerCase().includes(searchLower) ||
          card.setName?.toLowerCase().includes(searchLower) ||
          card.setNumber?.toLowerCase().includes(searchLower)
        );
      }
      
      return cards;
    },
    [filter.isAvailable, filter.setName, filter.rarity, filter.condition, filter.searchTerm]
  );
}

// Hook for a single card
export function useCard(cardId) {
  return useLiveQuery(
    async () => {
      // Guard against invalid cardId values
      if (!cardId || cardId === undefined || cardId === null || cardId === '') {
        return null;
      }
      return await db.cards.get(cardId);
    },
    [cardId]
  );
}

// Hook for lending records
export function useLending() {
  const activeLendings = useLiveQuery(
    () => lendingService.getActiveLendings()
  );
  
  const overdueItems = useLiveQuery(
    () => lendingService.getOverdueItems()
  );
  
  return { activeLendings, overdueItems };
}

// Hook for lending history
export function useLendingHistory(borrowerId = null) {
  return useLiveQuery(
    () => {
      // Only call service if borrowerId is valid or explicitly null (for all history)
      if (borrowerId === undefined || borrowerId === '') {
        return [];
      }
      return lendingService.getLendingHistory(borrowerId);
    },
    [borrowerId]
  );
}

// Hook for trades
export function useTrades() {
  return useLiveQuery(
    () => db.trades.toArray()
  );
}

// Hook for a single trade
export function useTrade(tradeId) {
  return useLiveQuery(
    async () => {
      // Guard against invalid tradeId values
      if (!tradeId || tradeId === undefined || tradeId === null || tradeId === '') {
        return null;
      }
      
      const trade = await db.trades.get(tradeId);
      if (!trade) return null;
      
      // Only query tradeCards if we have a valid tradeId
      const tradeCards = tradeId ? await db.tradeCards
        .where('tradeId')
        .equals(tradeId)
        .toArray() : [];
      
      const myCards = [];
      const theirCards = [];
      
      for (const tradeCard of tradeCards) {
        const card = await db.cards.get(tradeCard.cardId);
        const enrichedCard = {
          ...tradeCard,
          card
        };
        
        if (tradeCard.direction === 'out') {
          myCards.push(enrichedCard);
        } else {
          theirCards.push(enrichedCard);
        }
      }
      
      return {
        ...trade,
        myCards,
        theirCards
      };
    },
    [tradeId]
  );
}

// Hook for borrowers
export function useBorrowers() {
  return useLiveQuery(
    () => db.borrowers.toArray()
  );
}

// Hook for wishlist
export function useWishlist() {
  return useLiveQuery(
    () => db.wishlist.orderBy('priority').toArray()
  );
}

// Hook for collection statistics
export function useCollectionStats() {
  return useLiveQuery(
    async () => {
      const cards = await db.cards.toArray();
      const activeLendings = await db.lending
        .where('status')
        .equals('active')
        .toArray();
      
      const stats = {
        totalCards: cards.length,
        totalQuantity: cards.reduce((sum, card) => sum + (card.quantity || 1), 0),
        availableCards: cards.filter(c => c.isAvailable).length,
        lentCards: activeLendings.length,
        totalValue: cards.reduce((sum, card) => 
          sum + ((card.marketPrice || 0) * (card.quantity || 1)), 0
        ),
        uniqueSets: [...new Set(cards.map(c => c.setName).filter(Boolean))].length,
        byRarity: {},
        byCondition: {},
        bySet: {}
      };
      
      // Group cards by various attributes
      cards.forEach(card => {
        // By rarity
        if (card.rarity) {
          stats.byRarity[card.rarity] = (stats.byRarity[card.rarity] || 0) + 1;
        }
        
        // By condition
        if (card.condition) {
          stats.byCondition[card.condition] = (stats.byCondition[card.condition] || 0) + 1;
        }
        
        // By set
        if (card.setName) {
          stats.bySet[card.setName] = (stats.bySet[card.setName] || 0) + 1;
        }
      });
      
      return stats;
    }
  );
}

// Hook for price history
export function usePriceHistory(cardId) {
  return useLiveQuery(
    async () => {
      // Guard against invalid cardId values
      if (!cardId || cardId === undefined || cardId === null || cardId === '') {
        return [];
      }
      return await db.priceHistory
        .where('cardId')
        .equals(cardId)
        .toArray();
    },
    [cardId]
  );
}

// Hook for recent activity
export function useRecentActivity(limit = 10) {
  return useLiveQuery(
    async () => {
      const recentCards = await db.cards
        .orderBy('createdAt')
        .reverse()
        .limit(limit / 2)
        .toArray();
      
      const recentLendings = await db.lending
        .orderBy('lendDate')
        .reverse()
        .limit(limit / 2)
        .toArray();
      
      const activities = [];
      
      recentCards.forEach(card => {
        activities.push({
          type: 'card_added',
          date: card.createdAt,
          description: `Added ${card.name}`,
          data: card
        });
      });
      
      for (const lending of recentLendings) {
        const card = await db.cards.get(lending.cardId);
        activities.push({
          type: lending.status === 'active' ? 'card_lent' : 'card_returned',
          date: lending.status === 'active' ? lending.lendDate : lending.actualReturnDate,
          description: lending.status === 'active' 
            ? `Lent ${card?.name || 'card'} to ${lending.borrowerName}`
            : `${card?.name || 'card'} returned by ${lending.borrowerName}`,
          data: { lending, card }
        });
      }
      
      // Sort by date and return top N
      return activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    },
    [limit]
  );
}