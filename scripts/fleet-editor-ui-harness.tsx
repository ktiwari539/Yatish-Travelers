// Isolated Playwright-only fixture, never imported from the public application.
import { createRoot } from 'react-dom/client';
import { FleetManager } from '../src/FleetManager';
createRoot(document.getElementById('root')!).render(<FleetManager token="synthetic-test-token"/>);
