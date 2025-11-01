import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './movie_card.css';

export default function MovieCard({ movie, imageBase, size = 'w500', isHighlighted = false, userRating = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  // imageBase may be undefined in some pages (watchlist). Use a safe default TMDB base when missing.
  const base = imageBase ? imageBase.replace('/w342', `/${size}`) : `https://image.tmdb.org/t/p/${size}`;
  const poster = movie.poster_path ? `${base}${movie.poster_path}` : '';
  
  const handleClick = () => {
    // pass current location (path + search) so details page can return here
    const from = location.pathname + (location.search || '');
    navigate(`/movie/${movie.id}`, { state: { from } });
  };
  
  return (
    <div 
      className={`movie-card ${isHighlighted ? 'highlighted' : ''}`}
      onClick={handleClick}
    >
      <div className="poster-wrap">
        {poster ? (
          <img className="poster" src={poster} alt={movie.title || movie.name} />
        ) : (
          <div className="poster placeholder">No Image</div>
        )}
        {userRating !== null && userRating !== undefined && (
          <div className="user-rating-badge">
            <span className="rating-star">★</span>
            <span className="rating-number">{userRating}/5</span>
          </div>
        )}
      </div>
      <div className="movie-title">{movie.title || movie.name}</div>
    </div>
  );
}
