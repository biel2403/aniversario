import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

const originalFetch = globalThis.fetch;
const values = new Map();
globalThis.sessionStorage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
let destination;
globalThis.window = { location: { origin: 'http://127.0.0.1:5173', pathname: '/', search: '', href: 'http://127.0.0.1:5173/', assign: (url) => { destination = url; } }, history: { replaceState: () => {} } };
const auth = await import('../src/services/spotifyAuth.js');
auth.spotifyConfig.clientId = 'client-for-automated-tests';
auth.spotifyConfig.redirectUri = 'http://127.0.0.1:5173/callback';
test.afterEach(() => { globalThis.fetch = originalFetch; values.clear(); });

test('PKCE gera S256 válido com aleatoriedade e sem Client Secret', async () => {
  const first = await auth.createPkce();
  const second = await auth.createPkce();
  assert.notEqual(first.verifier, second.verifier);
  assert.notEqual(first.state, second.state);
  assert.match(first.verifier, /^[A-Za-z0-9_-]{43,128}$/);
  const digest = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(first.verifier));
  assert.equal(Buffer.from(digest).toString('base64url'), first.challenge);
  await auth.beginSpotifyLogin();
  const url = new URL(destination);
  assert.equal(url.origin, 'https://accounts.spotify.com');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.has('client_secret'), false);
});
test('renova token expirado uma única vez em requisições simultâneas e preserva refresh_token', async () => {
  values.set('g-j.spotify.session', JSON.stringify({ access_token: 'expired', refresh_token: 'old-refresh', expiresAt: 0 }));
  let calls = 0;
  globalThis.fetch = async (_, options) => { calls++; assert.equal(options.body.get('grant_type'), 'refresh_token'); return new Response(JSON.stringify({ access_token: 'new-token', expires_in: 3600 }), { status: 200 }); };
  const tokens = await Promise.all([auth.getAccessToken(), auth.getAccessToken(), auth.getAccessToken()]);
  assert.deepEqual(tokens, ['new-token', 'new-token', 'new-token']); assert.equal(calls, 1);
  assert.equal(JSON.parse(values.get('g-j.spotify.session')).refresh_token, 'old-refresh');
});
test('rejeita callback com estado diferente antes de acessar a rede e limpa a URL', async () => {
  const fresh = await import('../src/services/spotifyAuth.js?invalid-state');
  values.set('g-j.spotify.pkce', JSON.stringify({ verifier: 'verifier', state: 'expected-state', createdAt: Date.now() }));
  window.location.search = '?code=private-code&state=wrong-state'; window.location.href = 'http://127.0.0.1:5173/callback' + window.location.search; window.location.pathname = '/callback';
  let called = false; let cleaned = '';
  globalThis.fetch = async () => { called = true; throw new Error('Should not fetch'); };
  window.history.replaceState = (_, __, url) => { cleaned = url; };
  await assert.rejects(fresh.finishSpotifyLogin(), /validar/);
  assert.equal(called, false); assert.equal(cleaned, '/'); assert.equal(values.has('g-j.spotify.pkce'), false);
});
test('callback válido troca código uma vez, inclui verificador e limpa dados transitórios', async () => {
  const fresh = await import('../src/services/spotifyAuth.js?valid-state');
  fresh.spotifyConfig.clientId = 'client-for-automated-tests';
  values.set('g-j.spotify.pkce', JSON.stringify({ verifier: 'verified-pkce', state: 'expected-state', redirectUri: 'http://127.0.0.1:5173/callback', createdAt: Date.now() }));
  window.location.search = '?code=test-only-code&state=expected-state';
  window.location.href = 'http://127.0.0.1:5173/callback' + window.location.search;
  let calls = 0;
  globalThis.fetch = async (_, options) => {
    calls++;
    assert.equal(options.body.get('code_verifier'), 'verified-pkce');
    assert.equal(options.body.get('code'), 'test-only-code');
    assert.equal(options.body.has('client_secret'), false);
    return new Response(JSON.stringify({ access_token: 'token', refresh_token: 'refresh', expires_in: 3600 }), { status: 200 });
  };
  assert.deepEqual(await Promise.all([fresh.finishSpotifyLogin(), fresh.finishSpotifyLogin()]), [true, true]);
  assert.equal(calls, 1); assert.equal(values.has('g-j.spotify.pkce'), false);
  assert.equal(JSON.parse(values.get('g-j.spotify.session')).access_token, 'token');
});
test('callback vencido não envia o código ao Spotify', async () => {
  const fresh = await import('../src/services/spotifyAuth.js?expired-state');
  values.set('g-j.spotify.pkce', JSON.stringify({ verifier: 'verifier', state: 'expected-state', createdAt: Date.now() - 601000 }));
  window.location.search = '?code=unused&state=expected-state'; window.location.href = 'http://127.0.0.1:5173/callback' + window.location.search;
  let called = false;
  globalThis.fetch = async () => { called = true; return new Response('{}'); };
  await assert.rejects(fresh.finishSpotifyLogin(), /validar/);
  assert.equal(called, false);
});
test('sessão expirada recusada é removida e erro de rede preserva possibilidade de tentar novamente', async () => {
  values.set('g-j.spotify.session', JSON.stringify({ refresh_token: 'old-refresh', expiresAt: 0 }));
  globalThis.fetch = async () => new Response('{}', { status: 400 });
  await assert.rejects(auth.getAccessToken(), /expirou/); assert.equal(auth.hasSpotifySession(), false);
  values.set('g-j.spotify.session', JSON.stringify({ refresh_token: 'old-refresh', expiresAt: 0 }));
  globalThis.fetch = async () => { throw new TypeError('network'); };
  await assert.rejects(auth.getAccessToken(), /alcançar/); assert.equal(auth.hasSpotifySession(), true);
});
test('metadados usam URI internamente e respostas HTTP têm falhas legíveis', async () => {
  values.set('g-j.spotify.session', JSON.stringify({ access_token: 'valid', refresh_token: 'refresh', expiresAt: Date.now() + 3600000 }));
  const api = await import('../src/services/spotifyApi.js');
  const uri = 'spotify:track:0123456789ABCDEFGHIJKL';
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(JSON.stringify({ name: 'Track fixture', artists: [{ name: 'Artist fixture' }], album: { name: 'Album fixture', images: [] }, duration_ms: 100000 }), { status: 200 }); };
  const metadata = await api.getTrack(uri); await api.getTrack(uri);
  assert.equal(metadata.name, 'Track fixture'); assert.equal(metadata.artist, 'Artist fixture'); assert.equal(calls, 1);
  globalThis.fetch = async () => new Response('{}', { status: 403 });
  await assert.rejects(api.spotifyRequest('/me/player/play'), /não autorizou/);
  globalThis.fetch = async () => new Response('{}', { status: 429, headers: { 'Retry-After': '1' } });
  await assert.rejects(api.spotifyRequest('/me/player/play'), /pausa/);
});
