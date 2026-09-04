const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

const MOCK_VIDEOS = [
  {
    id: 'mock1',
    title: 'Historias de exito: de la comunidad para la comunidad',
    thumbnailUrl: null,
    publishedAt: '2026-08-15T00:00:00Z',
    youtubeId: 'dQw4w9WgXcQ',
  },
  {
    id: 'mock2',
    title: 'Como iniciar tu negocio siendo inmigrante en NY',
    thumbnailUrl: null,
    publishedAt: '2026-08-01T00:00:00Z',
    youtubeId: 'dQw4w9WgXcQ',
  },
];

// Videos del canal de YouTube (historias de exito, contenido educativo).
// Si no hay API key configurada todavia, devuelve datos de ejemplo con el
// mismo formato para que la app funcione de punta a punta desde ya.
router.get('/', async (req, res, next) => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    if (!apiKey || !channelId) {
      return res.json({ ok: true, mocked: true, videos: MOCK_VIDEOS });
    }

    const maxResults = Math.min(Number(req.query.limit) || 20, 50);
    const url =
      `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}` +
      `&part=snippet&order=date&maxResults=${maxResults}&type=video`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`YouTube API error ${response.status}`);
    const data = await response.json();

    const videos = (data.items || []).map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url ?? null,
      publishedAt: item.snippet.publishedAt,
      youtubeId: item.id.videoId,
    }));

    res.json({ ok: true, mocked: false, videos });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
