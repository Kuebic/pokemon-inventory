import db from '../db/database.js';

export const tradeService = {
  async createTrade(tradeData) {
    try {
      return await db.transaction('rw', db.trades, db.tradeCards, db.cards, async () => {
        // Calculate trade values
        let myCardsValue = 0;
        let theirCardsValue = 0;
        
        // Process my cards (cards I'm giving)
        if (tradeData.myCards && tradeData.myCards.length > 0) {
          for (const cardInfo of tradeData.myCards) {
            const card = await db.cards.get(cardInfo.cardId);
            if (!card) {
              throw new Error(`Card with ID ${cardInfo.cardId} not found`);
            }
            const value = card.marketPrice || 0;
            myCardsValue += value * (cardInfo.quantity || 1);
          }
        }
        
        // Process their cards (cards I'm receiving) - these would be new cards to add
        if (tradeData.theirCards && tradeData.theirCards.length > 0) {
          for (const cardInfo of tradeData.theirCards) {
            const value = cardInfo.marketPrice || 0;
            theirCardsValue += value * (cardInfo.quantity || 1);
          }
        }
        
        // Create trade record
        const tradeId = await db.trades.add({
          traderName: tradeData.traderName,
          tradeDate: new Date(),
          status: tradeData.status || 'pending',
          myCardsValue,
          theirCardsValue,
          notes: tradeData.notes || ''
        });
        
        // Add trade card records for my cards
        if (tradeData.myCards) {
          for (const cardInfo of tradeData.myCards) {
            await db.tradeCards.add({
              tradeId,
              cardId: cardInfo.cardId,
              direction: 'out',
              quantity: cardInfo.quantity || 1,
              valueAtTrade: (await db.cards.get(cardInfo.cardId)).marketPrice || 0
            });
          }
        }
        
        // Add trade card records for their cards (as placeholders or new cards)
        if (tradeData.theirCards) {
          for (const cardInfo of tradeData.theirCards) {
            // If it's a new card, add it to collection first
            let cardId = cardInfo.cardId;
            if (!cardId && cardInfo.name) {
              cardId = await db.cards.add({
                name: cardInfo.name,
                setName: cardInfo.setName || '',
                setNumber: cardInfo.setNumber || '',
                rarity: cardInfo.rarity || '',
                condition: cardInfo.condition || 'Near Mint',
                marketPrice: cardInfo.marketPrice || 0,
                quantity: cardInfo.quantity || 1,
                isAvailable: true,
                tcgId: cardInfo.tcgId || '',
                imageUrl: cardInfo.imageUrl || '',
                types: cardInfo.types || [],
                hp: cardInfo.hp || '',
                artist: cardInfo.artist || '',
                evolvesFrom: cardInfo.evolvesFrom || '',
                attacks: cardInfo.attacks || [],
                weaknesses: cardInfo.weaknesses || [],
                resistances: cardInfo.resistances || [],
                retreatCost: cardInfo.retreatCost || [],
                supertype: cardInfo.supertype || '',
                subtypes: cardInfo.subtypes || [],
                createdAt: new Date()
              });
            }
            
            // Only add trade card if we have a valid cardId
            if (cardId && cardId !== undefined && cardId !== null) {
              await db.tradeCards.add({
                tradeId,
                cardId,
                direction: 'in',
                quantity: cardInfo.quantity || 1,
                valueAtTrade: cardInfo.marketPrice || 0
              });
            } else {
              console.warn('Skipping card without valid ID:', cardInfo);
            }
          }
        }
        
        return await db.trades.get(tradeId);
      });
    } catch (error) {
      console.error('Failed to create trade:', error);
      throw error;
    }
  },

  async updateTradeStatus(tradeId, status) {
    try {
      return await db.transaction('rw', db.trades, db.tradeCards, db.cards, async () => {
        const trade = await db.trades.get(tradeId);
        if (!trade) {
          throw new Error('Trade not found');
        }
        
        // If completing the trade, update card quantities
        if (status === 'completed' && trade.status !== 'completed') {
          const tradeCards = await db.tradeCards
            .where('tradeId')
            .equals(tradeId)
            .toArray();
          
          for (const tradeCard of tradeCards) {
            if (tradeCard.direction === 'out') {
              // Remove or reduce quantity of cards traded away
              const card = await db.cards.get(tradeCard.cardId);
              if (card) {
                const newQuantity = (card.quantity || 1) - (tradeCard.quantity || 1);
                if (newQuantity <= 0) {
                  await db.cards.delete(tradeCard.cardId);
                } else {
                  await db.cards.update(tradeCard.cardId, { quantity: newQuantity });
                }
              }
            }
          }
        }
        
        await db.trades.update(tradeId, { status });
        return await db.trades.get(tradeId);
      });
    } catch (error) {
      console.error('Failed to update trade status:', error);
      throw error;
    }
  },

  async getTrade(tradeId) {
    try {
      const trade = await db.trades.get(tradeId);
      if (!trade) return null;
      
      return await this.enrichTradeData(trade);
    } catch (error) {
      console.error('Failed to get trade:', error);
      throw error;
    }
  },

  async getAllTrades() {
    try {
      const trades = await db.trades.toArray();
      const enrichedTrades = await Promise.all(
        trades.map(trade => this.enrichTradeData(trade))
      );
      
      // Sort by date, most recent first
      return enrichedTrades.sort((a, b) => 
        new Date(b.tradeDate) - new Date(a.tradeDate)
      );
    } catch (error) {
      console.error('Failed to get all trades:', error);
      throw error;
    }
  },

  async enrichTradeData(trade) {
    const tradeCards = await db.tradeCards
      .where('tradeId')
      .equals(trade.id)
      .toArray();
    
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
      theirCards,
      tradeBalance: trade.theirCardsValue - trade.myCardsValue
    };
  },

  async getTradeHistory(traderName = null) {
    try {
      let trades;
      if (traderName) {
        trades = await db.trades
          .where('traderName')
          .equals(traderName)
          .toArray();
      } else {
        trades = await db.trades.toArray();
      }
      
      const enrichedTrades = await Promise.all(
        trades.map(trade => this.enrichTradeData(trade))
      );
      
      return enrichedTrades.sort((a, b) => 
        new Date(b.tradeDate) - new Date(a.tradeDate)
      );
    } catch (error) {
      console.error('Failed to get trade history:', error);
      throw error;
    }
  },

  async getTradeStats() {
    try {
      const trades = await db.trades.toArray();
      const completedTrades = trades.filter(t => t.status === 'completed');
      const pendingTrades = trades.filter(t => t.status === 'pending');
      const cancelledTrades = trades.filter(t => t.status === 'cancelled');
      
      let totalGiven = 0;
      let totalReceived = 0;
      let profitableTrades = 0;
      let lossTrades = 0;
      
      completedTrades.forEach(trade => {
        totalGiven += trade.myCardsValue || 0;
        totalReceived += trade.theirCardsValue || 0;
        
        const balance = (trade.theirCardsValue || 0) - (trade.myCardsValue || 0);
        if (balance > 0) {
          profitableTrades++;
        } else if (balance < 0) {
          lossTrades++;
        }
      });
      
      const tradersMap = {};
      trades.forEach(trade => {
        if (trade.traderName) {
          tradersMap[trade.traderName] = (tradersMap[trade.traderName] || 0) + 1;
        }
      });
      
      const topTraders = Object.entries(tradersMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      
      return {
        total: trades.length,
        completed: completedTrades.length,
        pending: pendingTrades.length,
        cancelled: cancelledTrades.length,
        totalGiven,
        totalReceived,
        netProfit: totalReceived - totalGiven,
        profitableTrades,
        lossTrades,
        evenTrades: completedTrades.length - profitableTrades - lossTrades,
        topTraders,
        averageTradeValue: completedTrades.length > 0 ? 
          (totalGiven + totalReceived) / (2 * completedTrades.length) : 0
      };
    } catch (error) {
      console.error('Failed to get trade stats:', error);
      throw error;
    }
  },

  async deleteTrade(tradeId) {
    try {
      return await db.transaction('rw', db.trades, db.tradeCards, async () => {
        // Delete associated trade cards first
        await db.tradeCards
          .where('tradeId')
          .equals(tradeId)
          .delete();
        
        // Delete the trade
        await db.trades.delete(tradeId);
      });
    } catch (error) {
      console.error('Failed to delete trade:', error);
      throw error;
    }
  }
};

export default tradeService;