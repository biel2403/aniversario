import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { beginSpotifyLogin, disconnectSession, finishSpotifyLogin, getAccessToken, hasSpotifySession, isOAuthCallback, isSpotifyConfigured } from '../services/spotifyAuth.js';
import { clearTrackCache, getTrack, playTracks } from '../services/spotifyApi.js';
import { loadSpotifySdk } from '../services/spotifySdk.js';
import { readCurrentPlaylist, rememberCurrentPlaylist } from '../services/playlistStorage.js';
import { clearSavedPlaylists } from '../services/spotifyPlaylist.js';

import { SpotifyContext, SpotifyConnectionContext } from './SpotifyContext.js';
export function SpotifyProvider({ children }) {
  const callback = useRef(isOAuthCallback());
  const [authenticated, setAuthenticated] = useState(false);
  const [status, setStatus] = useState('disconnected');
  const [message, setMessage] = useState('');
  const [deviceId, setDeviceId] = useState(null);
  const [track, setTrack] = useState(null);
  const [paused, setPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.45);
  const [busy, setBusy] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState(readCurrentPlaylist);
  const player = useRef(null);
  const playback = useRef({ position: 0, sampledAt: Date.now(), paused: true, duration: 0 });
  const queue = useRef({ uris: currentPlaylist?.uris || [], index: 0 });
  const operation = useRef(false);

  const reportError = useCallback((error) => {
    setMessage(error.message || 'O Spotify está indisponível agora.');
    if (error.code === 'authentication') { setAuthenticated(false); setStatus('disconnected'); setPaused(true); playback.current.paused = true; }
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        if (callback.current) { setStatus('connecting'); await finishSpotifyLogin(); }
        if (hasSpotifySession()) { if (live) { setAuthenticated(true); setStatus('connecting'); } }
        else if (live) setStatus('disconnected');
      } catch (error) { if (live) { setStatus('disconnected'); reportError(error); } }
    })();
    return () => { live = false; };
  }, [reportError]);

  useEffect(() => {
    if (!authenticated) return;
    let live = true;
    let sdkPlayer;
    let readyTimer;
    (async () => {
      try {
        const sdk = await loadSpotifySdk();
        if (!live) return;
        sdkPlayer = new sdk.Player({ name: 'Máquina do Tempo — Gabriel & Júlia', volume: 0.45, getOAuthToken: (callbackToken) => { getAccessToken().then(callbackToken).catch((error) => live && reportError(error)); } });
        player.current = sdkPlayer;
        sdkPlayer.addListener('ready', ({ device_id }) => { if (live) { clearTimeout(readyTimer); setDeviceId(device_id); setStatus('connected'); setMessage(''); } });
        sdkPlayer.addListener('not_ready', () => { if (live) { setDeviceId(null); setPaused(true); playback.current.paused = true; setStatus('unavailable'); setMessage('O Spotify desconectou. Tente conectar novamente.'); } });
        sdkPlayer.addListener('player_state_changed', (state) => {
          if (!live || !state) return;
          const current = state.track_window.current_track;
          setPaused(state.paused); setPosition(state.position); setDuration(state.duration);
          playback.current = { position: state.position, sampledAt: Date.now(), paused: state.paused, duration: state.duration };
          if (current) {
            const index = queue.current.uris.indexOf(current.uri);
            if (index >= 0) queue.current.index = index;
            setTrack({ uri: current.uri, name: current.name, artist: current.artists.map((artist) => artist.name).join(', '), image: current.album.images?.[0]?.url, album: current.album.name, duration: state.duration, url: `https://open.spotify.com/track/${current.id}` });
          }
        });
        sdkPlayer.addListener('account_error', () => { if (live) { setStatus('premium-required'); setMessage('Para ouvir aqui, o Spotify exige Premium. Você pode continuar a viagem e abrir as músicas no Spotify.'); } });
        sdkPlayer.addListener('authentication_error', () => { if (live) reportError({ code: 'authentication', message: 'A conexão com o Spotify expirou. Conecte novamente.' }); });
        sdkPlayer.addListener('initialization_error', () => { if (live) { setStatus('unavailable'); setMessage('Este navegador não conseguiu iniciar o Spotify. A viagem continua disponível.'); } });
        sdkPlayer.addListener('playback_error', () => { if (live) setMessage('Não foi possível tocar esta música. Escolha outra ou tente novamente.'); });
        sdkPlayer.addListener('autoplay_failed', () => { if (live) setMessage('Toque em reproduzir para permitir o áudio neste navegador.'); });
        readyTimer = setTimeout(() => { if (live) { setStatus((current) => current === 'connecting' ? 'unavailable' : current); setMessage((current) => current || 'O Spotify demorou para conectar. Tente novamente.'); } }, 20000);
        const connected = await sdkPlayer.connect();
        if (!connected && live) { clearTimeout(readyTimer); setStatus('unavailable'); setMessage('Não foi possível conectar o player. Tente novamente.'); }
      } catch (error) { if (live) { setStatus('unavailable'); reportError(error); } }
    })();
    return () => { live = false; clearTimeout(readyTimer); sdkPlayer?.disconnect(); player.current = null; setDeviceId(null); };
  }, [authenticated, reportError]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const sample = playback.current;
      setPosition(Math.min(sample.duration, sample.position + (sample.paused ? 0 : Date.now() - sample.sampledAt)));
    }, 500);
    return () => clearInterval(timer);
  }, [paused]);

  const connect = useCallback(async (options = {}) => {
    setMessage('');
    try {
      if (hasSpotifySession() && authenticated && !options.playlistAccess) { setAuthenticated(false); setTimeout(() => { setAuthenticated(true); setStatus('connecting'); }, 0); return; }
      setStatus('connecting'); await beginSpotifyLogin(options);
    } catch (error) { setStatus('disconnected'); reportError(error); }
  }, [authenticated, reportError]);
  const disconnect = useCallback(() => {
    player.current?.disconnect(); disconnectSession(); clearTrackCache();
    setAuthenticated(false); setStatus('disconnected'); setTrack(null); setPaused(true); setPosition(0); setDuration(0); setMessage('');
    queue.current = { uris: [], index: 0 };
    setCurrentPlaylist(null); rememberCurrentPlaylist(null); clearSavedPlaylists();
  }, []);
  async function run(action) {
    if (operation.current) return;
    operation.current = true; setBusy(true); setMessage('');
    try { await action(); } catch (error) { reportError(error); }
    finally { operation.current = false; setBusy(false); }
  }
  function selectSong(uris, index, memoryTitle = currentPlaylist?.title || '') {
    // Activate synchronously in the actual click event, before any token/metadata awaits.
    player.current?.activateElement().catch(reportError);
    if (!authenticated) { setMessage('Conecte o Spotify para escolher a trilha deste momento.'); return; }
    if (status === 'premium-required') { setMessage('A reprodução neste site requer Spotify Premium.'); return; }
    if (!deviceId) { setMessage('O player está conectando. Aguarde um instante e tente novamente.'); return; }
    run(async () => {
      const selected = await getTrack(uris[index]);
      if (!selected.playable) throw new Error('Esta música não está disponível na sua região.');
      await playTracks(deviceId, uris, index);
      queue.current = { uris: [...uris], index };
      const selectedPlaylist = { uris: [...uris], title: memoryTitle };
      setCurrentPlaylist(selectedPlaylist); rememberCurrentPlaylist(selectedPlaylist);
      setTrack(selected);
    });
  }
  function toggle() {
    player.current?.activateElement().catch(reportError);
    if (player.current && track && deviceId) run(() => player.current.togglePlay());
  }
  function step(offset) {
    const { uris, index } = queue.current;
    if (!uris.length) return;
    selectSong(uris, (index + offset + uris.length) % uris.length);
  }
  function seek(value) {
    if (!player.current || !track) return;
    run(async () => { await player.current.seek(value); playback.current = { ...playback.current, position: value, sampledAt: Date.now() }; setPosition(value); });
  }
  function changeVolume(value) {
    setVolume(value);
    player.current?.setVolume(value).catch(reportError);
  }

  // Keep the story out of the player's half-second progress update cycle.
  const connection = useMemo(() => ({ authenticated, status, message, setMessage, currentPlaylist, configured: isSpotifyConfigured(), connect, disconnect, reportError }), [authenticated, status, message, currentPlaylist, connect, disconnect, reportError]);
  return <SpotifyConnectionContext.Provider value={connection}><SpotifyContext.Provider value={{ ...connection, track, paused, position, duration, volume, busy, selectSong, toggle, next: () => step(1), previous: () => step(-1), seek, changeVolume, canControl: status === 'connected' && Boolean(track) }}>{children}</SpotifyContext.Provider></SpotifyConnectionContext.Provider>;
}
