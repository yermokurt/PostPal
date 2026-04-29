/**
 * index.js
 * 
 * HOW THIS WORKS:
 * 1. This is the "Entry Point" of your React application.
 * 2. It finds the <div id="root"></div> in your public/index.html.
 * 3. It "renders" (starts) the App component inside that div.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/css/index.css';
import App from './App';
import reportWebVitals from './js/reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
