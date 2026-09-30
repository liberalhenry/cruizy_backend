import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AppProvider } from './lib/app';
import { applySymbol } from './screens/einstieg';

// Tarnung (Issue #11): Symbol, Name und Manifest schon beim Start — nicht erst nach einer Auswahl
try {
  const k = localStorage.getItem('tarn-symbol');
  if (k) applySymbol(k);
} catch {
  /* ohne Speicher bleibt die Voreinstellung */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);

// Service Worker: Offline-Grundgerüst, Web-Push, Rückfrage des Check-ins
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
