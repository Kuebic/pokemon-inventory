# Pokemon Inventory Manager

A modern web application for managing your Pokemon card collection, tracking lending, and monitoring trades.

🌐 **Live Demo**: [https://kuebic.github.io/pokemon-inventory/](https://kuebic.github.io/pokemon-inventory/)

## Features

- 📦 **Collection Management**: Add, edit, and organize your Pokemon cards
- 🔍 **Real-time Search**: Search cards using the Pokemon TCG API
- 📊 **Statistics & Charts**: Visualize your collection value and distribution
- 🤝 **Lending Tracker**: Keep track of cards you've lent to friends
- 💱 **Trade Management**: Record and monitor your trades
- 💾 **Backup & Restore**: Export/import your data as CSV or ZIP files
- 🌙 **Dark Mode**: Built-in dark mode support
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🗄️ **Local Storage**: All data stored locally in your browser using IndexedDB

## Technologies

- React 19 + Vite
- TailwindCSS
- IndexedDB (via Dexie.js)
- Pokemon TCG API
- React Router
- Recharts (for charts)
- JSZip (for backup/restore)

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/Kuebic/pokemon-inventory.git
cd pokemon-inventory
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

The app is automatically deployed to GitHub Pages when changes are pushed to the main branch.

To manually deploy:
```bash
npm run deploy
```

## Data Privacy

All data is stored locally in your browser using IndexedDB. No data is sent to external servers except for:
- Pokemon TCG API calls to fetch card information
- GitHub Pages for hosting the static site

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.