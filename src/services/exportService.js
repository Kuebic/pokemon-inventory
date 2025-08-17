import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import JSZip from 'jszip';
import db from '../db/database.js';
import { cardService } from './cardService.js';
import { lendingService } from './lendingService.js';
import { tradeService } from './tradeService.js';
import { pokemonTCGService } from './pokemonTCGService.js';

export const exportService = {
  async exportToCSV(type = 'cards') {
    let data = [];
    let filename = '';

    switch (type) {
      case 'cards':
        data = await this.prepareCardsForCSV();
        filename = `pokemon-collection-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'lending':
        data = await this.prepareLendingForCSV();
        filename = `pokemon-lending-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'trades':
        data = await this.prepareTradesForCSV();
        filename = `pokemon-trades-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      default:
        throw new Error('Invalid export type');
    }

    const csv = Papa.unparse(data);
    this.downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  },

  async exportToPDF(type = 'cards') {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    
    // Add header
    doc.setFontSize(20);
    doc.text('Pokemon Card Inventory', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${date}`, 14, 28);
    
    switch (type) {
      case 'cards':
        await this.generateCardsPDF(doc);
        doc.save(`pokemon-collection-${new Date().toISOString().split('T')[0]}.pdf`);
        break;
      case 'lending':
        await this.generateLendingPDF(doc);
        doc.save(`pokemon-lending-${new Date().toISOString().split('T')[0]}.pdf`);
        break;
      case 'trades':
        await this.generateTradesPDF(doc);
        doc.save(`pokemon-trades-${new Date().toISOString().split('T')[0]}.pdf`);
        break;
      case 'full':
        await this.generateFullReportPDF(doc);
        doc.save(`pokemon-full-report-${new Date().toISOString().split('T')[0]}.pdf`);
        break;
      default:
        throw new Error('Invalid export type');
    }
  },

  async prepareCardsForCSV() {
    const cards = await db.cards.toArray();
    return cards.map(card => ({
      'Name': card.name,
      'Set': card.setName,
      'Number': card.setNumber,
      'Rarity': card.rarity,
      'Condition': card.condition,
      'Quantity': card.quantity,
      'Market Price': card.marketPrice || '',
      'Total Value': (card.marketPrice || 0) * (card.quantity || 1),
      'Status': card.isAvailable ? 'Available' : 'Lent Out',
      'TCG ID': card.tcgId || '',
      'Image URL': card.imageUrl || '',
      'Date Added': new Date(card.createdAt).toLocaleDateString()
    }));
  },

  async prepareLendingForCSV() {
    const lendings = await db.lending.toArray();
    const enrichedLendings = await Promise.all(
      lendings.map(async (lending) => {
        const card = await db.cards.get(lending.cardId);
        const borrower = lending.borrowerId ? 
          await db.borrowers.get(lending.borrowerId) : null;
        
        return {
          'Card Name': card?.name || 'Unknown',
          'Borrower': lending.borrowerName,
          'Email': borrower?.email || '',
          'Phone': borrower?.phone || '',
          'Lend Date': new Date(lending.lendDate).toLocaleDateString(),
          'Expected Return': new Date(lending.expectedReturnDate).toLocaleDateString(),
          'Actual Return': lending.actualReturnDate ? 
            new Date(lending.actualReturnDate).toLocaleDateString() : '',
          'Status': lending.status,
          'Days Lent': Math.floor((
            (lending.actualReturnDate || new Date()) - new Date(lending.lendDate)
          ) / (1000 * 60 * 60 * 24))
        };
      })
    );
    return enrichedLendings;
  },

  async prepareTradesForCSV() {
    const trades = await db.trades.toArray();
    return trades.map(trade => ({
      'Date': new Date(trade.tradeDate).toLocaleDateString(),
      'Trader': trade.traderName,
      'My Cards Value': trade.myCardsValue || 0,
      'Their Cards Value': trade.theirCardsValue || 0,
      'Balance': (trade.theirCardsValue || 0) - (trade.myCardsValue || 0),
      'Status': trade.status,
      'Notes': trade.notes || ''
    }));
  },

  async generateCardsPDF(doc) {
    const cards = await db.cards.toArray();
    const stats = await cardService.getCardStats();
    
    // Add summary
    doc.setFontSize(12);
    doc.text('Collection Summary', 14, 40);
    doc.setFontSize(10);
    doc.text(`Total Cards: ${stats.total}`, 14, 48);
    doc.text(`Total Value: $${stats.totalValue.toFixed(2)}`, 14, 54);
    doc.text(`Available: ${stats.available} | Lent: ${stats.lent}`, 14, 60);
    
    // Add cards table
    const tableData = cards.map(card => [
      card.name,
      card.setName || '',
      card.setNumber || '',
      card.rarity || '',
      card.condition || '',
      card.quantity || 1,
      card.marketPrice ? `$${card.marketPrice.toFixed(2)}` : '',
      card.isAvailable ? 'Yes' : 'No'
    ]);
    
    doc.autoTable({
      head: [['Name', 'Set', '#', 'Rarity', 'Condition', 'Qty', 'Price', 'Available']],
      body: tableData,
      startY: 70,
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 70 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 35 },
        2: { cellWidth: 15 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 15 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 }
      }
    });
  },

  async generateLendingPDF(doc) {
    const lendings = await lendingService.getActiveLendings();
    const stats = await lendingService.getLendingStats();
    
    // Add summary
    doc.setFontSize(12);
    doc.text('Lending Summary', 14, 40);
    doc.setFontSize(10);
    doc.text(`Active Lendings: ${stats.active}`, 14, 48);
    doc.text(`Total Returned: ${stats.returned}`, 14, 54);
    doc.text(`Overdue: ${stats.overdue}`, 14, 60);
    
    // Add lending table
    const tableData = lendings.map(lending => [
      lending.card?.name || 'Unknown',
      lending.borrowerName,
      new Date(lending.lendDate).toLocaleDateString(),
      new Date(lending.expectedReturnDate).toLocaleDateString(),
      lending.status
    ]);
    
    doc.autoTable({
      head: [['Card', 'Borrower', 'Lend Date', 'Expected Return', 'Status']],
      body: tableData,
      startY: 70,
      headStyles: { fillColor: [59, 130, 246] }
    });
  },

  async generateTradesPDF(doc) {
    const trades = await db.trades.toArray();
    const stats = await tradeService.getTradeStats();
    
    // Add summary
    doc.setFontSize(12);
    doc.text('Trade Summary', 14, 40);
    doc.setFontSize(10);
    doc.text(`Total Trades: ${stats.total}`, 14, 48);
    doc.text(`Net Profit: $${stats.netProfit.toFixed(2)}`, 14, 54);
    doc.text(`Completed: ${stats.completed} | Pending: ${stats.pending}`, 14, 60);
    
    // Add trades table
    const tableData = trades.map(trade => [
      new Date(trade.tradeDate).toLocaleDateString(),
      trade.traderName,
      trade.myCardsValue ? `$${trade.myCardsValue.toFixed(2)}` : '$0.00',
      trade.theirCardsValue ? `$${trade.theirCardsValue.toFixed(2)}` : '$0.00',
      `$${((trade.theirCardsValue || 0) - (trade.myCardsValue || 0)).toFixed(2)}`,
      trade.status
    ]);
    
    doc.autoTable({
      head: [['Date', 'Trader', 'Given', 'Received', 'Balance', 'Status']],
      body: tableData,
      startY: 70,
      headStyles: { fillColor: [59, 130, 246] }
    });
  },

  async generateFullReportPDF(doc) {
    const stats = await cardService.getCardStats();
    const lendingStats = await lendingService.getLendingStats();
    const tradeStats = await tradeService.getTradeStats();
    
    // Title page
    doc.setFontSize(24);
    doc.text('Pokemon Card Collection', 105, 50, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Full Inventory Report', 105, 65, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 80, { align: 'center' });
    
    // Overview section
    doc.setFontSize(14);
    doc.text('Collection Overview', 14, 110);
    doc.setFontSize(10);
    doc.text(`Total Cards: ${stats.total}`, 14, 120);
    doc.text(`Total Value: $${stats.totalValue.toFixed(2)}`, 14, 127);
    doc.text(`Available Cards: ${stats.available}`, 14, 134);
    doc.text(`Lent Cards: ${stats.lent}`, 14, 141);
    
    doc.text(`Active Lendings: ${lendingStats.active}`, 105, 120);
    doc.text(`Total Trades: ${tradeStats.total}`, 105, 127);
    doc.text(`Trade Net Profit: $${tradeStats.netProfit.toFixed(2)}`, 105, 134);
    
    // Add new page for cards
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Card Collection', 14, 20);
    await this.generateCardsPDF(doc);
    
    // Add new page for lending
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Lending Records', 14, 20);
    await this.generateLendingPDF(doc);
    
    // Add new page for trades
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Trade History', 14, 20);
    await this.generateTradesPDF(doc);
  },

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Import functionality
  async importFromCSV(file, type = 'cards', onProgress) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          try {
            let importedCount = 0;
            
            if (type === 'cards') {
              importedCount = await this.importCards(results.data, onProgress);
            } else if (type === 'lending') {
              importedCount = await this.importLending(results.data);
            } else if (type === 'trades') {
              importedCount = await this.importTrades(results.data);
            }
            
            resolve({ success: true, count: importedCount });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  },

  async importCards(data, onProgress) {
    let imported = 0;
    const totalRows = data.filter(row => row['Name']).length;
    
    await db.transaction('rw', db.cards, async () => {
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        // Skip empty rows
        if (!row['Name']) continue;
        
        // Update progress
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: totalRows,
            cardName: row['Name']
          });
        }
        
        // Check if card already exists (by name + set + number)
        const existingCard = await db.cards
          .where('[setName+setNumber]')
          .equals([row['Set'] || '', row['Number'] || ''])
          .and(card => card.name === row['Name'])
          .first();
        
        if (existingCard) {
          // Update existing card
          await db.cards.update(existingCard.id, {
            quantity: existingCard.quantity + (parseInt(row['Quantity']) || 1),
            marketPrice: parseFloat(row['Market Price']) || existingCard.marketPrice,
            condition: row['Condition'] || existingCard.condition
          });
        } else {
          // Prepare new card data
          let cardData = {
            name: row['Name'],
            setName: row['Set'] || '',
            setNumber: row['Number'] || '',
            rarity: row['Rarity'] || '',
            condition: row['Condition'] || 'Near Mint',
            quantity: parseInt(row['Quantity']) || 1,
            marketPrice: parseFloat(row['Market Price']) || 0,
            isAvailable: row['Status'] === 'Available' || true,
            tcgId: row['TCG ID'] || '',
            imageUrl: row['Image URL'] || '',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Try to fetch card data from API to get images (only if we don't have an image URL)
          if (!cardData.imageUrl) {
            try {
              let apiCardData = null;
              
              // If we have a TCG ID, try to fetch by ID first
              if (cardData.tcgId) {
                apiCardData = await pokemonTCGService.getCardById(cardData.tcgId);
              }
              
              // If no TCG ID or fetch failed, try searching by name
              if (!apiCardData && cardData.name) {
                const searchResults = await pokemonTCGService.searchCards(cardData.name);
                if (searchResults.cards && searchResults.cards.length > 0) {
                  // Try to find exact match by name and set if possible
                  apiCardData = searchResults.cards.find(c => 
                    c.name === cardData.name && 
                    (!cardData.setName || c.setName === cardData.setName)
                  ) || searchResults.cards[0];
                }
              }
              
              // If we found card data from API, merge it with our import data
              if (apiCardData) {
                cardData = {
                  ...cardData,
                  imageUrl: apiCardData.imageUrl || apiCardData.imageLarge || apiCardData.imageSmall || '',
                  types: apiCardData.types || [],
                  hp: apiCardData.hp || '',
                  artist: apiCardData.artist || '',
                  evolvesFrom: apiCardData.evolvesFrom || '',
                  attacks: apiCardData.attacks || [],
                  weaknesses: apiCardData.weaknesses || [],
                  resistances: apiCardData.resistances || [],
                  retreatCost: apiCardData.retreatCost || [],
                  supertype: apiCardData.supertype || '',
                  subtypes: apiCardData.subtypes || [],
                  // Update TCG ID if we didn't have one
                  tcgId: cardData.tcgId || apiCardData.tcgId || ''
                };
              }
            } catch (error) {
              // If API fetch fails, continue with basic data
              console.warn(`Could not fetch card data for ${cardData.name}:`, error);
            }
          }
          
          // Add the card with or without API data
          await db.cards.add(cardData);
        }
        imported++;
        
        // Small delay to avoid rate limiting when fetching from API
        if (i < data.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    });
    
    return imported;
  },

  async importLending(data) {
    let imported = 0;
    
    await db.transaction('rw', db.lending, db.borrowers, db.cards, async () => {
      for (const row of data) {
        if (!row['Card Name'] || !row['Borrower']) continue;
        
        // Find or create borrower
        let borrower = await db.borrowers
          .where('name').equals(row['Borrower'])
          .first();
        
        if (!borrower) {
          const borrowerId = await db.borrowers.add({
            name: row['Borrower'],
            email: row['Email'] || '',
            phone: row['Phone'] || '',
            createdAt: new Date()
          });
          borrower = { id: borrowerId };
        }
        
        // Find card
        const card = await db.cards
          .where('name').equals(row['Card Name'])
          .first();
        
        if (card) {
          await db.lending.add({
            cardId: card.id,
            borrowerId: borrower.id,
            borrowerName: row['Borrower'],
            lendDate: new Date(row['Lend Date']),
            expectedReturnDate: new Date(row['Expected Return']),
            actualReturnDate: row['Actual Return'] ? new Date(row['Actual Return']) : null,
            status: row['Status'] || 'active'
          });
          imported++;
        }
      }
    });
    
    return imported;
  },

  async importTrades(data) {
    let imported = 0;
    
    await db.transaction('rw', db.trades, async () => {
      for (const row of data) {
        if (!row['Trader']) continue;
        
        await db.trades.add({
          traderName: row['Trader'],
          tradeDate: new Date(row['Date']),
          myCardsValue: parseFloat(row['My Cards Value']) || 0,
          theirCardsValue: parseFloat(row['Their Cards Value']) || 0,
          status: row['Status'] || 'completed',
          notes: row['Notes'] || ''
        });
        imported++;
      }
    });
    
    return imported;
  },

  // Batch export functionality
  async exportAllToZip() {
    const timestamp = new Date().toISOString().split('T')[0];
    const zip = new JSZip();
    
    try {
      // Prepare all data
      const cardsData = await this.prepareCardsForCSV();
      const lendingData = await this.prepareLendingForCSV();
      const tradesData = await this.prepareTradesForCSV();
      const borrowersData = await this.prepareBorrowersForCSV();
      const wishlistData = await this.prepareWishlistForCSV();
      
      // Convert to CSV and add to ZIP
      zip.file(`cards-${timestamp}.csv`, Papa.unparse(cardsData));
      zip.file(`lending-${timestamp}.csv`, Papa.unparse(lendingData));
      zip.file(`trades-${timestamp}.csv`, Papa.unparse(tradesData));
      zip.file(`borrowers-${timestamp}.csv`, Papa.unparse(borrowersData));
      zip.file(`wishlist-${timestamp}.csv`, Papa.unparse(wishlistData));
      
      // Add a README file with backup info
      const readme = `Pokemon Inventory Backup
Created: ${new Date().toLocaleString()}

This backup contains:
- cards-${timestamp}.csv: Your complete card collection (${cardsData.length} cards)
- lending-${timestamp}.csv: All lending records (${lendingData.length} records)
- trades-${timestamp}.csv: Trade history (${tradesData.length} trades)
- borrowers-${timestamp}.csv: Borrower information (${borrowersData.length} borrowers)
- wishlist-${timestamp}.csv: Your wishlist (${wishlistData.length} items)

To restore this backup:
1. Open the Pokemon Inventory app
2. Go to Settings > Data Management > Backup & Restore
3. Select "Restore" tab
4. Import each CSV file for the corresponding data type

Note: When importing cards, the app will automatically fetch card images from the Pokemon TCG API.
`;
      
      zip.file('README.txt', readme);
      
      // Generate the ZIP file
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });
      
      // Download the ZIP file
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pokemon-inventory-backup-${timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return {
        success: true,
        counts: {
          cards: cardsData.length,
          lending: lendingData.length,
          trades: tradesData.length,
          borrowers: borrowersData.length,
          wishlist: wishlistData.length
        }
      };
    } catch (error) {
      console.error('Failed to create backup ZIP:', error);
      throw new Error(`Backup failed: ${error.message}`);
    }
  },

  async prepareBorrowersForCSV() {
    const borrowers = await db.borrowers.toArray();
    return borrowers.map(borrower => ({
      'Name': borrower.name,
      'Email': borrower.email || '',
      'Phone': borrower.phone || '',
      'Date Added': new Date(borrower.createdAt).toLocaleDateString()
    }));
  },

  async prepareWishlistForCSV() {
    const wishlist = await db.wishlist.toArray();
    return wishlist.map(item => ({
      'Card Name': item.cardName,
      'Set Name': item.setName || '',
      'Priority': item.priority || 'medium',
      'Date Added': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''
    }));
  },

  // Import from ZIP functionality
  async importFromZip(file, onProgress) {
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      // Find all CSV files in the ZIP
      const csvFiles = Object.keys(contents.files).filter(filename => 
        filename.endsWith('.csv') && !contents.files[filename].dir
      );
      
      if (csvFiles.length === 0) {
        throw new Error('No CSV files found in the ZIP archive');
      }
      
      const results = {
        cards: 0,
        lending: 0,
        trades: 0,
        borrowers: 0,
        wishlist: 0,
        errors: []
      };
      
      let processedFiles = 0;
      const totalFiles = csvFiles.length;
      
      // Process each CSV file
      for (const filename of csvFiles) {
        try {
          // Update overall progress
          if (onProgress) {
            onProgress({
              type: 'file',
              current: processedFiles + 1,
              total: totalFiles,
              filename: filename,
              status: 'processing'
            });
          }
          
          // Extract CSV content
          const csvContent = await contents.files[filename].async('text');
          
          // Parse CSV
          const parseResult = await new Promise((resolve, reject) => {
            Papa.parse(csvContent, {
              header: true,
              complete: (result) => resolve(result),
              error: (error) => reject(error)
            });
          });
          
          // Determine file type based on filename
          let importType = null;
          let importedCount = 0;
          
          if (filename.includes('cards')) {
            importType = 'cards';
            // Create a progress callback for card imports
            const cardProgressCallback = onProgress ? (progress) => {
              onProgress({
                type: 'cards',
                ...progress,
                fileProgress: {
                  current: processedFiles + 1,
                  total: totalFiles
                }
              });
            } : undefined;
            importedCount = await this.importCards(parseResult.data, cardProgressCallback);
            results.cards = importedCount;
          } else if (filename.includes('lending')) {
            importType = 'lending';
            importedCount = await this.importLending(parseResult.data);
            results.lending = importedCount;
          } else if (filename.includes('trades')) {
            importType = 'trades';
            importedCount = await this.importTrades(parseResult.data);
            results.trades = importedCount;
          } else if (filename.includes('borrowers')) {
            importType = 'borrowers';
            importedCount = await this.importBorrowers(parseResult.data);
            results.borrowers = importedCount;
          } else if (filename.includes('wishlist')) {
            importType = 'wishlist';
            importedCount = await this.importWishlist(parseResult.data);
            results.wishlist = importedCount;
          }
          
          if (onProgress) {
            onProgress({
              type: 'file',
              current: processedFiles + 1,
              total: totalFiles,
              filename: filename,
              status: 'completed',
              importType: importType,
              count: importedCount
            });
          }
          
        } catch (error) {
          console.error(`Failed to import ${filename}:`, error);
          results.errors.push({
            filename: filename,
            error: error.message
          });
        }
        
        processedFiles++;
      }
      
      return {
        success: results.errors.length === 0,
        results: results,
        totalImported: results.cards + results.lending + results.trades + results.borrowers + results.wishlist
      };
      
    } catch (error) {
      console.error('Failed to import ZIP file:', error);
      throw new Error(`ZIP import failed: ${error.message}`);
    }
  },

  async importBorrowers(data) {
    let imported = 0;
    
    await db.transaction('rw', db.borrowers, async () => {
      for (const row of data) {
        if (!row['Name']) continue;
        
        // Check if borrower already exists
        const existing = await db.borrowers
          .where('name').equals(row['Name'])
          .first();
        
        if (!existing) {
          await db.borrowers.add({
            name: row['Name'],
            email: row['Email'] || '',
            phone: row['Phone'] || '',
            createdAt: new Date()
          });
          imported++;
        }
      }
    });
    
    return imported;
  },

  async importWishlist(data) {
    let imported = 0;
    
    await db.transaction('rw', db.wishlist, async () => {
      for (const row of data) {
        if (!row['Card Name']) continue;
        
        // Check if wishlist item already exists
        const existing = await db.wishlist
          .where('cardName').equals(row['Card Name'])
          .first();
        
        if (!existing) {
          await db.wishlist.add({
            cardName: row['Card Name'],
            setName: row['Set Name'] || '',
            priority: row['Priority'] || 'medium',
            createdAt: new Date()
          });
          imported++;
        }
      }
    });
    
    return imported;
  }
};

export default exportService;