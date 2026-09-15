import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { generatePWAIconsDevOnly } from './utils/pwaGenerator';

// Auto-generate high-resolution PWA PNG icons from the source SVG in developer environment
if (process.env.NODE_ENV !== 'production') {
  generatePWAIconsDevOnly();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
