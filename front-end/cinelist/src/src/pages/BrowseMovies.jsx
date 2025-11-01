import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import MovieCard from '../components/MovieCard';
import { searchMovies, getConfiguration } from '../services/tmdb';
import './browse_movies.css';

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];

export default function BrowseMovies() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [imageBase, setImageBase] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const observer = useRef();
  const searchTimeoutRef = useRef();

  // Load TMDB config
  useEffect(() => {
    getConfiguration().then(cfg => {
      setImageBase(cfg.images.secure_base_url + 'w500');
      window.__TMDB_CONFIG = cfg;
    }).catch(err => {
      console.error('Failed to load TMDB config:', err);
      setImageBase('https://image.tmdb.org/t/p/w500');
    });
  }, []);

  // Fetch movies based on current filters
  const fetchMovies = useCallback(async (pageNum, resetMovies = false) => {
    setLoading(true);
    try {
      let data;
      const query = searchQuery.trim();

      if (query) {
        // Search movies across all TMDB database
        data = await searchMovies(query, pageNum);
      } else if (selectedGenre !== 'all') {
        // Fetch by genre using discover endpoint
        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?page=${pageNum}&with_genres=${selectedGenre}&sort_by=popularity.desc`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_TMDB_BEARER}`
            }
          }
        );
        data = await response.json();
      } else {
        // Fetch popular movies (default)
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/popular?page=${pageNum}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_TMDB_BEARER}`
            }
          }
        );
        data = await response.json();
      }

      if (resetMovies) {
        setMovies(data.results || []);
      } else {
        setMovies(prev => [...prev, ...(data.results || [])]);
      }

      setTotalResults(data.total_results || 0);
      setHasMore(data.page < data.total_pages);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setMovies([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedGenre]);

  // Initial load and when filters change
  useEffect(() => {
    setPage(1);
    setMovies([]);
    fetchMovies(1, true);
  }, [searchQuery, selectedGenre]);

  // Load more when page changes (not on initial load)
  useEffect(() => {
    if (page > 1) {
      fetchMovies(page, false);
    }
  }, [page]);

  // Debounced search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleGenreClick = (genreId) => {
    setSelectedGenre(genreId);
  };

  // Infinite scroll - observe last element
  const lastMovieElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  return (
    <div className="browse-page">
      <Header />
      
      <div className="browse-container">
        <div className="browse-header">
          <h1>Browse Movies</h1>
          <p className="browse-subtitle">Explore our collection of movies</p>
        </div>

        {/* Search and Filters */}
        <div className="browse-controls">
          {/* Search Bar */}
          <div className="browse-search">
            <input
              type="text"
              placeholder="Search movies by title..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="browse-search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Genre Filter */}
          <div className="genre-filter">
            <button
              className={`genre-chip ${selectedGenre === 'all' ? 'active' : ''}`}
              onClick={() => handleGenreClick('all')}
            >
              All Genres
            </button>
            {GENRES.map(genre => (
              <button
                key={genre.id}
                className={`genre-chip ${selectedGenre === String(genre.id) ? 'active' : ''}`}
                onClick={() => handleGenreClick(String(genre.id))}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info */}
        <div className="results-info">
          {searchQuery && (
            <p>Search results for: <strong>"{searchQuery}"</strong></p>
          )}
          <p className="results-count">
            {totalResults.toLocaleString()} {totalResults === 1 ? 'movie' : 'movies'} found
          </p>
        </div>

        {/* Movies Grid */}
        {loading && movies.length === 0 ? (
          <div className="browse-loading">
            <div className="spinner"></div>
            <p>Loading movies...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🎬</div>
            <h3>No movies found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="movies-grid">
              {movies.map((movie, index) => {
                if (movies.length === index + 1) {
                  // Last element - attach ref for infinite scroll
                  return (
                    <div key={`${movie.id}-${index}`} ref={lastMovieElementRef}>
                      <MovieCard
                        movie={movie}
                        imageBase={imageBase}
                        size="w500"
                      />
                    </div>
                  );
                } else {
                  return (
                    <MovieCard
                      key={`${movie.id}-${index}`}
                      movie={movie}
                      imageBase={imageBase}
                      size="w500"
                    />
                  );
                }
              })}
            </div>

            {/* Loading indicator when loading more */}
            {loading && movies.length > 0 && (
              <div className="browse-loading-more">
                <div className="spinner-small"></div>
                <p>Loading more movies...</p>
              </div>
            )}

            {/* End of results message */}
            {!hasMore && movies.length > 0 && (
              <div className="end-of-results">
                <p>You've reached the end! 🎬</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
