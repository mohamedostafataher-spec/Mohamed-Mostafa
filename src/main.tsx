import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Global listener for dynamic import (chunk) failures
// This occurs when a new deployment happens and a user still has an old index.html
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.error('[Sulta] Dynamic import failed, reloading page...', event);
    window.location.reload();
  });

  // Catch generic script load errors that might not be caught by vite:preloadError
  window.addEventListener('error', (e) => {
    if (e.target && (e.target as any).tagName === 'SCRIPT') {
      const src = (e.target as any).src;
      if (src && (src.includes('assets/') || src.includes('ProductPage'))) {
        console.warn('[Sulta] Script load error detected, attempting recovery...', src);
        window.location.reload();
      }
    }
  }, true);

  // Reset auto-reload flag on successful load
  sessionStorage.removeItem('sulta_auto_reload_chunk');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
);
