# estaesmiapp-server

Backend en Node/Express que la app movil consulta para radio, podcasts (Spotify),
videos (YouTube) y eventos. Reemplaza y moderniza a `spotify_proxy.php`: las
claves secretas de Spotify/YouTube viven solo aqui, nunca dentro de la app.

## Desarrollo local

```bash
cd server
cp .env.example .env   # completa tus claves reales
npm install
npm run dev             # http://localhost:4000
```

## Deploy en Render

1. Sube esta carpeta `server/` a un repositorio de GitHub/GitLab (puede ser el
   mismo repo del sitio web, en una carpeta separada, o uno nuevo solo para el backend).
2. En Render: **New > Blueprint**, apunta al repo, y Render detecta `render.yaml`
   automaticamente. O bien **New > Web Service** manual con:
   - Build command: `npm install`
   - Start command: `npm start`
   - Root directory: `server` (si el repo tiene mas carpetas, ej. el sitio web)
3. En **Environment**, carga las variables reales (ver `.env.example`):
   `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_SHOW_ID`,
   `SPOTIFY_PLAYLIST_PRINCIPAL_ID`, `SPOTIFY_PLAYLIST_SPONSOR_ID`,
   `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, `RADIO_STREAM_URL`,
   `RADIO_STATUS_URL`, `LIVE_EMBED_URL`, `LIVE_CHAT_EMBED_URL`.
4. Copia la URL publica que te da Render (algo como
   `https://estaesmiapp-server.onrender.com`) y pegala como `apiBaseUrl` en
   `app/lib/services/api_config.dart`.

Sin las variables de Spotify/YouTube configuradas, los endpoints de video y
eventos responden con datos de ejemplo (`mocked: true`) para que la app
funcione de inmediato; podcasts requiere las credenciales de Spotify si o si.

## Endpoints

| Metodo | Ruta                          | Descripcion                                   |
|--------|-------------------------------|------------------------------------------------|
| GET    | /api/health                   | Chequeo de salud                                |
| GET    | /api/radio/status              | URL del stream + now playing                    |
| GET    | /api/podcasts/episodes         | Episodios del podcast (Spotify Show)            |
| GET    | /api/podcasts/playlist/:key    | Tracks de playlist `principal` o `sponsor`      |
| GET    | /api/videos                    | Videos del canal de YouTube                     |
| GET    | /api/events                    | Eventos comunitarios (mock, listo para reemplazar) |
| GET    | /api/live                      | URLs de la cabina en vivo + chat                |
