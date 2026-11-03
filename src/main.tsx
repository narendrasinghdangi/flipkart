import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './state/auth';
import { StoreProvider } from './state/store';
import './styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode><BrowserRouter><StoreProvider><AuthProvider><App /></AuthProvider></StoreProvider></BrowserRouter></StrictMode>,
);
