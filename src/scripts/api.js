const BASE_URL = 'https://story-api.dicoding.dev/v1';

/**
 * Menampilkan loading indicator sederhana
 */
export function showLoadingIndicator() {
  const container = document.getElementById('story-list-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div class="loading-spinner"></div>
      <p style="margin-top: 10px; color: #666;">Memuat cerita...</p>
    </div>
  `;
}

/**
 * Mengambil daftar story dari API (wajib login)
 */
export async function loadStories(locationFilter = 0) {
  const token = localStorage.getItem('token');
  const container = document.getElementById('story-list-container');

  // Jika tidak ada token, jangan fetch API sama sekali
  if (!token) {
    if (container) {
      container.innerHTML = `
        <div class="login-prompt">
          <h3>Anda harus login untuk melihat daftar cerita.</h3>
          <p>Silakan <a href="#/login">login</a> terlebih dahulu.</p>
        </div>
      `;
    }
    return;
  }

  // 👇 TAMPILKAN LOADING INDICATOR SEBELUM FETCH
  showLoadingIndicator();

  try {
    const url = new URL(`${BASE_URL}/stories`);
    url.searchParams.append('location', locationFilter.toString());

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (data.error) throw new Error(data.message);

    // Simpan data
    window.loadedStories = data.listStory;

    renderStoryList(data.listStory);

    // Hanya update peta jika fungsi tersedia
    if (typeof window.updateMapFromFilter === 'function') {
      window.updateMapFromFilter(data.listStory);
    }

  } catch (error) {
    console.error('Error fetching stories:', error);
    if (container) {
      container.innerHTML = `<p class="error">Gagal memuat cerita: ${error.message}</p>`;
    }
  }
}

/**
 * Menambahkan story baru
 * @param {FormData} formData - Data form (description, photo, lat, lon)
 * @param {boolean} useGuest - Jika true, gunakan /stories/guest (tanpa token)
 */
export async function addNewStory(formData, useGuest = false) {
  const token = localStorage.getItem('token');
  const url = useGuest ?
    `${BASE_URL}/stories/guest` :
    `${BASE_URL}/stories`;

  const headers = {};
  if (!useGuest) {
    if (!token) {
      throw new Error('Token tidak ditemukan. Silakan login terlebih dahulu.');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: useGuest ? {} : headers,
      body: formData
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.message || 'Gagal menambahkan cerita.');
    }

    // Tampilkan notifikasi sukses
    showNotification('Cerita berhasil dibuat!', 'success');

    // Reset form jika ada
    const form = document.getElementById('add-story-form');
    if (form) form.reset();

    // Refresh halaman story-list jika sedang di halaman tersebut
    if (window.location.hash === '#/story-list') {
      loadStories();
    } else {
      // Redirect ke halaman daftar cerita
      window.location.hash = '#/story-list';
    }

  } catch (error) {
    console.error('Error adding story:', error);
    showNotification(`Gagal menambahkan cerita: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Menampilkan notifikasi UI (bukan push notification)
 */
function showNotification(message, type = 'info') {
  // Hapus notifikasi lama
  const old = document.querySelector('.notification');
  if (old) old.remove();

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Merender daftar cerita ke dalam container
 */
function renderStoryList(stories) {
  const container = document.getElementById('story-list-container');
  if (!container) return;

  if (!stories || stories.length === 0) {
    container.innerHTML = '<p>Tidak ada cerita yang ditemukan.</p>';
    return;
  }

  // 👇 SESUAIKAN STRUKTUR CARD AGAR MENYERUPAI KORAN
  const storyItems = stories.map(story => `
    <article class="story-card">
      <img src="${story.photoUrl}" alt="${story.description || 'Foto cerita'}" class="story-image">
      <div class="story-info">
        <h3>${story.name || 'Anonim'}</h3>
        <p>${story.description || '—'}</p>
        <small>— ${new Date(story.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
        ${story.lat && story.lon ? 
          `<span class="story-location">📍 ${story.lat.toFixed(2)}, ${story.lon.toFixed(2)}</span>` : 
          '' // Tidak tampilkan jika tidak ada lokasi
        }
      </div>
    </article>
  `).join('');

  container.innerHTML = storyItems;
}