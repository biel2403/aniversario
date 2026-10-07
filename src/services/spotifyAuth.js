const env = import.meta.env || {};
export const spotifyConfig = {
  clientId: env.VITE_SPOTIFY_CLIENT_ID?.trim() || '',
  redirectUri: env.VITE_SPOTIFY_REDIRECT_URI?.trim() || '',
};
const TOKEN_KEY = 'g-j.spotify.session';
const LOGIN_KEY = 'g-j.spotify.pkce';
const SCOPES = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state';
let refreshing = null;
let callbackPromise = null;

export class SpotifyError extends Error {
  constructor(message, code = 'unavailable', status = 0) {
    super(message); this.name = 'SpotifyError'; this.code = code; this.status = status;
  }
}

function readStorage(key) {
  try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; }
}
function writeStorage(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new SpotifyError('Permita o armazenamento desta aba para conectar o Spotify.', 'storage'); }
}
function removeStorage(key) { try { sessionStorage.removeItem(key); } catch { /* Browsing without Spotify stays available. */ } }
export function disconnectSession() { removeStorage(TOKEN_KEY); removeStorage(LOGIN_KEY); }
export function hasSpotifySession() { return Boolean(readStorage(TOKEN_KEY)?.refresh_token); }
export function hasPlaylistPermission(isPublic = true) {
  return (readStorage(TOKEN_KEY)?.scope || '').split(' ').includes(isPublic ? 'playlist-modify-public' : 'playlist-modify-private');
}
export function isSpotifyConfigured() { return Boolean(spotifyConfig.clientId && spotifyConfig.redirectUri); }

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export async function createPkce() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(64)));
  const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  const state = base64url(crypto.getRandomValues(new Uint8Array(24)));
  return { verifier, challenge, state };
}

export async function beginSpotifyLogin({ playlistAccess = false } = {}) {
  if (!isSpotifyConfigured()) throw new SpotifyError('A conexão com o Spotify ainda não foi configurada. Você pode continuar a viagem sem música.', 'configuration');
  const redirect = new URL(spotifyConfig.redirectUri);
  const loopback = ['127.0.0.1', '[::1]'].includes(redirect.hostname);
  if (redirect.origin !== window.location.origin || (redirect.protocol !== 'https:' && !loopback)) {
    throw new SpotifyError('A conexão com o Spotify não está disponível neste endereço. Continue sem música por enquanto.', 'configuration');
  }
  const pkce = await createPkce();
  writeStorage(LOGIN_KEY, { ...pkce, createdAt: Date.now(), redirectUri: spotifyConfig.redirectUri, returnTo: window.location.pathname === '/playlist' ? '/playlist' : '/' });
  const url = new URL('https://accounts.spotify.com/authorize');
  url.search = new URLSearchParams({ client_id: spotifyConfig.clientId, response_type: 'code', redirect_uri: spotifyConfig.redirectUri, scope: SCOPES + (playlistAccess ? ' playlist-modify-public playlist-modify-private' : ''), state: pkce.state, code_challenge: pkce.challenge, code_challenge_method: 'S256' }).toString();
  window.location.assign(url.toString());
}

async function tokenRequest(body) {
  let response;
  try {
    response = await fetch('https://accounts.spotify.com/api/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body), signal: AbortSignal.timeout(15000) });
  } catch { throw new SpotifyError('Não foi possível alcançar o Spotify. Tente novamente ou continue sem música.'); }
  if (!response.ok) throw new SpotifyError('A sessão do Spotify expirou ou foi recusada. Conecte novamente.', 'authentication', response.status);
  const data = await response.json();
  if (!data.access_token) throw new SpotifyError('O Spotify não retornou uma sessão válida.', 'authentication');
  return data;
}

export function isOAuthCallback() {
  const query = new URLSearchParams(window.location.search);
  return window.location.pathname === '/callback' && (query.has('code') || query.has('error'));
}
function cleanCallback(returnTo) {
  const url = new URL(window.location.href);
  ['code', 'state', 'error', 'error_description'].forEach((key) => url.searchParams.delete(key));
  url.pathname = returnTo === '/playlist' ? '/playlist' : '/';
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  window.dispatchEvent?.(new Event('popstate'));
}
export function finishSpotifyLogin() {
  if (callbackPromise) return callbackPromise;
  callbackPromise = (async () => {
    const query = new URLSearchParams(window.location.search);
    const pending = readStorage(LOGIN_KEY);
    try {
      if (!pending || !query.get('state') || query.get('state') !== pending.state || Date.now() - pending.createdAt > 600000) {
        throw new SpotifyError('Não foi possível validar a conexão. Tente conectar o Spotify novamente.', 'authentication');
      }
      if (query.has('error')) throw new SpotifyError('A conexão foi cancelada. A viagem continua disponível sem Spotify.', 'denied');
      if (!query.get('code')) throw new SpotifyError('A autorização do Spotify está incompleta.', 'authentication');
      const data = await tokenRequest({ grant_type: 'authorization_code', code: query.get('code'), redirect_uri: pending.redirectUri, client_id: spotifyConfig.clientId, code_verifier: pending.verifier });
      writeStorage(TOKEN_KEY, { ...data, expiresAt: Date.now() + data.expires_in * 1000 });
      return true;
    } finally { removeStorage(LOGIN_KEY); cleanCallback(pending?.returnTo); }
  })();
  return callbackPromise;
}

export async function getAccessToken(forceRefresh = false) {
  const session = readStorage(TOKEN_KEY);
  if (!session?.refresh_token) throw new SpotifyError('Conecte o Spotify para ouvir a trilha.', 'authentication');
  if (!forceRefresh && session.access_token && session.expiresAt > Date.now() + 60000) return session.access_token;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const data = await tokenRequest({ grant_type: 'refresh_token', refresh_token: session.refresh_token, client_id: spotifyConfig.clientId });
        writeStorage(TOKEN_KEY, { ...session, ...data, refresh_token: data.refresh_token || session.refresh_token, expiresAt: Date.now() + data.expires_in * 1000 });
        return data.access_token;
      } catch (error) {
        if (error.code === 'authentication') disconnectSession();
        throw error;
      } finally { refreshing = null; }
    })();
  }
  return refreshing;
}
