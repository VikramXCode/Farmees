import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add app-loaded class when the app loads
// Add app-loaded class when the app loads
const removeLoader = () => {
  document.body.classList.add('app-loaded');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', removeLoader);
} else {
  removeLoader();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
