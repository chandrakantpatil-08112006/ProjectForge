import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.jsx';
import { store } from './app/store.js';
import { bootstrapAuth } from './features/auth/authSlice.js';
import './index.css';

// Ask the server whether the refresh cookie is still valid before the first paint decisions are made.
store.dispatch(bootstrapAuth());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
