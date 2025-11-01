import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { getMovieDetails } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import './watchlist.css';

export default function Watchlist() {
  const { user, loading, removeFromWatchlist } = useAuth();
  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // try to obtain imageBase from global config (set in home_page) or fallback
  const imageBase = (window && window.__TMDB_CONFIG && window.__TMDB_CONFIG.images && window.__TMDB_CONFIG.images.secure_base_url) ? window.__TMDB_CONFIG.images.secure_base_url + 'w342' : 'https://image.tmdb.org/t/p/w342';

  useEffect(() => {
    const fetchMovies = async () => {
      if (!user || !user.watchlist || user.watchlist.length === 0) {
          setMovies([]);
          return;
        }

      setLoadingMovies(true);
      setError(null);

      const results = [];
      for (const id of user.watchlist) {
        try {
          const data = await getMovieDetails(id);
          results.push(data);
        } catch (err) {
          // ignore invalid ids
          console.warn('Error fetching movie', id, err);
        }
      }

      setMovies(results);
      setLoadingMovies(false);
    };

    fetchMovies();
  }, [user]);

  const handleRemove = async (movieId) => {
    try {
      await removeFromWatchlist(movieId);
      setMovies((m) => m.filter(x => x.id !== movieId));
    } catch (err) {
      setError('Could not remove from watchlist');
    }
  };

  if (loading) return <div className="page">Loading...</div>;

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div>
      <Header />
      <div className="page watchlist-page">
        <div className="watchlist-top">
          <button className="back-button" onClick={() => navigate(-1)}>Back</button>
          <h2>My Watchlist</h2>
        </div>

        {loadingMovies && <p>Loading your watchlist...</p>}
        {error && <p className="error">{error}</p>}

        {!loadingMovies && movies.length === 0 && (
          <div className="empty">Your watchlist is empty.</div>
        )}

        <div className="watchlist-grid">
          {movies.map(movie => {
            // Find user's review for this movie
            const userReview = user?.reviews?.find(r => Number(r.movieId) === Number(movie.id));
            const userRating = userReview ? userReview.rating : null;
            
            return (
              <div key={movie.id} className="watchlist-item">
                <MovieCard 
                  movie={movie} 
                  imageBase={imageBase}
                  size="w500"
                  userRating={userRating}
                  onClick={() => navigate(`/movie/${movie.id}`)} 
                />
                <button className="remove-button" onClick={() => handleRemove(movie.id)}>Remove</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
