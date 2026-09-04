const express = require('express');

const router = express.Router();

// La "cabina en vivo" (stream interactivo + chat) sigue siendo un widget web
// complejo de terceros: en la app se muestra dentro de un WebView, pero la
// URL sale de aqui para poder cambiarla sin publicar una nueva version de la app.
router.get('/', (_req, res) => {
  res.json({
    ok: true,
    embedUrl: process.env.LIVE_EMBED_URL || 'https://estaesmiapp.com/vivo',
    chatEmbedUrl: process.env.LIVE_CHAT_EMBED_URL || 'https://estaesmiapp.com/vivo/chat',
  });
});

module.exports = router;
