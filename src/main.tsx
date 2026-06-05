/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Override global fetch to prepend VITE_API_URL if configured (useful for Vercel -> Render API routing)
const originalFetch = window.fetch;
window.fetch = (input, init) => {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    const baseUrl = (import.meta.env.VITE_API_URL as string) || '';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return originalFetch(`${cleanBaseUrl}${input}`, init);
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
