export function setupForm() {
  const form = document.getElementById('add-story-form');
  if (!form) return;

  // Inisialisasi peta terlebih dahulu
  initMapForAddStory();

  // Ambil referensi elemen input
  const descriptionInput = document.getElementById('description-input');
  const photoInput = document.getElementById('photo-input');
  const latInput = document.getElementById('lat-input');
  const lonInput = document.getElementById('lon-input');
  const submitBtn = document.getElementById('submit-btn');
  const previewImg = document.getElementById('preview-img');
  const cameraBtn = document.getElementById('camera-btn');
  const videoElement = document.getElementById('video');
  const captureBtn = document.getElementById('capture-btn');
  const cancelBtn = document.getElementById('cancel-btn');

  // Preview gambar saat file dipilih
  photoInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        previewImg.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
      };
      reader.readAsDataURL(file);
    }
  });

  // Fitur kamera langsung (Advance)
  let stream = null;

  cameraBtn.addEventListener('click', async function() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoElement.srcObject = stream;
      videoElement.style.display = 'block';
      captureBtn.style.display = 'inline-block';
      cancelBtn.style.display = 'inline-block';
      photoInput.style.display = 'none';
      previewImg.style.display = 'none';
    } catch (err) {
      alert('Gagal mengakses kamera: ' + err.message);
    }
  });

  cancelBtn.addEventListener('click', function() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
      videoElement.style.display = 'none';
      captureBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      photoInput.style.display = 'block';
    }
  });

  captureBtn.addEventListener('click', function() {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(function(blob) {
      const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      photoInput.files = dataTransfer.files;

      const reader = new FileReader();
      reader.onload = function(e) {
        previewImg.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
      };
      reader.readAsDataURL(blob);

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
        videoElement.style.display = 'none';
        captureBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        photoInput.style.display = 'block';
      }
    }, 'image/jpeg');
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    if (!descriptionInput.value.trim()) {
      showFormError(descriptionInput, 'Deskripsi harus diisi.');
      return;
    }

    if (!photoInput.files || photoInput.files.length === 0) {
      showFormError(photoInput, 'Silakan pilih foto.');
      return;
    }

    const file = photoInput.files[0];
    if (file.size > 1024 * 1024) {
      showFormError(photoInput, 'Ukuran foto maksimal 1MB.');
      return;
    }

    const formData = new FormData();
    formData.append('description', descriptionInput.value);
    formData.append('photo', file);

    if (latInput.value && lonInput.value) {
      formData.append('lat', parseFloat(latInput.value));
      formData.append('lon', parseFloat(lonInput.value));
    }

    import('./api.js').then(module => {
      module.addNewStory(formData, false);
    });
  });

  function showFormError(input, message) {
    const errorDiv = input.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('error-message')) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    } else {
      const error = document.createElement('div');
      error.className = 'error-message';
      error.textContent = message;
      input.parentNode.insertBefore(error, input.nextSibling);
    }
    input.focus();
  }
}

