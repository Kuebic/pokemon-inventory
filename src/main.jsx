import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Clean up old service workers and register new one
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // First, unregister any old service workers from different domains/projects
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      if (!registration.scope.includes(window.location.origin)) {
        await registration.unregister();
        console.log('Unregistered old SW:', registration.scope);
      }
    }
    
    // Clean up old caches from other projects
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        if (!cacheName.includes('pokemon-inventory')) {
          await caches.delete(cacheName);
          console.log('Deleted old cache:', cacheName);
        }
      }
    }
    
    // Now register our service worker
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
        // Force update to get the latest version
        registration.update();
      })
      .catch(error => console.log('SW registration failed:', error));
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
