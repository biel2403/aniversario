import { spotifyRequest } from './spotifyApi.js';
import { hasPlaylistPermission, SpotifyError } from './spotifyAuth.js';
import { TRACK_URI } from '../utils/content.js';

const KEY = 'g-j.spotify.saved-playlists';
let saving = false;
function readCheckpoints() {
  try { const data = JSON.parse(sessionStorage.getItem(KEY) || '{}'); return data && typeof data === 'object' && !Array.isArray(data) ? data : {}; } catch { return {}; }
}
function checkpoint(key, data) {
  const all = readCheckpoints();
  all[key] = data;
  try { sessionStorage.setItem(KEY, JSON.stringify(all)); }
  catch { throw new SpotifyError('Permita o armazenamento desta aba para salvar sua playlist com segurança.', 'storage'); }
}
export function clearSavedPlaylists() { try { sessionStorage.removeItem(KEY); } catch { /* No session to clear. */ } }

// Called only by the explicit save button. Checkpoints are scoped to the Spotify owner.
export async function savePlaylist({ name, uris, isPublic = true }) {
  name = name?.trim();
  if (!name || name.length > 100 || !Array.isArray(uris) || !uris.length || !uris.every((uri) => TRACK_URI.test(uri))) {
    throw new SpotifyError('Escolha uma trilha e dê um nome à playlist antes de salvar.', 'invalid-playlist');
  }
  if (!hasPlaylistPermission(isPublic)) throw new SpotifyError('Autorize o Spotify a salvar playlists na sua conta.', 'playlist-permission');
  if (saving) throw new SpotifyError('A playlist já está sendo salva. Aguarde um instante.', 'busy');
  saving = true;
  try {
    const owner = await spotifyRequest('/me');
    if (!owner?.id) throw new SpotifyError('Não foi possível identificar sua conta do Spotify. Conecte novamente.', 'authentication');
    const key = JSON.stringify([owner.id, name, isPublic, uris]);
    let saved = readCheckpoints()[key];
    if (saved?.complete) return saved;
    if (!saved?.id) {
      // Check writable storage before creating anything; it retains an ID for safe retries.
      checkpoint(key, null);
      let playlist;
      try {
        playlist = await spotifyRequest('/me/playlists', {
          method: 'POST', body: JSON.stringify({ name, public: isPublic, collaborative: false, description: 'A trilha da Máquina do Tempo — Gabriel & Júlia.' }),
        });
      } catch (error) {
        if (!error.status && error.code === 'unavailable') throw new SpotifyError('O Spotify não confirmou a criação. Confira sua biblioteca antes de tentar novamente.', 'playlist-uncertain');
        throw error;
      }
      if (!playlist?.id) throw new SpotifyError('O Spotify não confirmou a criação. Confira sua biblioteca antes de tentar novamente.');
      saved = { id: playlist.id, name, isPublic, uris: [...uris], url: `https://open.spotify.com/playlist/${encodeURIComponent(playlist.id)}`, owner: owner.display_name || '', complete: false };
      checkpoint(key, saved);
    }
    try {
      // Every retry replaces from the beginning, so even a failed append cannot duplicate songs.
      const path = `/playlists/${encodeURIComponent(saved.id)}/items`;
      await spotifyRequest(path, { method: 'PUT', body: JSON.stringify({ uris: uris.slice(0, 100) }) });
      for (let offset = 100; offset < uris.length; offset += 100) {
        await spotifyRequest(path, { method: 'POST', body: JSON.stringify({ uris: uris.slice(offset, offset + 100) }) });
      }
    } catch (error) {
      if (error.code === 'authentication') throw error;
      throw new SpotifyError(`A playlist foi criada, mas as músicas ainda não foram confirmadas. ${error.status === 429 ? error.message : 'Tente novamente para concluir a mesma playlist.'}`, 'playlist-incomplete', error.status);
    }
    saved = { ...saved, complete: true };
    checkpoint(key, saved);
    return saved;
  } finally { saving = false; }
}
