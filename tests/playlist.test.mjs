import test from 'node:test';
import assert from 'node:assert/strict';

const values = new Map();
globalThis.sessionStorage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
let destination;
let cleaned;
globalThis.window = { location: { origin: 'http://127.0.0.1:5173', pathname: '/playlist', search: '', href: 'http://127.0.0.1:5173/playlist', assign: (url) => { destination = url; } }, history: { replaceState: (_, __, url) => { cleaned = url; } } };
const auth = await import('../src/services/spotifyAuth.js');
const { savePlaylist, clearSavedPlaylists } = await import('../src/services/spotifyPlaylist.js');
const storage = await import('../src/services/playlistStorage.js');
const uris = ['spotify:track:0123456789ABCDEFGHIJKL', 'spotify:track:ABCDEFGHIJKLMNOPQRSTUV'];
const input = { name: 'Nossa trilha', uris, isPublic: true };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
function session(scope = 'playlist-modify-public playlist-modify-private') {
  values.set('g-j.spotify.session', JSON.stringify({ access_token: 'test-access', refresh_token: 'test-refresh', expiresAt: Date.now() + 3600000, scope }));
}
test.beforeEach(() => { values.clear(); session(); });

test('salva na conta autenticada, em ordem, com visibilidade explícita e sem duplicar o mesmo salvamento', async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push([url.replace('https://api.spotify.com/v1', ''), options.method || 'GET', options.body && JSON.parse(options.body)]);
    if (url.endsWith('/me')) return json({ id: 'julia-test-owner', display_name: 'Conta de teste' });
    if (url.endsWith('/me/playlists')) return json({ id: 'new-playlist' }, 201);
    return json({ snapshot_id: 'saved' });
  };
  const saved = await savePlaylist(input);
  assert.equal(saved.complete, true);
  assert.equal(saved.url, 'https://open.spotify.com/playlist/new-playlist');
  assert.deepEqual(calls, [
    ['/me', 'GET', undefined],
    ['/me/playlists', 'POST', { name: 'Nossa trilha', public: true, collaborative: false, description: 'A trilha da Máquina do Tempo — Gabriel & Júlia.' }],
    ['/playlists/new-playlist/items', 'PUT', { uris }],
  ]);
  assert.deepEqual(await savePlaylist(input), saved);
  assert.equal(calls.filter((call) => call[1] === 'POST').length, 1);
  assert.equal(calls.filter((call) => call[1] === 'PUT').length, 1);
});

test('falha após criar retoma a mesma playlist mesmo após recarregar o serviço', async () => {
  let creates = 0; let fills = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith('/me')) return json({ id: 'owner' });
    if (url.endsWith('/me/playlists')) { creates++; return json({ id: 'resume-this-id' }, 201); }
    assert.match(url, /\/playlists\/resume-this-id\/items$/);
    fills++;
    if (fills === 1) throw new TypeError('network interrupted');
    return json({ snapshot_id: 'complete' });
  };
  await assert.rejects(savePlaylist(input), /mesma playlist/);
  const fresh = await import('../src/services/spotifyPlaylist.js?retry');
  const saved = await fresh.savePlaylist(input);
  assert.equal(saved.id, 'resume-this-id'); assert.equal(creates, 1); assert.equal(fills, 2);
});

test('conta diferente recebe sua própria playlist, sem alterar a playlist da outra pessoa', async () => {
  let owner = 'one'; let creates = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith('/me')) return json({ id: owner });
    if (url.endsWith('/me/playlists')) { creates++; return json({ id: `playlist-${owner}` }, 201); }
    assert.match(url, new RegExp(`/playlist-${owner}/items$`));
    return json({ snapshot_id: 'complete' });
  };
  assert.equal((await savePlaylist(input)).id, 'playlist-one');
  owner = 'two';
  assert.equal((await savePlaylist(input)).id, 'playlist-two'); assert.equal(creates, 2);
});

test('modo privado usa apenas permissão privada e envia public:false', async () => {
  session('playlist-modify-private');
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/me')) return json({ id: 'owner' });
    if (url.endsWith('/me/playlists')) { assert.equal(JSON.parse(options.body).public, false); return json({ id: 'private' }, 201); }
    return json({ snapshot_id: 'complete' });
  };
  assert.equal((await savePlaylist({ ...input, isPublic: false })).isPublic, false);
  await assert.rejects(savePlaylist(input), (error) => error.code === 'playlist-permission');
});

