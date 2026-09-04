const express = require('express');
const { spotifyFetch } = require('../services/spotifyAuth');

const router = express.Router();

const PLAYLIST_KEYS = {
  principal: () => process.env.SPOTIFY_PLAYLIST_PRINCIPAL_ID,
  sponsor: () => process.env.SPOTIFY_PLAYLIST_SPONSOR_ID,
};

function mapEpisode(item) {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    releaseDate: item.release_date,
    durationMs: item.duration_ms,
    imageUrl: item.images?.[0]?.url ?? null,
    audioPreviewUrl: item.audio_preview_url ?? null,
    externalUrl: item.external_urls?.spotify ?? null,
  };
}

function mapTrack(item) {
  const track = item.track ?? item;
  if (!track) return null;
  return {
    id: track.id,
    name: track.name,
    artists: (track.artists || []).map((a) => a.name).join(', '),
    imageUrl: track.album?.images?.[0]?.url ?? null,
    previewUrl: track.preview_url ?? null,
    externalUrl: track.external_urls?.spotify ?? null,
  };
}

// Episodios del podcast legal/emprendimiento (ej. con la abogada Astrid Cordoba)
router.get('/episodes', async (req, res, next) => {
  try {
    const showId = process.env.SPOTIFY_SHOW_ID;
    if (!showId) {
      return res.status(501).json({
        ok: false,
        error: 'SPOTIFY_SHOW_ID no esta configurado en el servidor todavia.',
      });
    }
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const data = await spotifyFetch(`/shows/${showId}/episodes?market=US&limit=${limit}`);
    res.json({ ok: true, episodes: (data.items || []).map(mapEpisode) });
  } catch (err) {
    next(err);
  }
});

// Playlist principal del canal o playlist patrocinada, segun :key
router.get('/playlist/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const getId = PLAYLIST_KEYS[key];
    if (!getId) {
      return res.status(400).json({ ok: false, error: 'key debe ser "principal" o "sponsor"' });
    }
    const playlistId = getId();
    if (!playlistId) {
      return res.status(501).json({ ok: false, error: `Falta el ID de la playlist "${key}" en el servidor.` });
    }
    const data = await spotifyFetch(`/playlists/${playlistId}/tracks?market=US&limit=50`);
    res.json({ ok: true, tracks: (data.items || []).map(mapTrack).filter(Boolean) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
