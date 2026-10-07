import { TRACK_URI } from '../utils/content.js';

const KEY = 'g-j.spotify.current-playlist';
export function readCurrentPlaylist() {
  try {
    const data = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    return Array.isArray(data?.uris) && data.uris.length > 0 && data.uris.length <= 3 && data.uris.every((uri) => TRACK_URI.test(uri)) ? data : null;
  } catch { return null; }
}
export function rememberCurrentPlaylist(data) {
  try { if (data) sessionStorage.setItem(KEY, JSON.stringify(data)); else sessionStorage.removeItem(KEY); } catch { /* Playback also works without storage. */ }
}
