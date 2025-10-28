// src/scripts/router.js

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

  mainContent.classList.add('fade-out');
  setTimeout(() => {
    const viewPath = `../views/${viewName}.html`;

    fetch(viewPath)
      .then(response => {
        if (!response.ok) throw new Error(`Halaman ${viewName} tidak ditemukan.`);
        return response.text();
      })
      .then(html => {
        mainContent.innerHTML = html;
        mainContent.classList.remove('fade-out');

        mainContent.querySelectorAll('a[href^="#"]').forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = link.getAttribute('href');
          });
        });

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

          // 🔔 Inisialisasi notifikasi di profil
          const notifSection = document.getElementById('notification-section');
          const enableBtn = document.getElementById('enable-notif-btn');
          const disableBtn = document.getElementById('disable-notif-btn');
          const notifStatus = document.getElementById('notif-status');

          if (notifSection && enableBtn && disableBtn && notifStatus) {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
              notifStatus.textContent = 'Browser ini tidak mendukung notifikasi push.';
            } else {
              notifSection.style.display = 'block';
              const isSubscribed = localStorage.getItem('pushSubscribed') === 'true';

              if (isSubscribed) {
                notifStatus.textContent = '✅ Notifikasi aktif. Anda akan menerima pemberitahuan saat ada cerita baru.';
                enableBtn.style.display = 'none';
                disableBtn.style.display = 'inline-block';
              } else {
                notifStatus.textContent = '';
                enableBtn.style.display = 'inline-block';
                disableBtn.style.display = 'none';
              }

              enableBtn.addEventListener('click', async () => {
                try {
                  enableBtn.disabled = true;
                  enableBtn.textContent = 'Memproses...';
                  const { subscribeToPush } = await import('./notifications.js');
                  await subscribeToPush();
                  notifStatus.textContent = '✅ Notifikasi berhasil diaktifkan!';
                  enableBtn.style.display = 'none';
                  disableBtn.style.display = 'inline-block';
                } catch (err) {
                  notifStatus.textContent = '❌ Gagal: ' + (err.message || 'Coba lagi.');
                } finally {
                  enableBtn.disabled = false;
                  enableBtn.textContent = '🔔 Aktifkan Notifikasi';
                }
              });

              disableBtn.addEventListener('click', async () => {
                try {
                  disableBtn.disabled = true;
                  disableBtn.textContent = 'Memproses...';
                  const { unsubscribeFromPush } = await import('./notifications.js');
                  await unsubscribeFromPush();
                  notifStatus.textContent = '❌ Notifikasi dinonaktifkan.';
                  disableBtn.style.display = 'none';
                  enableBtn.style.display = 'inline-block';
                } catch (err) {
                  notifStatus.textContent = 'Gagal menonaktifkan: ' + err.message;
                } finally {
                  disableBtn.disabled = false;
                  disableBtn.textContent = '❌ Nonaktifkan Notifikasi';
                }
              });
            }
          }
        }
      })
      .catch(err => {
        console.error('Gagal memuat view:', err);
        mainContent.innerHTML = `<h2>404</h2><p>${err.message}</p>`;
        mainContent.classList.remove('fade-out');
      });
  }, 300);
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