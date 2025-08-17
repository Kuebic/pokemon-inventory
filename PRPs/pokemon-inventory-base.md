# PRP: Pokemon Inventory Manager Implementation

## Goal

**Feature Goal:** Implement a comprehensive Pokemon TCG card inventory management web application with lending tracking, trade management, and market price integration.

**Deliverable:** A fully functional single-page React application using IndexedDB for local storage, featuring card CRUD operations, lending system with reminders, trade tracking with value comparison, Pokemon TCG API integration, collection analytics, and CSV/PDF export capabilities.

**Success Definition:** User can add/edit/delete cards, track lending with return reminders, record trades with value comparison, auto-complete card data from Pokemon TCG API, view collection statistics, and export data to CSV/PDF formats.

## Context

```yaml
project_type: React SPA with Vite
existing_stack:
  - React 19.1.1
  - Vite 7.1.2
  - ESLint configured
  - Basic React starter template

required_packages:
  core_database:
    - dexie@4.0.11  # IndexedDB wrapper
    - dexie-react-hooks@1.1.7  # React integration
  
  ui_components:
    - react-router-dom@6.28.0  # Navigation
    - @headlessui/react@2.2.0  # Accessible UI components
    - @heroicons/react@2.2.0  # Icons
    - clsx@2.1.1  # Conditional classes
  
  charting:
    - recharts@3.1.2  # Data visualization
  
  export:
    - react-papaparse@4.4.0  # CSV export
    - jspdf@2.5.2  # PDF generation
    - jspdf-autotable@3.8.4  # PDF tables
  
  utilities:
    - date-fns@4.1.0  # Date manipulation
    - lodash@4.17.21  # Utility functions

api_documentation:
  pokemon_tcg:
    base_url: https://api.pokemontcg.io/v2
    docs: https://docs.pokemontcg.io/
    rate_limits: 1000 req/day without key, 20000 with key
    no_auth_required: true
    
critical_docs:
  - PRPs/ai_docs/dexie-indexeddb-setup.md  # Complete Dexie implementation
  - PRPs/ai_docs/pokemon-tcg-api-integration.md  # API integration guide
  - PRPs/pokemon-inventory-prd.md  # Product requirements

file_structure:
  src/:
    - App.jsx  # Main app component (exists, needs replacement)
    - main.jsx  # Entry point (exists)
    - index.css  # Global styles (exists)
    
    components/:  # UI components
      - Layout.jsx
      - Navigation.jsx
      - Dashboard.jsx
      - CardList.jsx
      - CardForm.jsx
      - CardAutoComplete.jsx
      - LendingManager.jsx
      - TradeManager.jsx
      - Statistics.jsx
      - ExportManager.jsx
    
    db/:  # Database layer
      - database.js  # Dexie schema
      - migrations.js
    
    services/:  # Business logic
      - cardService.js
      - lendingService.js
      - tradeService.js
      - pokemonTCGService.js
      - priceService.js
      - exportService.js
      - reminderService.js
      - cacheService.js
    
    hooks/:  # Custom React hooks
      - useDatabase.js
      - usePokemonAPI.js
      - useNotifications.js
      - useExport.js
    
    utils/:  # Utilities
      - constants.js
      - formatters.js
      - validators.js
    
    pages/:  # Route pages
      - CollectionPage.jsx
      - LendingPage.jsx
      - TradePage.jsx
      - StatsPage.jsx
      - SettingsPage.jsx

implementation_order:
  1. Database setup with Dexie
  2. Basic CRUD operations
  3. Navigation and routing
  4. Card management UI
  5. Pokemon TCG API integration
  6. Lending system
  7. Trade management
  8. Statistics and charts
  9. Export functionality
  10. Polish and optimization

gotchas:
  - IndexedDB returns undefined on first useLiveQuery render
  - Pokemon TCG API rate limiting requires throttling
  - Browser notifications need permission request
  - PDF generation with images requires base64 conversion
  - Local storage has quota limits (~50% of free disk)
  - Dexie transactions must not call external APIs
```

## Implementation Tasks

### Task 1: Initialize Database and Core Services
**Location:** `src/db/database.js`, `src/services/*.js`
**Dependencies:** Install dexie@4.0.11 dexie-react-hooks@1.1.7
**Implementation:**
- Create Dexie database schema following PRPs/ai_docs/dexie-indexeddb-setup.md
- Define stores: cards, lending, trades, tradeCards, borrowers, priceHistory, wishlist
- Create compound indexes for [setName+setNumber] on cards table
- Implement cardService with addCard, updateCard, deleteCard, searchCards methods
- Create lendingService with lendCards, returnCards transaction patterns
- Add error handling wrapper for all database operations

### Task 2: Setup React Router and Navigation
**Location:** `src/App.jsx`, `src/components/Layout.jsx`, `src/components/Navigation.jsx`
**Dependencies:** Install react-router-dom@6.28.0 @headlessui/react@2.2.0 @heroicons/react@2.2.0
**Implementation:**
- Replace src/App.jsx with RouterProvider and route configuration
- Create Layout component with responsive navigation sidebar
- Define routes: /, /collection, /lending, /trades, /stats, /settings
- Implement Navigation component using Headless UI Disclosure for mobile
- Add route-based active state highlighting with useLocation hook
- Include collection count badges in navigation items

