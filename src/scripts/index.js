import {
  initRouter,
  setupNavigation
} from './router.js';
import {
  updateNavigation
} from './authState.js';

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  initRouter();
  updateNavigation(); // Render navigasi awal
});

// Update navigasi saat hash berubah
window.addEventListener('hashchange', () => {
  import('./authState.js').then(m => m.updateNavigation());
});