import { useEffect, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { useSpotifyConnection } from '../hooks/SpotifyContext';
import { getTrack, spotifyRequest } from '../services/spotifyApi.js';
import { hasPlaylistPermission } from '../services/spotifyAuth.js';
import { savePlaylist } from '../services/spotifyPlaylist.js';
import { trackTime } from '../utils/dates';
import Icon from '../components/Icon';

const DEFAULT_NAME = 'Máquina do Tempo — Gabriel & Júlia';
function readDraft() {
  try { return JSON.parse(sessionStorage.getItem('g-j.spotify.playlist-draft') || 'null'); } catch { return null; }
}

export default function PlaylistPage({ onBack }) {
  const spotify = useSpotifyConnection();
  const playlist = spotify.currentPlaylist;
  const [name, setName] = useState(() => readDraft()?.name || DEFAULT_NAME);
  const [isPublic, setIsPublic] = useState(() => readDraft()?.isPublic !== false);
  const [tracks, setTracks] = useState({});
  const [owner, setOwner] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [metadataError, setMetadataError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState(null);
  const inFlight = useRef(false);
  const hasSongs = Boolean(playlist?.uris.length);
  const allowed = spotify.authenticated && hasPlaylistPermission(isPublic);

  useEffect(() => {
    try { sessionStorage.setItem('g-j.spotify.playlist-draft', JSON.stringify({ name, isPublic })); } catch { /* The form remains usable. */ }
    setSaved(null); setError('');
  }, [name, isPublic, playlist]);

  useEffect(() => {
    if (!spotify.authenticated || !hasSongs) { setTracks({}); setOwner(''); return; }
    let live = true;
    setLoading(true); setMetadataError('');
    Promise.allSettled([spotifyRequest('/me'), ...playlist.uris.map(getTrack)]).then((results) => {
      if (!live) return;
      if (results[0].status === 'fulfilled') setOwner(results[0].value.display_name || '');
      const data = {};
      results.slice(1).forEach((result, index) => {
        if (result.status === 'fulfilled') data[playlist.uris[index]] = result.value;
        else { setMetadataError('Algumas informações das músicas não carregaram. A playlist ainda pode ser salva.'); if (result.reason.code === 'authentication') spotify.reportError(result.reason); }
      });
      setTracks(data); setLoading(false);
    });
    return () => { live = false; };
  }, [spotify.authenticated, playlist, hasSongs, attempt, spotify.reportError]);

  async function handleSave(event) {
    event.preventDefault();
    if (inFlight.current || !hasSongs) return;
    inFlight.current = true; setSaving(true); setError('');
    try { setSaved(await savePlaylist({ name, isPublic, uris: [...playlist.uris] })); }
    catch (failure) {
      setError(failure.message || 'Não foi possível salvar a playlist. Tente novamente.');
      if (failure.code === 'authentication') spotify.reportError(failure);
    } finally { inFlight.current = false; setSaving(false); }
  }

  return <main className="save-playlist-page">
    <button className="text-button playlist-back" onClick={onBack}><Icon name="back" size={17} /> Voltar à nossa história</button>
    <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="save-playlist-layout">
      <section className="save-playlist-intro" aria-labelledby="playlist-page-title">
        <p className="eyebrow">Para levar com você</p>
        <h1 id="playlist-page-title" tabIndex={-1}>A nossa história.<br /><em>Na sua playlist.</em></h1>
        <p>Tem música que faz o tempo voltar. Guarde a trilha deste momento no seu Spotify e reencontre a gente sempre que apertar o play.</p>
        <div className="playlist-art" aria-hidden="true"><div className="playlist-record"><span><Icon name="music" size={30} /></span></div><div className="playlist-art-caption"><small>Máquina do Tempo</small><strong>Gabriel & Júlia</strong></div></div>
      </section>
      <section className="save-playlist-card" aria-labelledby="save-playlist-heading">
        <div className="save-playlist-card-heading"><Icon name="spotify" size={27} /><div><p className="eyebrow">A trilha deste momento</p><h2 id="save-playlist-heading">Um lugar para guardar.</h2></div></div>
        {!hasSongs ? <div className="save-playlist-empty"><Icon name="music" size={32} /><h3>Ainda falta escolher uma trilha.</h3><p>Volte à história e toque uma música em uma memória. As músicas daquele momento vão aparecer aqui para você salvar.</p><button className="button primary" onClick={onBack}>Escolher uma trilha <Icon name="arrow" size={17} /></button></div> : <>
          {playlist.title && !playlist.title.startsWith('[') && <p className="save-playlist-memory">{playlist.title}</p>}
          <ol className="save-playlist-tracks" aria-label="Músicas que serão salvas" aria-busy={loading}>{playlist.uris.map((uri, index) => {
            const track = tracks[uri];
            return <li key={`${uri}-${index}`}><span className="save-track-number">{String(index + 1).padStart(2, '0')}</span><div className="save-track-cover">{track?.image ? <img src={track.image} alt={`Capa de ${track.album || track.name}`} /> : <Icon name="music" size={19} />}</div><div><strong>{track?.name || (loading ? 'Buscando música…' : `Música ${index + 1}`)}</strong><span>{track?.artist || (spotify.authenticated ? 'Informações indisponíveis' : 'Conecte para ver os detalhes')}</span></div>{track?.duration && <small>{trackTime(track.duration)}</small>}</li>;
          })}</ol>
          {metadataError && <p className="save-playlist-notice" role="status">{metadataError} <button className="text-button" onClick={() => setAttempt((value) => value + 1)}>Carregar novamente</button></p>}
          <form onSubmit={handleSave}>
            <label className="playlist-name-label" htmlFor="playlist-name">Nome da playlist</label><input id="playlist-name" className="playlist-name-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required disabled={saving} />
            <label className="playlist-visibility"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} disabled={saving} /><span><strong>Exibir no meu perfil</strong><small>{isPublic ? 'A playlist ficará pública no seu Spotify.' : 'A playlist ficará privada na sua biblioteca.'}</small></span></label>
            <p className="save-playlist-account">{owner ? `Salvar na conta de ${owner}.` : 'Será salva na conta do Spotify que você conectar.'}</p>
            {saved ? <div className="playlist-saved" role="status"><strong>Agora essa trilha também é sua.</strong><p>Playlist salva{saved.owner ? ` na conta de ${saved.owner}` : ' no seu Spotify'}.</p><a className="button primary" href={saved.url} target="_blank" rel="noreferrer">Abrir minha playlist <Icon name="external" size={17} /></a></div> : allowed ? <button type="submit" className="button primary save-playlist-submit" disabled={saving || !name.trim()}>{saving ? 'Salvando sua playlist…' : 'Salvar no meu Spotify'}<Icon name="spotify" size={19} /></button> : <button type="button" className="button primary save-playlist-submit" disabled={spotify.status === 'connecting'} onClick={() => spotify.connect({ playlistAccess: true })}>{spotify.status === 'connecting' ? 'Conectando ao Spotify…' : spotify.authenticated ? 'Autorizar salvamento' : 'Conectar meu Spotify'}<Icon name="spotify" size={19} /></button>}
            {!allowed && <p className="save-playlist-footnote">Depois de autorizar, você volta aqui para confirmar o salvamento.</p>}
            {error && <p className="save-playlist-notice" role="alert">{error}</p>}
          </form>
        </>}
      </section>
    </m.div>
  </main>;
}
