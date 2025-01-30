import './index.css'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom'; 
import App from './App';
import { TokenProvider } from "./utils/TokenContext"; 
import ErrorBoundary from './utils/ErrorBoundary';  


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <HashRouter> 
    <TokenProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </TokenProvider>
  </HashRouter>
);