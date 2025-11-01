import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchMovies, getConfiguration } from '../services/tmdb';
import Header from '../components/Header';
import MovieCard from '../components/MovieCard';
import '../styles/search_results.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function SearchResults() {
  const query = useQuery();
  const q = query.get('q') || '';
  const [movies, setMovies] = useState([]);
  const [imageBase, setImageBase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!q.trim()) return;
      setLoading(true);
      setError(null);
      try {
        const cfg = await getConfiguration();
        setImageBase(cfg.images.secure_base_url + 'w342');

        const res = await searchMovies(q, 1);
        setMovies(res.results || []);
      } catch (err) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [q]);

  return (
    <div className="search-page">
      <Header />
      <div className="container">
        <div className="search-header">
          <h1>Results for "{q}"</h1>
          <button className="back-button" onClick={() => navigate(-1)}>Back</button>
        </div>

        {loading && <div className="info">Searching movies...</div>}
        {error && <div className="error">Error: {error}</div>}

        {!loading && !error && (
          movies.length ? (
            <div className="search-grid" role="list">
              {movies.map(m => (
                <div role="listitem" key={m.id} className="search-grid-item">
                  <MovieCard movie={m} imageBase={imageBase} size="w185" />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">No movies found for "{q}"</div>
          )
        )}
      </div>
    </div>
  );
}
