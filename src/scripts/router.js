const protectedRoutes = ['#/story-list', '#/add-story', '#/profile'];
let redirectTo = null;

function requireAuth() {
  return !!localStorage.getItem('token');
}

function loadView(viewName) {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('Elemen #main-content tidak ditemukan.');
    return;
  }

  if (protectedRoutes.includes(`#${window.location.hash.split('?')[0]}`) && !requireAuth()) {
    console.warn(`Access denied. Redirecting to #/login.`);
    redirectTo = window.location.hash;
    window.location.hash = '#/login';
    return;
  }


  const viewPath = `../views/${viewName}.html`;

  // Fungsi async yang memuat konten baru dan inisialisasi modul
  const updateContent = async () => {
    try {
      const response = await fetch(viewPath);
      if (!response.ok) throw new Error(`Halaman ${viewName} tidak ditemukan.`);
      const html = await response.text();

      // 1. Update DOM
      mainContent.innerHTML = html;
      
      // 2. Re-bind Event Listener (Tetap di sini!)
      mainContent.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.hash = link.getAttribute('href');
        });
      });

      // 3. Inisialisasi Modul
      if (viewName === 'story-list') {
        import('./map.js').then(module => module.initMap());
        import('./api.js').then(apiModule => {
          apiModule.loadStories();
          const filterAllBtn = document.getElementById('filter-all');
          const filterLocationBtn = document.getElementById('filter-location');
          const setActiveButton = (activeBtn, inactiveBtn) => {
            activeBtn.classList.add('active');
            inactiveBtn.classList.remove('active');
          };
          filterAllBtn?.addEventListener('click', () => {
            apiModule.loadStories(0);
            setActiveButton(filterAllBtn, filterLocationBtn);
          });
          filterLocationBtn?.addEventListener('click', () => {
            apiModule.loadStories(1);
            setActiveButton(filterLocationBtn, filterAllBtn);
          });
        });
      } else if (viewName === 'add-story') {
        import('./form.js').then(module => module.setupForm());
      } else if (viewName === 'login') {
        // ... (Kode login handler) ...
        import('./auth.js').then(module => {
          const form = document.getElementById('login-form');
          if (form) {
            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              const email = document.getElementById('email').value;
              const password = document.getElementById('password').value;
              try {
                await module.login(email, password);
                const target = redirectTo || '#/story-list';
                redirectTo = null;
                window.location.hash = target;
              } catch (err) {
                alert('Login gagal: ' + err.message);
              }
            });
          }
        });
      } else if (viewName === 'register') {
        // ... (Kode register handler) ...
        import('./auth.js').then(module => {
          const form = document.getElementById('register-form');
          if (form) {
            form.addEventListener('submit', async (e) => {
              e.preventDefault();
              const name = document.getElementById('name').value;
              const email = document.getElementById('reg-email').value;
              const password = document.getElementById('reg-password').value;
              try {
                await module.register(name, email, password);
                alert('Pendaftaran berhasil! Silakan login.');
                window.location.hash = '#/login';
              } catch (err) {
                alert('Pendaftaran gagal: ' + err.message);
              }
            });
          }
        });
      } else if (viewName === 'profile') {
        // ... (Kode profile handler) ...
        const name = localStorage.getItem('name');
        const profileNameEl = document.getElementById('profile-name');
        if (profileNameEl && name) {
          profileNameEl.textContent = name;
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', () => {
            import('./auth.js').then(module => module.logout());
          });
        }
        
        // 🔔 Inisialisasi notifikasi (Sisa kode notifikasi di sini) ...
      }
    } catch (err) {
      console.error('Gagal memuat view:', err);
      mainContent.innerHTML = `<h2>404</h2><p>${err.message}</p>`;
      throw err;
    }
  };

  // 🎯 IMPLEMENTASI VIEW TRANSITION API
  if (!document.startViewTransition) {
    updateContent(); // Fallback: Update langsung tanpa transisi
    return;
  }
  
  // Update DOM di dalam callback startViewTransition
  document.startViewTransition(updateContent);
}

function handleHashChange() {
  const hash = window.location.hash || '#/';
  const route = hash.split('?')[0];
  let viewName;
  switch (route) {
    case '#/': viewName = 'home'; break;
    case '#/story-list': viewName = 'story-list'; break;
    case '#/add-story': viewName = 'add-story'; break;
    case '#/about': viewName = 'about'; break;
    case '#/login':
      viewName = 'login';
      if (requireAuth()) {
        window.location.hash = '#/';
        return;
      }
      break;
    case '#/register': viewName = 'register'; break;
    case '#/profile': viewName = 'profile'; break;
    case '#/logout':
      import('./auth.js').then(module => module.logout());
      return;
    default: viewName = 'home';
  }
  document.title = `${viewName.charAt(0).toUpperCase() + viewName.slice(1)} | Dicoding Story`;
  loadView(viewName);
}

export function setupNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = link.getAttribute('href');
    });
  });
  const drawerBtn = document.getElementById('drawer-button');
  const navDrawer = document.getElementById('navigation-drawer');
  if (drawerBtn && navDrawer) {
    drawerBtn.addEventListener('click', () => navDrawer.classList.toggle('open'));
  }
}

export function initRouter() {
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
}