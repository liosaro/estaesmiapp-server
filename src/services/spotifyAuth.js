const fetch = require('node-fetch');

// Client Credentials ya no alcanza para leer playlists/episodios: Spotify
// exige un token autenticado por una persona real, aunque el contenido
// sea publico (lo mismo que ya resolvimos en el sitio web). Por eso, si
// existe SPOTIFY_REFRESH_TOKEN en el entorno, lo usamos para renovar el
// access_token en vez de client_credentials. Ver rutas /auth/login y
// /auth/callback en routes/spotify.js para obtener ese refresh_token
// una sola vez.

let cachedToken = null; // { access_token, expires_at }

async function getAccessToken() {
  if (cachedToken && cachedToken.expires_at > Date.now() + 5000) {
    return cachedToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Faltan SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET. Configuralos en .env (local) o en Render > Environment.'
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const body = refreshToken
    ? `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`
    : 'grant_type=client_credentials';

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify token error (${response.status}): ${text}`);
  }

  const data = await response.json();
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    console.log('[spotifyAuth] Spotify roto el refresh_token. Actualiza SPOTIFY_REFRESH_TOKEN en Render con:', data.refresh_token);
  }
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.access_token;
}

async function spotifyFetch(path) {
  const token = await getAccessToken();
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify API error (${response.status}) en ${path}: ${text}`);
  }
  return response.json();
}

module.exports = { getAccessToken, spotifyFetch };
