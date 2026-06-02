import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

console.log('🚀 Go2-Payroll Starting...');
console.log(`📅 Build Date: ${new Date().toISOString()}`);
console.log(`🔧 Environment: ${import.meta.env.MODE}`);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
