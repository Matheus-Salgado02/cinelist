import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetails, getConfiguration } from '../services/tmdb';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/movie_details.css';

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated, addToWatchlist, removeFromWatchlist, addOrUpdateReview, removeReview, getReviewsForMovie } = useAuth();
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 3, text: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    async function loadMovie() {
      try {
        const cfg = await getConfiguration();
        setConfig(cfg);
        
        const movieData = await getMovieDetails(id);
        setMovie(movieData);
      } catch (err) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }
    
    if (id) loadMovie();
  }, [id]);

  // Load reviews when movie loads
  useEffect(() => {
    async function loadReviews() {
      if (!id) return;
      setReviewsLoading(true);
      try {
        const reviewsData = await getReviewsForMovie(id);
        setReviews(reviewsData);
        
        // Find user's own review if logged in
        if (user && reviewsData) {
          const myReview = reviewsData.find(r => String(r.userId) === String(user._id));
          if (myReview) {
            setUserReview(myReview);
            setReviewForm({ rating: myReview.rating, text: myReview.text || '' });
          }
        }
      } catch (err) {
        console.error('Error loading reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    }
    
    loadReviews();
  }, [id, user]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    setReviewSubmitting(true);
    try {
      const review = await addOrUpdateReview(Number(id), Number(reviewForm.rating), reviewForm.text);
      setUserReview(review);
      setShowReviewForm(false);
      
      // Reload reviews to show the new one
      const reviewsData = await getReviewsForMovie(id);
      setReviews(reviewsData);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!userReview) return;
    if (!confirm('Are you sure you want to delete your review?')) return;
    
    try {
      await removeReview(userReview.id);
      setUserReview(null);
      setReviewForm({ rating: 5, text: '' });
      
      // Reload reviews
      const reviewsData = await getReviewsForMovie(id);
      setReviews(reviewsData);
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Failed to delete review. Please try again.');
    }
  };

  const getImageUrl = (path, size = 'w500') => {
    if (!config || !path) return '';
    return config.images.secure_base_url + size + path;
  };

  const formatRuntime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="movie-details-page">
        <Header />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="movie-details-page">
        <Header />
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!movie) return null;

  const backdrop = getImageUrl(movie.backdrop_path, 'original');
  const poster = getImageUrl(movie.poster_path, 'w500');

  return (
    <div className="movie-details-page">
      <Header />
      
      <div className="movie-hero" style={{ backgroundImage: `url(${backdrop})` }}>
        <div className="movie-hero-overlay">
          <div className="movie-hero-content">
            {/* Back button moved to Header component */}
            <div className="movie-info">
              <div className="movie-poster">
                <img src={poster} alt={movie.title} />
              </div>
              
              <div className="movie-details">
                <h1 className="movie-title">{movie.title}</h1>
                
                <div className="movie-meta">
                  <span className="release-date">{formatDate(movie.release_date)}</span>
                  <span className="runtime">{formatRuntime(movie.runtime)}</span>
                  <span className="rating">★ {(movie.vote_average / 2).toFixed(1)}/5</span>
                </div>
                
                <div className="genres">
                  {movie.genres?.map(genre => (
                    <span key={genre.id} className="genre">{genre.name}</span>
                  ))}
                </div>
                
                <p className="overview">{movie.overview}</p>
                
                <div className="actions">
                  {isAuthenticated() ? (
                    <button
                      className="watchlist-button"
                      onClick={async () => {
                        setWatchlistLoading(true);
                        try {
                          const inList = (user?.watchlist || []).map(Number).includes(Number(movie.id));
                          if (inList) {
                            await removeFromWatchlist(movie.id);
                          } else {
                            await addToWatchlist({ id: movie.id });
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setWatchlistLoading(false);
                        }
                      }}
                      disabled={watchlistLoading}
                    >
                      {watchlistLoading ? 'Saving...' : ((user?.watchlist || []).map(Number).includes(Number(movie.id)) ? 'Remove from Watchlist' : 'Add to Watchlist')}
                    </button>
                  ) : (
                    <button className="watchlist-button" onClick={() => navigate('/login')}>Sign in to add</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="movie-content">
        <div className="container">
          {movie.credits?.cast && movie.credits.cast.length > 0 && (
            <section className="cast-section">
              <h2>Cast</h2>
              <div className="cast-grid">
                {movie.credits.cast.slice(0, 6).map(person => (
                  <div key={person.id} className="cast-member">
                    <div className="cast-photo">
                      {person.profile_path ? (
                        <img src={getImageUrl(person.profile_path, 'w185')} alt={person.name} />
                      ) : (
                        <div className="no-photo">👤</div>
                      )}
                    </div>
                    <div className="cast-info">
                      <div className="cast-name">{person.name}</div>
                      <div className="cast-character">{person.character}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          <section className="details-section">
            <h2>Details</h2>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Budget:</span>
                <span className="detail-value">
                  {movie.budget > 0 ? `$${(movie.budget / 1000000).toFixed(0)}M` : 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Revenue:</span>
                <span className="detail-value">
                  {movie.revenue > 0 ? `$${(movie.revenue / 1000000).toFixed(0)}M` : 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Language:</span>
                <span className="detail-value">{movie.original_language.toUpperCase()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value">{movie.status}</span>
              </div>
            </div>
          </section>

          {/* Reviews Section */}
          <section className="reviews-section">
            <div className="reviews-header">
              <h2>Reviews</h2>
              {isAuthenticated() && !showReviewForm && (
                <button 
                  className="write-review-button"
                  onClick={() => setShowReviewForm(true)}
                >
                  {userReview ? 'Edit Your Review' : 'Write a Review'}
                </button>
              )}
              {!isAuthenticated() && (
                <button 
                  className="write-review-button"
                  onClick={() => navigate('/login')}
                >
                  Sign in to Review
                </button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && isAuthenticated() && (
              <div className="review-form-container">
                <form className="review-form" onSubmit={handleReviewSubmit}>
                  <h3>{userReview ? 'Edit Your Review' : 'Write Your Review'}</h3>
                  
                  <div className="form-group">
                    <label htmlFor="rating">Rating</label>
                    <div className="rating-input">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          type="button"
                          className={`rating-btn ${reviewForm.rating >= num ? 'active' : ''}`}
                          onClick={() => setReviewForm({ ...reviewForm, rating: num })}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <div className="rating-display">
                      Selected: {reviewForm.rating}/5
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="review-text">Your Review</label>
                    <textarea
                      id="review-text"
                      value={reviewForm.text}
                      onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                      placeholder="Share your thoughts about this movie..."
                      rows="6"
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="submit-review-btn"
                      disabled={reviewSubmitting}
                    >
                      {reviewSubmitting ? 'Submitting...' : (userReview ? 'Update Review' : 'Submit Review')}
                    </button>
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => {
                        setShowReviewForm(false);
                        if (userReview) {
                          setReviewForm({ rating: userReview.rating, text: userReview.text || '' });
                        } else {
                          setReviewForm({ rating: 3, text: '' });
                        }
                      }}
                    >
                      Cancel
                    </button>
                    {userReview && (
                      <button 
                        type="button" 
                        className="delete-review-btn"
                        onClick={handleReviewDelete}
                      >
                        Delete Review
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            <div className="reviews-list">
              {reviewsLoading && <p className="loading-reviews">Loading reviews...</p>}
              
              {!reviewsLoading && reviews.length === 0 && (
                <p className="no-reviews">No reviews yet. Be the first to review!</p>
              )}

              {!reviewsLoading && reviews.length > 0 && (
                <div className="reviews-grid">
                  {reviews.map(review => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <div className="review-author no-avatar">
                          <div className="author-info">
                            <h4>{review.userName}</h4>
                            <span className="review-date">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="review-rating">
                          <span className="rating-star">★</span>
                          <span className="rating-value">{review.rating}/5</span>
                        </div>
                      </div>
                      {review.text && (
                        <p className="review-text">{review.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}