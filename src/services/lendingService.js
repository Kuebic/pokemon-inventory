import db from '../db/database.js';

export const lendingService = {
  async lendCards(cardIds, borrowerInfo, expectedReturnDate) {
    try {
      // Validate inputs
      if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
        throw new Error('No cards selected for lending');
      }
      
      if (!borrowerInfo || !borrowerInfo.name) {
        throw new Error('Borrower name is required');
      }
      
      return await db.transaction('rw', db.cards, db.lending, db.borrowers, async () => {
        // Check if borrower exists or create new
        let borrower = await db.borrowers
          .where('name').equals(borrowerInfo.name)
          .first();
        
        if (!borrower) {
          const borrowerId = await db.borrowers.add({
            name: borrowerInfo.name,
            email: borrowerInfo.email || '',
            phone: borrowerInfo.phone || '',
            createdAt: new Date()
          });
          borrower = await db.borrowers.get(borrowerId);
        }
        
        // Ensure borrower was created/found successfully
        if (!borrower || !borrower.id) {
          throw new Error('Failed to create or find borrower');
        }
        
        const lendingRecords = [];
        
        // Create lending records and update card availability
        for (const cardId of cardIds) {
          const card = await db.cards.get(cardId);
          
          if (!card) {
            throw new Error(`Card with ID ${cardId} not found`);
          }
          
          if (!card.isAvailable) {
            throw new Error(`Card "${card.name}" is not available for lending`);
          }
          
          const lendingId = await db.lending.add({
            cardId,
            borrowerId: borrower.id,
            borrowerName: borrower.name,
            lendDate: new Date(),
            expectedReturnDate: new Date(expectedReturnDate),
            status: 'active'
          });
          
          await db.cards.update(cardId, { 
            isAvailable: false,
            borrowerId: borrower.id 
          });
          
          lendingRecords.push(await db.lending.get(lendingId));
        }
        
        return lendingRecords;
      });
    } catch (error) {
      console.error('Lending transaction failed:', error);
      throw error;
    }
  },

  async returnCards(lendingIds) {
    try {
      return await db.transaction('rw', db.cards, db.lending, async () => {
        const returnedRecords = [];
        
        for (const lendingId of lendingIds) {
          const lending = await db.lending.get(lendingId);
          
          if (!lending) {
            throw new Error(`Lending record ${lendingId} not found`);
          }
          
          if (lending.status === 'returned') {
            continue; // Already returned
          }
          
          await db.lending.update(lendingId, {
            status: 'returned',
            actualReturnDate: new Date()
          });
          
          await db.cards.update(lending.cardId, {
            isAvailable: true,
            borrowerId: null
          });
          
          returnedRecords.push(await db.lending.get(lendingId));
        }
        
        return returnedRecords;
      });
    } catch (error) {
      console.error('Return transaction failed:', error);
      throw error;
    }
  },

  async getActiveLendings() {
    try {
      const lendings = await db.lending
        .where('status')
        .equals('active')
        .toArray();
      
      // Enrich with card and borrower data
      const enrichedLendings = await Promise.all(
        lendings.map(async (lending) => {
          const card = await db.cards.get(lending.cardId);
          const borrower = lending.borrowerId ? 
            await db.borrowers.get(lending.borrowerId) : null;
          
          return {
            ...lending,
            card,
            borrower
          };
        })
      );
      
      return enrichedLendings;
    } catch (error) {
      console.error('Failed to get active lendings:', error);
      throw error;
    }
  },

  async getOverdueItems() {
    try {
      const now = new Date();
      const activeLendings = await db.lending
        .where('status')
        .equals('active')
        .toArray();
      
      const overdueItems = activeLendings.filter(lending => 
        new Date(lending.expectedReturnDate) < now
      );
      
      // Enrich with card and borrower data
      const enrichedOverdue = await Promise.all(
        overdueItems.map(async (lending) => {
          const card = await db.cards.get(lending.cardId);
          const borrower = lending.borrowerId ? 
            await db.borrowers.get(lending.borrowerId) : null;
          
          return {
            ...lending,
            card,
            borrower,
            daysOverdue: Math.floor((now - new Date(lending.expectedReturnDate)) / (1000 * 60 * 60 * 24))
          };
        })
      );
      
      return enrichedOverdue;
    } catch (error) {
      console.error('Failed to get overdue items:', error);
      throw error;
    }
  },

  async getLendingHistory(borrowerId = null) {
    try {
      let query = db.lending.toCollection();
      
      // Only filter by borrowerId if it's a valid ID
      if (borrowerId && borrowerId !== undefined && borrowerId !== null && borrowerId !== '') {
        query = db.lending.where('borrowerId').equals(borrowerId);
      }
      
      const lendings = await query.toArray();
      
      // Enrich with card and borrower data
      const enrichedHistory = await Promise.all(
        lendings.map(async (lending) => {
          const card = await db.cards.get(lending.cardId);
          const borrower = lending.borrowerId ? 
            await db.borrowers.get(lending.borrowerId) : null;
          
          return {
            ...lending,
            card,
            borrower
          };
        })
      );
      
      // Sort by date, most recent first
      return enrichedHistory.sort((a, b) => 
        new Date(b.lendDate) - new Date(a.lendDate)
      );
    } catch (error) {
      console.error('Failed to get lending history:', error);
      throw error;
    }
  },

  async getLendingStats() {
    try {
      const allLendings = await db.lending.toArray();
      const activeLendings = allLendings.filter(l => l.status === 'active');
      const returnedLendings = allLendings.filter(l => l.status === 'returned');
      const overdue = await this.getOverdueItems();
      
      const borrowers = await db.borrowers.toArray();
      const topBorrowers = {};
      
      // Calculate top borrowers
      allLendings.forEach(lending => {
        if (lending.borrowerName) {
          topBorrowers[lending.borrowerName] = (topBorrowers[lending.borrowerName] || 0) + 1;
        }
      });
      
      // Sort borrowers by count
      const sortedBorrowers = Object.entries(topBorrowers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      
      return {
        total: allLendings.length,
        active: activeLendings.length,
        returned: returnedLendings.length,
        overdue: overdue.length,
        totalBorrowers: borrowers.length,
        topBorrowers: sortedBorrowers,
        averageLendingDays: this.calculateAverageLendingDays(returnedLendings)
      };
    } catch (error) {
      console.error('Failed to get lending stats:', error);
      throw error;
    }
  },

  calculateAverageLendingDays(returnedLendings) {
    if (returnedLendings.length === 0) return 0;
    
    const totalDays = returnedLendings.reduce((sum, lending) => {
      if (lending.actualReturnDate) {
        const days = Math.floor(
          (new Date(lending.actualReturnDate) - new Date(lending.lendDate)) / 
          (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }
      return sum;
    }, 0);
    
    return Math.round(totalDays / returnedLendings.length);
  },

  async getAllBorrowers() {
    try {
      return await db.borrowers.toArray();
    } catch (error) {
      console.error('Failed to get borrowers:', error);
      throw error;
    }
  },

  async addBorrower(borrowerInfo) {
    try {
      const id = await db.borrowers.add({
        ...borrowerInfo,
        createdAt: new Date()
      });
      return await db.borrowers.get(id);
    } catch (error) {
      console.error('Failed to add borrower:', error);
      throw error;
    }
  },

  async updateBorrower(id, updates) {
    try {
      await db.borrowers.update(id, updates);
      return await db.borrowers.get(id);
    } catch (error) {
      console.error('Failed to update borrower:', error);
      throw error;
    }
  },

  async deleteBorrower(id) {
    try {
      // Check if borrower has active lendings
      const activeLendings = await db.lending
        .where('borrowerId')
        .equals(id)
        .and(item => item.status === 'active')
        .toArray();
      
      if (activeLendings.length > 0) {
        throw new Error('Cannot delete borrower with active lendings');
      }
      
      await db.borrowers.delete(id);
    } catch (error) {
      console.error('Failed to delete borrower:', error);
      throw error;
    }
  }
};

export default lendingService;