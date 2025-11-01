import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import '../styles/account_page.css';
import { useNavigate } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { getMovieDetails } from '../services/tmdb';

export default function AccountPage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    favoriteGenres: user?.favoriteGenres || []
  });
  const [loading, setLoading] = useState(false);
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const availableGenres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Romance', 
    'Science Fiction', 'Thriller', 'Documentary', 'Animation',
    'Crime', 'Fantasy', 'Mistery', 'War', 'Music', 'History',
    'TV Movie','Western','Family',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenreToggle = (genre) => {
    setFormData(prev => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.includes(genre)
        ? prev.favoriteGenres.filter(g => g !== genre)
        : [...prev.favoriteGenres, genre]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('handleSubmit called - isEditing:', isEditing);
    
    if (!isEditing) {
      console.log('Not editing, preventing submit');
      return;
    }
    
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      console.log('Updating profile with:', formData);
      await updateProfile(formData);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setErrorMessage(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      favoriteGenres: user?.favoriteGenres || []
    });
    setIsEditing(false);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Update formData when user changes (but not while editing)
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        favoriteGenres: user.favoriteGenres || []
      });
    }
  }, [user, isEditing]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user || !user.watchlist || user.watchlist.length === 0) {
        setWatchlistMovies([]);
        return;
      }

      setLoadingWatchlist(true);
      const results = [];
      for (const id of user.watchlist) {
        try {
          const data = await getMovieDetails(id);
          results.push(data);
        } catch (err) {
          console.warn('Error fetching movie', id, err);
        }
      }
      setWatchlistMovies(results);
      setLoadingWatchlist(false);
    };

    fetchWatchlist();
  }, [user]);

  return (
    <div className="account-page">
      <Header />
      <div className="account-container">
        <div className="account-header">
          <h1>My Account</h1>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="profile-section">
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your name"
                />
              ) : (
                <div className="profile-value">{user?.name || 'Not provided'}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="profile-value">{user?.email}</div>
            </div>

            <div className="form-group">
              <label htmlFor="bio">Biography</label>
              {isEditing ? (
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about you!"
                  rows="4"
                />
              ) : (
                <div className="profile-value">
                  {user?.bio || 'No biography provided'}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Favorite Genres</label>
              {isEditing ? (
                <div className="genres-grid">
                  {availableGenres.map(genre => (
                    <button
                      key={genre}
                      type="button"
                      className={`genre-tag ${formData.favoriteGenres.includes(genre) ? 'selected' : ''}`}
                      onClick={() => handleGenreToggle(genre)}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="genres-display">
                  {user?.favoriteGenres && user.favoriteGenres.length > 0 ? (
                    user.favoriteGenres.map(genre => (
                      <span key={genre} className="genre-tag selected">
                        {genre}
                      </span>
                    ))
                  ) : (
                    <span className="no-genres">No genres selected</span>
                  )}
                </div>
              )}
            </div>

            <div className="form-actions">
              {isEditing ? (
                <>
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  className="edit-button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Edit button clicked');
                    setIsEditing(true);
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Statistics section removed per request */}

        {/* Watchlist section */}
        <section className="account-watchlist">
          <h2>My Watchlist</h2>
          {loadingWatchlist && <p>Loading your watchlist...</p>}
          {!loadingWatchlist && watchlistMovies.length === 0 && (
            <div className="empty-watchlist">Your watchlist is empty.</div>
          )}
          {!loadingWatchlist && watchlistMovies.length > 0 && (
            <div className="watchlist-grid">
              {watchlistMovies.map(m => {
                // Find user's review for this movie
                const userReview = user?.reviews?.find(r => Number(r.movieId) === Number(m.id));
                const userRating = userReview ? userReview.rating : null;
                
                return (
                  <div key={m.id} className="watchlist-item">
                    <MovieCard 
                      movie={m} 
                      imageBase={(window && window.__TMDB_CONFIG && window.__TMDB_CONFIG.images && window.__TMDB_CONFIG.images.secure_base_url) ? window.__TMDB_CONFIG.images.secure_base_url + 'w500' : 'https://image.tmdb.org/t/p/w500'}
                      size="w500"
                      userRating={userRating}
                      onClick={() => navigate(`/movie/${m.id}`)} 
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}