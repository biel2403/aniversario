import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { getTrack } from '../services/spotifyApi';
import { useSpotify } from '../hooks/SpotifyContext';
import Icon from './Icon';

export default function MemoryPlaylist({ memory, onConnect }) {
  const spotify = useSpotify();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '150px' });
  const [tracks, setTracks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!spotify.authenticated || !inView) return;
    let live = true;
    setLoading(true); setError('');
    Promise.allSettled(memory.songs.map(getTrack)).then((results) => {
      if (!live) return;
      const found = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') found[memory.songs[index]] = result.value;
        else { setError(result.reason.message || 'Não foi possível carregar uma música.'); if (result.reason.code === 'authentication') spotify.reportError(result.reason); }
      });
      setTracks(found); setLoading(false);
    });
    return () => { live = false; };
  }, [spotify.authenticated, inView, memory.songs, attempt, spotify.reportError]);

  if (!memory.songs.length) return null;
  return <div ref={ref} className="memory-playlist">
    <div className="playlist-heading"><Icon name="music" size={17} /><h3>Trilha deste momento</h3></div>
    {!spotify.authenticated && <p className="playlist-hint"><button className="text-button" onClick={onConnect}>Conecte o Spotify</button> para descobrir as músicas.</p>}
    <ul>
      {memory.songs.map((uri, index) => {
        const data = tracks[uri];
        const active = spotify.track?.uri === uri;
        return <li key={`${uri}-${index}`}><button className={`song-button ${active ? 'selected' : ''}`} aria-pressed={active} disabled={loading || spotify.busy || (spotify.authenticated && !data)} onClick={() => { if (!spotify.authenticated) onConnect(); else if (active) spotify.toggle(); else spotify.selectSong(memory.songs, index, memory.title); }}>
          <span className="song-number">{active ? <Icon name={spotify.paused ? 'play' : 'pause'} size={17} /> : String(index + 1).padStart(2, '0')}</span>
          {data?.image && <img src={data.image} alt={`Capa de ${data.album}`} loading="lazy" />}
          <span className="song-info"><strong>{data?.name || (loading ? 'Buscando música…' : `Música ${index + 1}`)}</strong><span>{data?.artist || (spotify.authenticated ? 'Informações indisponíveis' : 'Disponível ao conectar')}</span></span>
          <Icon name="play" size={16} />
        </button>{data?.url && <a className="track-link" href={data.url} target="_blank" rel="noreferrer">Abrir no Spotify <Icon name="external" size={12} /></a>}</li>;
      })}
    </ul>
    {error && <p className="playlist-hint" role="status">{error} <button className="text-button" onClick={() => setAttempt((value) => value + 1)}>Tentar novamente</button></p>}
  </div>;
}
