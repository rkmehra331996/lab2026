import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { CmsProvider } from './context/CmsContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { autoPruneOnAppInit } from './utils/cacheManager.ts';
import './index.css';

// Automatically clear obsolete caches and flush stale service worker on startup
autoPruneOnAppInit();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <CmsProvider>
        <App />
      </CmsProvider>
    </ErrorBoundary>
  </StrictMode>,
);
