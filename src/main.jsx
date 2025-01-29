import './index.css'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom'; // Change BrowserRouter en HashRouter
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <HashRouter>  {/* Utiliser HashRouter au lieu de BrowserRouter */}
    <App />
  </HashRouter>
);