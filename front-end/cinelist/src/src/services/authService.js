/*
  Real backend-backed authService.
  This service calls the backend API (configurable via VITE_BACKEND_URL).
  If the backend is unreachable, methods throw and the AuthContext may handle fallbacks.
*/

const STORAGE_KEY = 'cinelist_auth';
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'https://cinelist-apen.onrender.com';

async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.token) headers['Authorization'] = `Bearer ${parsed.token}`;
    } catch {}
  }
  // Debug: log request info (do not log full token for security, only presence)
  try {
    console.debug('[apiRequest] ', { url, method: options.method || 'GET', hasToken: !!(stored && JSON.parse(stored).token), body: options.body });
  } catch (e) {
    console.debug('[apiRequest] ', { url, method: options.method || 'GET', body: options.body });
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    console.error('[apiRequest] response error', { url, status: res.status, statusText: res.statusText, body: text });
    let message = text || `Request failed ${res.status}`;
    try { message = JSON.parse(text).message || message; } catch (_) {}
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  const contentType = res.headers.get('content-type') || '';
  console.debug('[apiRequest] response ok', { url, status: res.status, contentType });
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

function setAuthStorage(authData) {
  if (!authData) return localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
}

function getAuthStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export const authService = {
  async login(email, password) {
    const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    // expected: { user, token }
    setAuthStorage({ user: data.user, token: data.token });
    return { user: data.user, token: data.token };
  },

  async register(email, password, name = '') {
    const data = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) });
    setAuthStorage({ user: data.user, token: data.token });
    return { user: data.user, token: data.token };
  },

  logout() {
    setAuthStorage(null);
  },

  isAuthenticated() {
    const s = getAuthStorage();
    return !!(s && s.token && s.user);
  },

  getCurrentUser() {
    const s = getAuthStorage();
    return s?.user || null;
  },

  async updateProfile(profileData) {
    const data = await apiRequest('/auth/me', { method: 'PUT', body: JSON.stringify(profileData) });
    // update storage
    const stored = getAuthStorage() || {};
    const updated = { ...stored, user: data.user };
    setAuthStorage(updated);
    console.log('Profile updated successfully:', data.user);
    return data.user;
  },

  async addToWatchlist(movie) {
    const data = await apiRequest('/watchlist', { method: 'POST', body: JSON.stringify({ movieId: movie.id }) });
    // backend should return updated user
    if (data.user) {
      const stored = getAuthStorage() || {};
      setAuthStorage({ ...stored, user: data.user });
      return data.user;
    }
    return this.getCurrentUser();
  },

  async removeFromWatchlist(movieId) {
    const data = await apiRequest(`/watchlist/${movieId}`, { method: 'DELETE' });
    if (data.user) {
      const stored = getAuthStorage() || {};
      setAuthStorage({ ...stored, user: data.user });
      return data.user;
    }
    return this.getCurrentUser();
  },

  async addOrUpdateReview(movieId, rating, text) {
    const data = await apiRequest('/reviews', { 
      method: 'POST', 
      body: JSON.stringify({ movieId, rating, text }) 
    });
    // backend returns { user, review }
    if (data.user) {
      const stored = getAuthStorage() || {};
      setAuthStorage({ ...stored, user: data.user });
      return data.review;
    }
    return data.review;
  },

  async removeReview(reviewId) {
    const data = await apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' });
    if (data.user) {
      const stored = getAuthStorage() || {};
      setAuthStorage({ ...stored, user: data.user });
    }
    return data;
  },

  async getReviewsForMovie(movieId) {
    const data = await apiRequest(`/reviews/movie/${movieId}`, { method: 'GET' });
    return data.reviews || [];
  },

  async validateToken() {
    try {
      const data = await apiRequest('/auth/me', { method: 'GET' });
      if (data?.user) {
        const stored = getAuthStorage() || {};
        setAuthStorage({ ...stored, user: data.user });
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }
};