### Task 3: Implement Card Management UI
**Location:** `src/components/CardList.jsx`, `src/components/CardForm.jsx`, `src/pages/CollectionPage.jsx`
**Dependencies:** Uses existing Dexie setup, clsx@2.1.1 for styling
**Implementation:**
- Create CardList with grid/list view toggle using useState
- Implement CardForm with controlled inputs for all card fields
- Use useLiveQuery hook from dexie-react-hooks for reactive data
- Add search/filter bar with debounced search (lodash debounce)
- Implement card deletion with confirmation dialog (Headless UI Dialog)
- Create edit mode that populates CardForm with existing data

### Task 4: Pokemon TCG API Integration
**Location:** `src/services/pokemonTCGService.js`, `src/components/CardAutoComplete.jsx`
**Dependencies:** No additional packages needed
**Implementation:**
- Implement pokemonTCGService following PRPs/ai_docs/pokemon-tcg-api-integration.md
- Create rate limiter with 2-second throttle between requests
- Build CardAutoComplete component with debounced search (500ms delay)
- Cache search results in component state and localStorage
- Transform API response to match database schema
- Handle API errors gracefully with user-friendly messages

### Task 5: Lending System Implementation
**Location:** `src/components/LendingManager.jsx`, `src/services/lendingService.js`, `src/services/reminderService.js`
**Dependencies:** Uses date-fns@4.1.0 for date calculations
**Implementation:**
- Create LendingManager with borrower form and card selection
- Implement transaction-based lending in lendingService
- Build reminder system using browser Notification API
- Check for overdue items on app load and every 5 minutes
- Create lending history view with filter by borrower
- Add bulk return functionality with checkbox selection

### Task 6: Trade Management System
**Location:** `src/components/TradeManager.jsx`, `src/services/tradeService.js`, `src/pages/TradePage.jsx`
**Dependencies:** Uses existing price service
**Implementation:**
- Create trade form with two-column layout (giving/receiving)
- Implement value comparison using cached market prices
- Add trade status workflow: pending → completed/cancelled
- Create trade history table with sortable columns
- Calculate trade balance and highlight favorable trades
- Store historical card values at trade time

### Task 7: Statistics and Visualization
**Location:** `src/components/Statistics.jsx`, `src/pages/StatsPage.jsx`
**Dependencies:** Install recharts@3.1.2
**Implementation:**
- Create dashboard with key metrics cards (total, lent, value)
- Implement PieChart for card distribution by set/rarity
- Add BarChart for collection value over time
- Create LineChart for trading profit/loss trends
- Use ResponsiveContainer for all charts
- Add date range selector using date-fns

### Task 8: Export Functionality
**Location:** `src/services/exportService.js`, `src/components/ExportManager.jsx`, `src/hooks/useExport.js`
**Dependencies:** Install react-papaparse@4.4.0 jspdf@2.5.2 jspdf-autotable@3.8.4
**Implementation:**
- Create exportService with exportToCSV and exportToPDF methods
- Use Papa Parse CSVDownloader component for CSV export
- Implement PDF generation with jsPDF and autotable for card lists
- Add collection summary page to PDF with statistics
- Include card images in PDF (thumbnail size)
- Create download progress indicator for large exports

### Task 9: Polish and Optimization
**Location:** Various components and services
**Dependencies:** Already installed packages
**Implementation:**
- Add loading skeletons during data fetches
- Implement error boundaries for graceful error handling
- Add pagination for card list (50 cards per page)
- Create settings page for user preferences
- Optimize images with lazy loading
- Add PWA manifest for installability

## Validation Gates

### Gate 1: Database Operations
```bash
# After Task 1
npm run dev
# Open browser console
# Test: db.cards.add({name: "Pikachu", setName: "Base Set"})
# Verify: Record appears in IndexedDB (DevTools → Application → Storage)
```

### Gate 2: Navigation and Routing
```bash
# After Task 2
npm run dev
# Test: Click through all navigation items
# Verify: URL changes and correct component renders
```

### Gate 3: Card Management
```bash
# After Task 3
npm run dev
# Test: Add new card manually
# Test: Edit existing card
# Test: Delete card with confirmation
# Verify: Changes persist after page reload
```

### Gate 4: API Integration
```bash
# After Task 4
# Test: Type "charizard" in auto-complete
# Verify: Suggestions appear with images
# Test: Select suggestion
# Verify: Form populates with API data
```

### Gate 5: Lending System
```bash
# After Task 5
# Test: Lend card to borrower
# Verify: Card marked as unavailable
# Test: Set past return date
# Verify: Overdue notification appears
```

### Gate 6: Export Validation
```bash
# After Task 8
# Test: Export to CSV
# Verify: File downloads with correct data
# Test: Export to PDF
# Verify: PDF generates with images and tables
```

## Final Validation Checklist

- [ ] All TypeScript/JavaScript files follow ES6+ module syntax
- [ ] Components use function components with hooks (no class components)
- [ ] Database operations wrapped in try-catch blocks
- [ ] API calls include rate limiting and error handling
- [ ] Forms have proper validation before submission
- [ ] Loading states shown during async operations
- [ ] Responsive design works on mobile (375px) to desktop (1920px)
- [ ] Browser console shows no errors or warnings
- [ ] IndexedDB data persists across sessions
- [ ] Export functions handle large datasets (500+ cards)
- [ ] All features from PRD implemented and functional
- [ ] Lending reminders trigger for overdue items
- [ ] Trade value calculations accurate with market prices
- [ ] Statistics update in real-time with data changes
- [ ] Navigation indicators show current page

## Confidence Score: 9/10

This PRP provides comprehensive implementation guidance with specific package versions, detailed code patterns, and validation steps. The only uncertainty is potential API changes, which are mitigated by the caching layer and error handling.