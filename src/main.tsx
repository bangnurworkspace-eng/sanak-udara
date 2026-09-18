import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { InstitutionProvider } from './contexts/InstitutionContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InstitutionProvider>
      <App />
    </InstitutionProvider>
  </StrictMode>,
);
