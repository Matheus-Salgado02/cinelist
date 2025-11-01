const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BEARER_TOKEN = import.meta.env.VITE_TMDB_BEARER;
const API_BASE = 'https://api.themoviedb.org/3';

async function request(path, params = {}) {
  if (!BEARER_TOKEN && !API_KEY) throw new Error('VITE_TMDB_BEARER or VITE_TMDB_API_KEY not configured');
  const url = new URL(API_BASE + path);
  
  // If no Bearer token is set, use the API key as a query param
  if (!BEARER_TOKEN && API_KEY) {
    params.api_key = API_KEY;
  }
  
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers = {};
  if (BEARER_TOKEN) {
    headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDB error ${res.status}: ${text}`);
  }
  return res.json();
}

export function getConfiguration() {
  return request('/configuration');
}

export function getTrendingMovies(period = 'week', page = 1) {
  return request(`/trending/movie/${period}`, { page });
}

export function getPopularMovies(page = 1) {
  return request('/movie/popular', { page });
}

export function getNowPlaying(page = 1) {
  return request('/movie/now_playing', { page });
}

export function getTopRated(page = 1) {
  return request('/movie/top_rated', { page });
}

export function searchMovies(query, page = 1) {
  return request('/search/movie', { query, page });
}

export function getMovieDetails(id) {
  return request(`/movie/${id}`, { append_to_response: 'credits' });
}
