import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TasaCambioProvider } from './context/TasaCambioContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TasaCambioProvider>
      <App />
    </TasaCambioProvider>
  </React.StrictMode>
);