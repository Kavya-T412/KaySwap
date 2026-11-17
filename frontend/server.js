import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getAllReviews, saveReview, clearAllReviews, getHealthStatus, initPostgres } from './dbService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));

// Additional middleware to ensure CORS headers on every response (including preflight)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// -------------------------------------------------------------
// ROUTES (Strictly for User Feedbacks & Health)
// -------------------------------------------------------------

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const health = await getHealthStatus();
    res.json(health);
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Feedbacks: Fetch all reviews
app.get('/api/feedbacks', async (req, res) => {
  try {
    const feedbacks = await getAllReviews();
    res.json(feedbacks);
  } catch (err) {
    console.error('Error fetching feedbacks:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Feedbacks: Save new user review
app.post('/api/feedbacks', async (req, res) => {
  const item = req.body;
  if (!item || !item.id || !item.address || !item.rating || !item.comment) {
    return res.status(400).json({ error: 'Incomplete feedback payload' });
  }

  try {
    const result = await saveReview(item);
    res.json(result);
  } catch (err) {
    console.error('Error saving feedback:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Feedbacks: Clear reviews
app.delete('/api/feedbacks', async (req, res) => {
  try {
    const result = await clearAllReviews();
    res.json(result);
  } catch (err) {
    console.error('Error clearing feedbacks:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend in production if built
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Bind to 0.0.0.0 and 127.0.0.1
app.listen(PORT, '0.0.0.0', () => {
  console.log(`KaySwap Feedback API server running on port ${PORT} (http://127.0.0.1:${PORT})`);
  initPostgres();
});
