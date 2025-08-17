import Dexie from 'dexie';

export const db = new Dexie('PokemonInventoryDB');

// Version 1: Original schema
db.version(1).stores({
  cards: '++id, name, setName, setNumber, [setName+setNumber], rarity, condition, isAvailable, borrowerId, tcgId',
  lending: '++id, cardId, borrowerName, lendDate, expectedReturnDate, actualReturnDate, status',
  trades: '++id, traderName, tradeDate, status, myCardsValue, theirCardsValue',
  tradeCards: '++id, tradeId, cardId, direction, quantity, valueAtTrade',
  borrowers: '++id, name, email, phone',
  priceHistory: '++id, cardId, marketPrice, timestamp',
  wishlist: '++id, cardName, setName, priority'
});

// Version 2: Add createdAt index to cards table
db.version(2).stores({
  cards: '++id, name, setName, setNumber, [setName+setNumber], rarity, condition, isAvailable, borrowerId, tcgId, createdAt'
}).upgrade(async tx => {
  // Add createdAt to existing cards if they don't have it
  await tx.cards.toCollection().modify(card => {
    if (!card.createdAt) {
      card.createdAt = new Date();
    }
  });
});

// Define table classes
class Card {
  constructor(data) {
    Object.assign(this, data);
    this.isAvailable = data.isAvailable ?? true;
    this.quantity = data.quantity ?? 1;
    this.condition = data.condition ?? 'Near Mint';
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
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

class Borrower {
  constructor(data) {
    Object.assign(this, data);
    this.createdAt = data.createdAt ?? new Date();
  }
}

class PriceHistory {
  constructor(data) {
    Object.assign(this, data);
    this.timestamp = data.timestamp ?? new Date();
  }
}

class WishlistItem {
  constructor(data) {
    Object.assign(this, data);
    this.priority = data.priority ?? 'medium';
    this.createdAt = data.createdAt ?? new Date();
  }
}

db.cards.mapToClass(Card);
db.lending.mapToClass(LendingRecord);
db.trades.mapToClass(Trade);
db.borrowers.mapToClass(Borrower);
db.priceHistory.mapToClass(PriceHistory);
db.wishlist.mapToClass(WishlistItem);

export default db;