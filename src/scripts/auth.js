import {
    setAuthState,
    clearAuthState
} from './authState.js';

const BASE_URL = 'https://story-api.dicoding.dev/v1';

export async function login(email, password) {
    if (!email || !password) throw new Error('Email dan password wajib diisi.');

    const res = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email,
            password
        })
    });

    const data = await res.json();

    // Pengecekan error dari API
    if (data.error) throw new Error(data.message);

    setAuthState(data.loginResult.token, data.loginResult.name);
    return data.loginResult;
}

export async function register(name, email, password) {
    if (!name || !email || !password) throw new Error('Semua field wajib diisi.');

    const res = await fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            email,
            password
        })
    });
    const data = await res.json();

    if (data.error) throw new Error(data.message);

    return data;
}

export function logout() {
    clearAuthState();
    // Redirect ke home. hashchange event akan memanggil updateNavigation()
    window.location.hash = '#/';
}