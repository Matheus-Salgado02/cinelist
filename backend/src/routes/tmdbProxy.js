import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const TMDB_KEY = process.env.TMDB_API_KEY;
if (!TMDB_KEY) console.warn('TMDB_API_KEY is not set. TMDB proxy will fail.');

router.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'q query required' });
  try {
    const r = await axios.get('https://api.themoviedb.org/3/search/movie', { params: { api_key: TMDB_KEY, query: q } });
    return res.json(r.data);
  } catch (err) {
    console.error(err.message || err);
    return res.status(500).json({ error: 'TMDB search error' });
  }
});

router.get('/movie/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const r = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, { params: { api_key: TMDB_KEY } });
    return res.json(r.data);
  } catch (err) {
    console.error(err.message || err);
    return res.status(500).json({ error: 'TMDB movie error' });
  }
});

export default router;
