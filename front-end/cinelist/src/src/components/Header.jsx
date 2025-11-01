import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchMovies, getConfiguration } from '../services/tmdb';
import './header.css';

export default function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageBase, setImageBase] = useState('');
  const searchRef = useRef(null);
  const location = useLocation();

  // Load TMDB config for images
  useEffect(() => {
    getConfiguration().then(cfg => {
      setImageBase(cfg.images.secure_base_url + 'w185');
    }).catch(err => {
      console.error('Failed to load TMDB config:', err);
      setImageBase('https://image.tmdb.org/t/p/w185');
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    const q = (query || '').trim();
    if (!q) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchMovies(q, 1);
        setSearchResults(data.results.slice(0, 8)); // Show top 8 results
        setShowDropdown(true);
        setLoading(false);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Don't navigate, just trigger search
  };

  const handleMovieClick = (movieId) => {
    setQuery('');
    setShowDropdown(false);
    setSearchResults([]);
    navigate(`/movie/${movieId}`);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo" onClick={() => navigate('/')}>
          <span className="logo-icon">🎬</span>
          <span className="logo-text">CineList</span>
        </div>

        {/* Show back button in header when viewing a movie details page */}
        {location.pathname && location.pathname.startsWith('/movie') && (
          <button className="back-link" onClick={() => navigate(-1)} aria-label="Go back">← Back</button>
        )}

        <div className="search-container" ref={searchRef}>
          <form className="search-form" onSubmit={handleSubmit} role="search">
            <input
              className="search-input"
              type="search"
              placeholder="Search movies, e.g. Inception"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => query.trim() && setShowDropdown(true)}
              aria-label="Search movies"
              autoComplete="off"
            />
          </form>

          {/* Search Dropdown/Sheet */}
          {showDropdown && (
            <div className="search-dropdown">
              {loading && (
                <div className="search-loading">Searching...</div>
              )}
              
              {!loading && searchResults.length === 0 && query.trim() && (
                <div className="search-empty">No movies found for "{query}"</div>
              )}

              {!loading && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(movie => (
                    <div
                      key={movie.id}
                      className="search-result-item"
                      onClick={() => handleMovieClick(movie.id)}
                    >
                      <div className="search-result-poster">
                        {movie.poster_path ? (
                          <img 
                            src={`${imageBase}${movie.poster_path}`} 
                            alt={movie.title}
                          />
                        ) : (
                          <div className="search-result-no-poster">🎬</div>
                        )}
                      </div>
                      <div className="search-result-info">
                        <div className="search-result-title">{movie.title}</div>
                        <div className="search-result-meta">
                          {movie.release_date && (
                            <span className="search-result-year">
                              {new Date(movie.release_date).getFullYear()}
                            </span>
                          )}
                          {movie.vote_average > 0 && (
                            <span className="search-result-rating">
                              ★ {(movie.vote_average / 2).toFixed(1)}/5
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="nav">
          <button className="nav-link" onClick={() => navigate('/')}>
            Home
          </button>
          <button className="nav-link" onClick={() => navigate('/browse')}>
            Browse Movies
          </button>

          {isAuthenticated() ? (
            <div className="user-menu">
             
              <button className="nav-link" onClick={() => navigate('/account')}>
                  My Account
              </button>
              <button className="nav-link" onClick={() => navigate('/watchlist')}>
                  Watchlist
              </button>
              <button className="nav-link" onClick={handleLogout}>
                  Logout
              </button>
            </div>
          ) : (
            <button className="login-button" onClick={() => navigate('/login')}>
              Sign In
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}