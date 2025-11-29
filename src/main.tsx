import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ConnectivityProvider } from './contexts/ConnectivityContext';
import './index.css';

// Add app-loaded class when the app loads
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('app-loaded');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConnectivityProvider>
      <App />
    </ConnectivityProvider>
  </StrictMode>
);
