import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any stale dev service workers if previously attempted in development
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      if (registration.active?.scriptURL.includes('dev-sw.js')) {
        registration.unregister().catch(() => {});
      }
    }
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(<App />);

