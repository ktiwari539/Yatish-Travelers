import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './experience.css';
import './premium-v3.css';
import './cinematic.css';
import './crm.css';
import './revision.css';
import './webgl-premium.css';
import './photo-luxury.css';
import './scenic-luxury.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
