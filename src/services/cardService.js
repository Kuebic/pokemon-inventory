import db from '../db/database.js';

export const cardService = {
  async addCard(cardData) {
    try {
      const id = await db.cards.add({
        ...cardData,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return await db.cards.get(id);
    } catch (error) {
      console.error('Failed to add card:', error);
      throw error;
    }
  },

  async updateCard(id, updates) {
    try {
      await db.cards.update(id, {
        ...updates,
        updatedAt: new Date()
      });
      return await db.cards.get(id);
    } catch (error) {
      console.error('Failed to update card:', error);
      throw error;
    }
  },

  async deleteCard(id) {
    try {
      // Check if card is currently lent
      const lending = await db.lending
        .where('cardId')
        .equals(id)
        .and(item => item.status === 'active')
        .first();
      
      if (lending) {
        throw new Error('Cannot delete card that is currently lent out');
      }
      
      await db.cards.delete(id);
    } catch (error) {
      console.error('Failed to delete card:', error);
      throw error;
    }
  },

  async getCard(id) {
    try {
      return await db.cards.get(id);
    } catch (error) {
      console.error('Failed to get card:', error);
      throw error;
    }
  },

  async getAllCards() {
    try {
      return await db.cards.toArray();
    } catch (error) {
      console.error('Failed to get all cards:', error);
      throw error;
    }
  },

  async searchCards(searchTerm) {
    try {
      if (!searchTerm) {
        return await this.getAllCards();
      }
      
      return await db.cards
        .where('name')
        .startsWithIgnoreCase(searchTerm)
        .or('setName')
        .startsWithIgnoreCase(searchTerm)
        .toArray();
    } catch (error) {
      console.error('Failed to search cards:', error);
      throw error;
    }
  },

  async getAvailableCards() {
    try {
      return await db.cards
        .where('isAvailable')
        .equals(true)
        .toArray();
    } catch (error) {
      console.error('Failed to get available cards:', error);
      throw error;
    }
  },

  async getCardsBySet(setName) {
    try {
      return await db.cards
        .where('setName')
        .equals(setName)
        .toArray();
    } catch (error) {
      console.error('Failed to get cards by set:', error);
      throw error;
    }
  },

  async getCardsByCondition(condition) {
    try {
      return await db.cards
        .where('condition')
        .equals(condition)
        .toArray();
    } catch (error) {
      console.error('Failed to get cards by condition:', error);
      throw error;
    }
  },

  async getCardsByRarity(rarity) {
    try {
      return await db.cards
        .where('rarity')
        .equals(rarity)
        .toArray();
    } catch (error) {
      console.error('Failed to get cards by rarity:', error);
      throw error;
    }
  },

  async getTotalValue() {
    try {
      const cards = await db.cards.toArray();
      return cards.reduce((total, card) => {
        return total + ((card.marketPrice || 0) * (card.quantity || 1));
      }, 0);
    } catch (error) {
      console.error('Failed to calculate total value:', error);
      throw error;
    }
  },

  async getCardStats() {
    try {
      const cards = await db.cards.toArray();
      const stats = {
        total: cards.length,
        available: cards.filter(c => c.isAvailable).length,
        lent: cards.filter(c => !c.isAvailable).length,
        totalValue: 0,
        bySet: {},
        byRarity: {},
        byCondition: {}
      };

      cards.forEach(card => {
        // Calculate total value
        stats.totalValue += (card.marketPrice || 0) * (card.quantity || 1);
        
        // Group by set
        if (card.setName) {
          stats.bySet[card.setName] = (stats.bySet[card.setName] || 0) + 1;
        }
        
        // Group by rarity
        if (card.rarity) {
          stats.byRarity[card.rarity] = (stats.byRarity[card.rarity] || 0) + 1;
        }
        
        // Group by condition
        if (card.condition) {
          stats.byCondition[card.condition] = (stats.byCondition[card.condition] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Failed to get card stats:', error);
      throw error;
    }
  }
};

export default cardService;