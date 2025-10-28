
export function initMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.warn('Elemen #map tidak ditemukan. Peta tidak akan diinisialisasi.');
    return;
  }

  // Set height jika belum ada
  if (!mapContainer.style.height) {
    mapContainer.style.height = '300px';
  }

  // Buat peta dengan view awal (Indonesia)
  const map = L.map('map').setView([-6.2, 106.8], 5);

  // Definisikan tile layers
  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  const positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>'
  });

  const imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS User Community'
  });

  // Gabungkan semua tile layer ke dalam objek baseMaps
  const baseMaps = {
    "OpenStreetMap": osm,
    "CartoDB Positron": positron,
    "Satellite": imagery
  };

  // Tambahkan kontrol layer ke peta
  L.control.layers(baseMaps).addTo(map);

  // Tambahkan tile layer default (OpenStreetMap)
  osm.addTo(map);

  // Simpan referensi peta ke variabel global untuk digunakan di form
  window.storyMap = map;
  window.storyMarkers = [];

  // 🔧 OPTIMASI: Tampilkan peta dengan opacity rendah saat loading
  map.getContainer().style.opacity = '0.8';
  map.getContainer().style.transition = 'opacity 0.3s';

  // Setelah peta siap, kembalikan opacity ke 1
  map.on('load', () => {
    map.getContainer().style.opacity = '1';
  });

  // Hapus fitur interaktif: klik untuk ambil koordinat
  // Jangan tambahkan event listener 'click'

  // Fungsi untuk membersihkan semua marker
  function clearMarkers() {
    if (window.storyMarkers && window.storyMarkers.length > 0) {
      window.storyMarkers.forEach(marker => map.removeLayer(marker));
      window.storyMarkers = [];
    }
  }

  // Fungsi untuk menambahkan marker dari data story
  window.addStoryMarker = function(story) {
    if (story.lat && story.lon) {
      const marker = L.marker([story.lat, story.lon])
        .addTo(map)
        .bindPopup(`
          <strong>${story.name || 'Anonim'}</strong><br>
          ${story.description || 'Tidak ada deskripsi'}<br>
          <img src="${story.photoUrl}" alt="${story.description || 'Foto story'}" style="max-width:100px; max-height:100px;">
        `);
      window.storyMarkers.push(marker);
    }
  };

  // Fungsi untuk memperbarui peta berdasarkan filter atau data baru
  window.updateMapFromFilter = function(filteredStories) {
    clearMarkers();
    if (filteredStories && filteredStories.length > 0) {
      filteredStories.forEach(addStoryMarker);
    }
  };

  // Jika ada data story yang sudah dimuat sebelumnya, tampilkan di peta
  if (window.loadedStories) {
    updateMapFromFilter(window.loadedStories);
  }
}