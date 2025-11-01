import express from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// add to watchlist (expects body { movieId })
router.post('/', requireAuth, async (req, res) => {
  try {
    let { movieId } = req.body || {};
    console.log('[watchlist] POST received from user:', req.user && req.user._id, 'body:', req.body);
    movieId = Number(movieId);
    if (!movieId && movieId !== 0) return res.status(400).json({ message: 'movieId required' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.watchlist = user.watchlist || [];
    if (!user.watchlist.some(id => Number(id) === movieId)) user.watchlist.push(movieId);
    await user.save();
    const safe = user.toObject(); delete safe.password;
    res.json({ user: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// remove from watchlist
router.delete('/:movieId', requireAuth, async (req, res) => {
  try {
    const movieId = Number(req.params.movieId);
    console.log('[watchlist] DELETE received from user:', req.user && req.user._id, 'movieId:', movieId);
    const user = await User.findById(req.user._id);
    user.watchlist = (user.watchlist || []).filter(id => Number(id) !== movieId);
    await user.save();
    const safe = user.toObject(); delete safe.password;
    res.json({ user: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
