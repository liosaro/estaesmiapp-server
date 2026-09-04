require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const spotifyRoutes = require('./src/routes/spotify');
const radioRoutes = require('./src/routes/radio');
const videoRoutes = require('./src/routes/videos');
const eventRoutes = require('./src/routes/events');
const liveRoutes = require('./src/routes/live');

const app = express();
const PORT = process.env.PORT || 4000;

// La app movil nunca habla directo con Spotify/YouTube: todas las claves
// secretas viven aqui, en el servidor, y solo salen tokens/datos ya filtrados.
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Limite razonable para que la app movil no pueda tumbar el proxy
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'estaesmiapp-server',
    endpoints: [
      'GET /api/health',
      'GET /api/radio/status',
      'GET /api/podcasts/episodes',
      'GET /api/podcasts/playlist/:key (principal|sponsor)',
      'GET /api/videos',
      'GET /api/events',
      'GET /api/live',
    ],
  });
});

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/radio', radioRoutes);
app.use('/api/podcasts', spotifyRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/live', liveRoutes);

app.use((err, _req, res, _next) => {
  console.error('[estaesmiapp-server] error:', err);
  res.status(500).json({ ok: false, error: 'internal_error' });
});

app.listen(PORT, () => {
  console.log(`estaesmiapp-server escuchando en puerto ${PORT}`);
});
