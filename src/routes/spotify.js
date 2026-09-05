const express = require('express');
const fetch = require('node-fetch');
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

// --- Login unico para obtener un refresh_token (necesario para episodios;
// las playlists ya no lo requieren, ver mas abajo) ---
router.get('/auth/login', (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = 'https://estaesmiapp-server.onrender.com/api/podcasts/auth/callback';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'playlist-read-private playlist-read-collaborative',
    show_dialog: 'true',
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

router.get('/auth/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.status(400).send(`Error de Spotify: ${error}`);

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = 'https://estaesmiapp-server.onrender.com/api/podcasts/auth/callback';
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(500).send(`<pre>Error al canjear el codigo: ${JSON.stringify(data, null, 2)}</pre>`);
    }
    res.send(`
      <h2>Listo</h2>
      <p>Copia este valor completo y pegalo en Render como <b>SPOTIFY_REFRESH_TOKEN</b>:</p>
      <textarea style="width:100%;height:100px">${data.refresh_token}</textarea>
      <p>Despues de guardarlo en Render, ya puedes cerrar esta pagina.</p>
    `);
  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

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

// Playlist principal del canal o playlist patrocinada, segun :key.
// Nota: Spotify bloquea con 403 la lectura de tracks via API (incluso de
// playlists propias) para apps sin "Extended Quota Mode" aprobado por
// Spotify. En vez de pelear con eso, devolvemos la URL del reproductor
// embebido oficial (el mismo truco que ya usa la web para los episodios),
// que no tiene esa restriccion.
router.get('/playlist/:key', (req, res) => {
  const { key } = req.params;
  const getId = PLAYLIST_KEYS[key];
  if (!getId) {
    return res.status(400).json({ ok: false, error: 'key debe ser "principal" o "sponsor"' });
  }
  const playlistId = getId();
  if (!playlistId) {
    return res.status(501).json({ ok: false, error: `Falta el ID de la playlist "${key}" en el servidor.` });
  }
  res.json({
    ok: true,
    embedUrl: `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`,
  });
});

module.exports = router;
