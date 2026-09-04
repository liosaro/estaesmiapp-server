const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

// Devuelve la URL del stream (para que el reproductor nativo la consuma
// directamente, sin pasar audio por este servidor) mas el "now playing"
// si el servidor Icecast/Shoutcast expone status-json.xsl.
router.get('/status', async (_req, res) => {
  const streamUrl = process.env.RADIO_STREAM_URL || null;
  const statusUrl = process.env.RADIO_STATUS_URL || null;

  const base = {
    ok: true,
    streamUrl,
    isConfigured: Boolean(streamUrl),
  };

  if (!statusUrl) {
    return res.json({ ...base, nowPlaying: null, listeners: null });
  }

  try {
    const response = await fetch(statusUrl, { timeout: 5000 });
    if (!response.ok) throw new Error(`status ${response.status}`);
    const data = await response.json();
    const source = Array.isArray(data?.icestats?.source)
      ? data.icestats.source[0]
      : data?.icestats?.source;

    res.json({
      ...base,
      nowPlaying: source?.title || source?.yp_currently_playing || null,
      listeners: source?.listeners ?? null,
    });
  } catch (err) {
    // Si el status del servidor de streaming no responde, la radio igual
    // puede reproducirse: solo no mostramos "now playing".
    res.json({ ...base, nowPlaying: null, listeners: null, statusError: String(err.message || err) });
  }
});

module.exports = router;
