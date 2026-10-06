import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.js';

if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onRegisterError() {
      // Fail silently if service workers are restricted by browser settings
    },
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
