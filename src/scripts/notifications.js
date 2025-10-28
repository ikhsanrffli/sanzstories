// src/scripts/notification.js

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

/**
 * Mengonversi Base64 URL-safe ke Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

/**
 * Konversi ArrayBuffer ke Base64 string
 */
function arrayBufferToBase64(buffer) {
  const uint8Array = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

/**
 * Berlangganan ke Push Notification
 */
export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Browser tidak mendukung notifikasi push.');
  }

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Silakan login terlebih dahulu.');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Siapkan payload sesuai spesifikasi API Dicoding
    const cleanSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth'))
      }
    };

    const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cleanSubscription)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.message || 'Gagal berlangganan ke notifikasi.');
    }

    localStorage.setItem('pushSubscribed', 'true');
    localStorage.setItem('pushEndpoint', subscription.endpoint); // Simpan endpoint untuk unsubscribe
  } catch (err) {
    console.error('Gagal subscribe notifikasi:', err);
    localStorage.removeItem('pushSubscribed');
    localStorage.removeItem('pushEndpoint');
    throw err;
  }
}

/**
 * Berhenti berlangganan dari Push Notification
 */
export async function unsubscribeFromPush() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    // Kirim request DELETE ke API Dicoding
    const endpoint = localStorage.getItem('pushEndpoint') || subscription.endpoint;
    await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ endpoint })
    });

    // Hapus dari browser
    await subscription.unsubscribe();

    // Hapus status lokal
    localStorage.removeItem('pushSubscribed');
    localStorage.removeItem('pushEndpoint');
  } catch (err) {
    console.error('Gagal unsubscribe notifikasi:', err);
    throw err;
  }
}