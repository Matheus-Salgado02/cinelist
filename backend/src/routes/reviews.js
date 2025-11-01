import express from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /reviews/movie/:movieId - list reviews for a movie (public)
router.get('/movie/:movieId', async (req, res) => {
  try {
    const movieId = Number(req.params.movieId);
    const users = await User.find({ 'reviews.movieId': movieId }).select('name username reviews');
    const results = [];
    for (const u of users) {
      const userObj = u.toObject();
      const userReviews = (userObj.reviews || []).filter(r => Number(r.movieId) === movieId);
      for (const r of userReviews) results.push({ id: r._id, movieId: r.movieId, rating: r.rating, text: r.text, createdAt: r.createdAt, userId: userObj._id, userName: userObj.name || userObj.username || 'User' });
    }
    // sort by createdAt desc
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ reviews: results });
  } catch (err) {
    console.error('GET /reviews error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /reviews - add or update current user's review (requires auth)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { movieId, rating, text } = req.body || {};
    if (!movieId || !rating) return res.status(400).json({ message: 'movieId and rating required' });
    
    // Validate rating is between 1 and 5
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let existing = (user.reviews || []).find(r => Number(r.movieId) === Number(movieId));
    if (existing) {
      existing.rating = numRating;
      existing.text = text || existing.text;
      existing.createdAt = new Date();
    } else {
      user.reviews = user.reviews || [];
      user.reviews.push({ movieId: Number(movieId), rating: numRating, text: text || '' });
      existing = user.reviews[user.reviews.length - 1];
    }

    await user.save();
    const safe = user.toObject(); delete safe.password;
    res.json({ user: safe, review: { id: existing._id, movieId: existing.movieId, rating: existing.rating, text: existing.text, createdAt: existing.createdAt } });
  } catch (err) {
    console.error('POST /reviews error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /reviews/:reviewId - delete a review of current user
router.delete('/:reviewId', requireAuth, async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.reviews = (user.reviews || []).filter(r => String(r._id) !== String(reviewId));
    await user.save();
    const safe = user.toObject(); delete safe.password;
    res.json({ user: safe });
  } catch (err) {
    console.error('DELETE /reviews error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
