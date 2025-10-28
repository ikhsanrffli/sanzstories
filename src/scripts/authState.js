function getAuthState() {
  return {
    token: localStorage.getItem('token'),
    name: localStorage.getItem('name')
  };
}

// ✅ BARU/FIXED: Menyimpan state dan langsung memperbarui navigasi.
function setAuthState(token, name) {
  localStorage.setItem('token', token);
  localStorage.setItem('name', name);
  updateNavigation(); 
}

// ✅ FIXED: Hanya fokus pada penghapusan state.
function clearAuthState() {
  localStorage.removeItem('token');
  localStorage.removeItem('name');
}

function updateNavigation() {
  const navList = document.getElementById('nav-list');
  if (!navList) return;

  const { token, name } = getAuthState();

  if (token) {
    navList.innerHTML = `
  <li>Halo, ${name}</li>
      <li><a href="#/">Beranda</a></li>
      <li><a href="#/story-list">Daftar Cerita</a></li>
      <li><a href="#/add-story">Tambah Cerita</a></li>
      <li><a href="#/logout" id="logout-link">Logout</a></li>
      <li><a href="#/about">About</a></li>
      <li><a href="#/profile">Profil</a></li>
    `;
    
    document.getElementById('logout-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      // Trigger router untuk memanggil logout
      window.location.hash = '#/logout'; 
    });
  } else {
    navList.innerHTML = `
      <li><a href="#/">Beranda</a></li>
      <li><a href="#/login">Login</a></li>
      <li><a href="#/register">Daftar</a></li>
      <li><a href="#/about">About</a></li>
    `;
  }

  // Re-bind event listener untuk navigasi
  document.querySelectorAll('#nav-list a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
          // Hanya set hash, router yang akan memuat view
          window.location.hash = href;
      }
    });
  });
}

export { getAuthState, clearAuthState, updateNavigation, setAuthState };