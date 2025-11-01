import React, { useEffect, useState } from 'react';
import { getConfiguration, getTrendingMovies, getPopularMovies } from '../services/tmdb';
import Header from '../components/Header';
import HeroBanner from '../components/HeroBanner';
import MoviesRow from '../components/MoviesRow';
import '../styles/home_page.css';

export default function HomePage() {
  const [config, setConfig] = useState(null);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [hero, setHero] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const cfg = await getConfiguration();
        // pick a sensible poster size; we'll keep w342 as the imageBase used by MovieCard by default
        const imageBase = cfg.images.secure_base_url + 'w342';
        setConfig({ ...cfg, imageBase });

        const t = await getTrendingMovies('week', 1);
        setTrending(t.results || []);

        const p = await getPopularMovies(1);
        setRecent(p.results || []);

        setHero(t.results && t.results.length ? t.results[0] : p.results && p.results.length ? p.results[0] : null);
      } catch (err) {
        console.error(err);
        setError(err.message || String(err));
      }
    }
    load();
  }, []);

  return (
    <div className="home-page">
      <Header />
      <div className="container">
  {error && <div style={{ color: 'salmon' }}>Error loading movies: {error}</div>}
        <HeroBanner movie={hero} imageBase={config ? config.images.secure_base_url + 'original' : ''} />

        <div className="section">
          <MoviesRow title="Trending Now" movies={trending} imageBase={config ? config.images.secure_base_url + 'w342' : ''} />
        </div>

        <div className="section">
          <MoviesRow title="Recently Added" movies={recent} imageBase={config ? config.images.secure_base_url + 'w342' : ''} />
        </div>
      </div>
    </div>
  );
}
