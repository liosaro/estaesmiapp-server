const fetch = require('node-fetch');

// Reemplaza a spotify_proxy.php / spotify_refresh_token.json del sitio actual.
// Usa el flujo "Client Credentials" de Spotify: no requiere login de usuario,
// solo sirve para LEER contenido publico (episodios, playlists), que es todo
// lo que la app necesita mostrar.
//
// El client_id/client_secret NUNCA se compilan dentro de la app movil: solo
// existen como variables de entorno en Render.

let cachedToken = null; // { access_token, expires_at }

async function getAccessToken() {
  if (cachedToken && cachedToken.expires_at > Date.now() + 5000) {
    return cachedToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Faltan SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET. Configuralos en .env (local) o en Render > Environment.'
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify token error (${response.status}): ${text}`);
  }

  const data = await response.json();
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
