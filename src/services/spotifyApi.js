import { getAccessToken, SpotifyError } from './spotifyAuth.js';
import { TRACK_URI } from '../utils/content.js';
const metadata = new Map();
let rateLimitedUntil = 0;

export async function spotifyRequest(path, options = {}, retry = true) {
  if (Date.now() < rateLimitedUntil) throw new SpotifyError('O Spotify pediu uma pausa. Tente novamente em alguns instantes.', 'rate-limit', 429);
  const token = await getAccessToken();
  let response;
  try {
    response = await fetch(`https://api.spotify.com/v1${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers }, signal: AbortSignal.timeout(15000) });
  } catch { throw new SpotifyError('O Spotify está indisponível agora. Suas memórias continuam aqui.'); }
  if (response.status === 401 && retry) { await getAccessToken(true); return spotifyRequest(path, options, false); }
  if (response.status === 401) throw new SpotifyError('Conecte o Spotify novamente para continuar ouvindo.', 'authentication', 401);
  if (response.status === 403) throw new SpotifyError('O Spotify não autorizou esta ação. Confira as permissões e o acesso desta conta ao aplicativo.', 'forbidden', 403);
  if (response.status === 404) throw new SpotifyError('Esta música ou dispositivo não está disponível no Spotify.', 'not-found', 404);
  if (response.status === 429) {
    rateLimitedUntil = Date.now() + Math.max(1, Number(response.headers.get('Retry-After')) || 30) * 1000;
    throw new SpotifyError('O Spotify pediu uma pausa. Tente novamente em alguns instantes.', 'rate-limit', 429);
  }
  if (!response.ok) throw new SpotifyError('Não foi possível reproduzir no Spotify. Tente novamente.', 'unavailable', response.status);
  return response.status === 204 ? null : response.json();
}

export function getTrack(uri) {
  if (!TRACK_URI.test(uri)) return Promise.reject(new SpotifyError('Esta música precisa ser atualizada.', 'invalid-track'));
  if (!metadata.has(uri)) {
    const promise = spotifyRequest(`/tracks/${uri.split(':')[2]}`).then((track) => ({
      uri, name: track.name, artist: track.artists?.map((artist) => artist.name).join(', ') || 'Artista indisponível', album: track.album?.name, image: track.album?.images?.[1]?.url || track.album?.images?.[0]?.url, duration: track.duration_ms, url: track.external_urls?.spotify, playable: track.is_playable !== false,
    })).catch((error) => { metadata.delete(uri); throw error; });
    metadata.set(uri, promise);
  }
  return metadata.get(uri);
}

export function clearTrackCache() { metadata.clear(); }
export async function playTracks(deviceId, uris, index = 0) {
  if (!deviceId) throw new SpotifyError('O player está conectando. Aguarde um instante e tente novamente.', 'device');
  await spotifyRequest(`/me/player/play?device_id=${encodeURIComponent(deviceId)}`, { method: 'PUT', body: JSON.stringify({ uris, offset: { position: index }, position_ms: 0 }) });
}