test('não escreve com músicas inválidas, nome vazio ou permissão ausente', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('Must not request'); };
  await assert.rejects(savePlaylist({ ...input, uris: [] }), /Escolha/);
  await assert.rejects(savePlaylist({ ...input, name: ' ' }), /nome/);
  await assert.rejects(savePlaylist({ ...input, uris: ['not-a-track'] }), /trilha/);
  session('streaming');
  await assert.rejects(savePlaylist(input), /Autorize/);
  assert.equal(calls, 0);
});

test('bloqueia cliques simultâneos e não refaz criação de resposta incerta automaticamente', async () => {
  let unblock;
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    if (url.endsWith('/me')) { await new Promise((resolve) => { unblock = resolve; }); return json({ id: 'owner' }); }
    throw new TypeError('network uncertain');
  };
  const saving = savePlaylist(input);
  await assert.rejects(savePlaylist(input), /já está sendo salva/);
  unblock();
  await assert.rejects(saving, /Confira sua biblioteca/);
  assert.equal(calls, 2);
});

test('retém trilha e formulário ao pedir permissões e retorna à página após PKCE', async () => {
  storage.rememberCurrentPlaylist({ uris, title: 'Memória de teste' });
  auth.spotifyConfig.clientId = 'client-test'; auth.spotifyConfig.redirectUri = 'http://127.0.0.1:5173/callback';
  await auth.beginSpotifyLogin({ playlistAccess: true });
  const url = new URL(destination);
  assert.match(url.searchParams.get('scope'), /playlist-modify-public/);
  assert.match(url.searchParams.get('scope'), /playlist-modify-private/);
  const pending = JSON.parse(values.get('g-j.spotify.pkce'));
  assert.equal(pending.returnTo, '/playlist');
  window.location.pathname = '/callback'; window.location.search = `?code=test-code&state=${pending.state}`;
  window.location.href = 'http://127.0.0.1:5173/callback' + window.location.search;
  globalThis.fetch = async () => json({ access_token: 'new', refresh_token: 'refresh', scope: 'playlist-modify-public playlist-modify-private', expires_in: 3600 });
  await auth.finishSpotifyLogin();
  assert.equal(cleaned, '/playlist');
  assert.deepEqual(storage.readCurrentPlaylist()?.uris, uris);
  assert.equal(auth.hasPlaylistPermission(), true);
  clearSavedPlaylists(); storage.rememberCurrentPlaylist(null);
  assert.equal(storage.readCurrentPlaylist(), null);
});

test('renovação de token preserva escopos quando Spotify não os repete', async () => {
  session('playlist-modify-public');
  globalThis.fetch = async () => json({ access_token: 'refreshed', expires_in: 3600 });
  await auth.getAccessToken(true);
  assert.equal(auth.hasPlaylistPermission(true), true);
  assert.equal(auth.hasPlaylistPermission(false), false);
});

test('salva a trilha completa com mais de três músicas', async () => {
  const completeUris = Array.from({ length: 9 }, (_, index) => 'spotify:track:' + String(index).padStart(22, '0'));
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/me')) return json({ id: 'owner' });
    if (url.endsWith('/me/playlists')) return json({ id: 'whole-story' }, 201);
    assert.equal(options.method, 'PUT');
    assert.deepEqual(JSON.parse(options.body).uris, completeUris);
    return json({ snapshot_id: 'complete' });
  };
  assert.deepEqual((await savePlaylist({ ...input, uris: completeUris })).uris, completeUris);
});

test('mais de 100 faixas respeitam os lotes e retomam sem duplicar após uma resposta incerta', async () => {
  const completeUris = Array.from({ length: 205 }, (_, index) => 'spotify:track:' + String(index).padStart(22, '0'));
  let serverSongs = []; let created = 0; let failAppend = true;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/me')) return json({ id: 'owner' });
    if (url.endsWith('/me/playlists')) { created++; return json({ id: 'long-story' }, 201); }
    const chunk = JSON.parse(options.body).uris;
    assert.ok(chunk.length <= 100);
    if (options.method === 'PUT') serverSongs = [...chunk];
    else {
      assert.equal(options.method, 'POST');
      serverSongs.push(...chunk);
      if (failAppend) { failAppend = false; throw new TypeError('Server applied write but response was lost'); }
    }
    return json({ snapshot_id: 'complete' });
  };
  await assert.rejects(savePlaylist({ ...input, uris: completeUris }), /mesma playlist/);
  const result = await savePlaylist({ ...input, uris: completeUris });
  assert.equal(result.complete, true); assert.equal(created, 1);
  assert.deepEqual(serverSongs, completeUris);
});