// Fungsi untuk menginisialisasi peta khusus halaman tambah cerita
// Fungsi untuk menginisialisasi peta khusus halaman tambah cerita
function initMapForAddStory() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.warn('Elemen #map tidak ditemukan. Peta tidak akan diinisialisasi.');
    return;
  }

  // Set height jika belum ada
  if (!mapContainer.style.height) {
    mapContainer.style.height = '300px';
  }

  let map;
  try {
    map = L.map('map').setView([-6.2, 106.8], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
  } catch (e) {
    console.error('Gagal inisialisasi peta:', e);
    mapContainer.innerHTML = '<p style="color: red;">Gagal memuat peta. Silakan refresh halaman.</p>';
    return;
  }

  // 👇👇👇 INI KODE BARU UNTUK KEYBOARD NAVIGATION (DIPERBAIKI) 👇👇👇
  let virtualMarker = null;
  let currentLat = -6.2;
  let currentLon = 106.8;
  const step = 0.01;

  // Jadikan peta bisa difokuskan
  map.getContainer().setAttribute('tabindex', '0');
  map.getContainer().setAttribute('role', 'application');
  map.getContainer().setAttribute('aria-label', 'Peta interaktif untuk memilih lokasi. Gunakan panah untuk bergerak, Enter untuk memilih.');

  // Event listener untuk keyboard
  map.getContainer().addEventListener('keydown', (e) => {
    if (!virtualMarker || !map) return;

    switch (e.key) {
      case 'ArrowUp':
        currentLat += step;
        break;
      case 'ArrowDown':
        currentLat -= step;
        break;
      case 'ArrowLeft':
        currentLon -= step;
        break;
      case 'ArrowRight':
        currentLon += step;
        break;
      case 'Enter':
        // Simulasikan klik di koordinat virtualMarker
        const latInput = document.getElementById('lat-input');
        const lonInput = document.getElementById('lon-input');
        if (latInput && lonInput) {
          latInput.value = currentLat.toFixed(6);
          lonInput.value = currentLon.toFixed(6);
        }

        // Hapus marker lama jika ada
        if (window.addStoryMarker) {
          try {
            map.removeLayer(window.addStoryMarker);
          } catch (err) { /* ignore */ }
        }

        // Tambahkan marker baru
        try {
          const marker = L.marker([currentLat, currentLon])
            .addTo(map)
            .bindPopup(`Lokasi: ${currentLat.toFixed(4)}, ${currentLon.toFixed(4)}`)
            .openPopup();

          window.addStoryMarker = marker;
          showNotification('Lokasi berhasil dipilih!', 'success');
        } catch (err) {
          console.error('Gagal menambahkan marker:', err);
        }

        e.preventDefault();
        return;
      default:
        return;
    }

    // Update posisi marker virtual
    try {
      virtualMarker.setLatLng([currentLat, currentLon]);
      map.panTo([currentLat, currentLon], { animate: true });
    } catch (err) {
      console.error('Gagal update marker virtual:', err);
    }
    e.preventDefault();
  });

  // Buat marker virtual saat peta difokuskan
  map.on('focus', () => {
    if (!virtualMarker) {
      try {
        virtualMarker = L.marker([currentLat, currentLon], {
          draggable: false,
          title: 'Gunakan panah ↑↓←→ untuk bergerak, Enter untuk memilih',
          icon: L.divIcon({
            className: 'virtual-marker',
            html: '<div style="width: 12px; height: 12px; background: red; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          })
        }).addTo(map);
      } catch (err) {
        console.error('Gagal membuat marker virtual:', err);
      }
    }
  });

  // Saat peta blur, sembunyikan marker virtual (opsional)
  map.on('blur', () => {
    if (virtualMarker) {
      try {
        map.removeLayer(virtualMarker);
      } catch (err) { /* ignore */ }
      virtualMarker = null;
    }
  });

  // Tambahkan event listener untuk klik mouse (tetap bekerja seperti sebelumnya)
  map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    const latInput = document.getElementById('lat-input');
    const lonInput = document.getElementById('lon-input');
    if (latInput && lonInput) {
      latInput.value = lat.toFixed(6);
      lonInput.value = lng.toFixed(6);
    }

    // Hapus marker lama
    if (window.addStoryMarker) {
      try {
        map.removeLayer(window.addStoryMarker);
      } catch (err) { /* ignore */ }
    }

    // Tambahkan marker baru
    try {
      const marker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`Lokasi: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        .openPopup();

      window.addStoryMarker = marker;

      // Perbarui posisi marker virtual juga
      currentLat = lat;
      currentLon = lng;
      if (virtualMarker) {
        virtualMarker.setLatLng([lat, lng]);
      }
    } catch (err) {
      console.error('Gagal menambahkan marker dari klik:', err);
    }
  });
  // 👆👆👆 AKHIR KODE BARU UNTUK KEYBOARD NAVIGATION 👆👆👆

  // Pastikan peta bisa difokuskan saat halaman dimuat
  setTimeout(() => {
    try {
      map.getContainer().focus();
    } catch (err) {
      console.warn('Gagal fokus ke peta:', err);
    }
  }, 500);
}