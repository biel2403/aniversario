import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSpotify } from '../hooks/SpotifyContext';
import { trackTime } from '../utils/dates';
import Icon from './Icon';
import Modal from './Modal';

function Controls({ spotify }) {
  return <div className="playback-controls">
    <button className="icon-button" onClick={spotify.previous} disabled={!spotify.canControl || spotify.busy} aria-label="Música anterior"><Icon name="previous" size={18} /></button>
    <button className="icon-button play-toggle" onClick={spotify.toggle} disabled={!spotify.canControl || spotify.busy} aria-label={spotify.paused ? 'Reproduzir' : 'Pausar'}><Icon name={spotify.paused ? 'play' : 'pause'} size={19} /></button>
    <button className="icon-button" onClick={spotify.next} disabled={!spotify.canControl || spotify.busy} aria-label="Próxima música"><Icon name="next" size={18} /></button>
  </div>;
}
function Progress({ spotify }) {
  return <div className="track-progress"><span>{trackTime(spotify.position)}</span><input type="range" min="0" max={Math.max(spotify.duration, 1)} step="1000" value={Math.min(spotify.position, spotify.duration)} onChange={(event) => spotify.seek(Number(event.target.value))} aria-label="Progresso da música" aria-valuetext={`${trackTime(spotify.position)} de ${trackTime(spotify.duration)}`} disabled={!spotify.canControl || spotify.busy} /><span>{trackTime(spotify.duration)}</span></div>;
}
function Volume({ spotify }) {
  return <label className="volume-control"><Icon name="volume" size={18} /><span className="sr-only">Volume</span><input type="range" min="0" max="1" step="0.05" value={spotify.volume} onChange={(event) => spotify.changeVolume(Number(event.target.value))} aria-label="Volume" aria-valuetext={`${Math.round(spotify.volume * 100)}%`} disabled={!spotify.canControl} /></label>;
}

export default function Player({ onConnect, onSavePlaylist }) {
  const spotify = useSpotify();
  const [expanded, setExpanded] = useState(false);
  const connected = spotify.status === 'connected';
  return <>
    <aside className={`player-dock ${spotify.track ? 'has-track' : ''}`} aria-label="Player da trilha sonora">
      {spotify.message && <div className="player-message" role="status"><span>{spotify.message}</span><button className="icon-button" onClick={() => spotify.setMessage('')} aria-label="Fechar aviso"><Icon name="close" size={16} /></button></div>}
      <div className="player-meta">
        <button className="player-cover" onClick={() => spotify.track ? setExpanded(true) : onConnect()} aria-label={spotify.track ? 'Expandir player' : 'Conectar ao Spotify'}>
          {spotify.track?.image ? <img src={spotify.track.image} alt={`Capa de ${spotify.track.album || spotify.track.name}`} /> : <Icon name="music" size={21} />}
        </button>
        <button className="player-title" onClick={() => spotify.track ? setExpanded(true) : onConnect()}>
          <strong>{spotify.track?.name || 'A trilha da nossa história'}</strong><span>{spotify.track?.artist || (spotify.status === 'connecting' ? 'Conectando ao Spotify…' : connected ? 'Escolha uma música em uma memória' : 'Spotify opcional. A viagem é sua.')}</span>
        </button>
      </div>
      {spotify.track ? <><div className="desktop-playback"><Controls spotify={spotify} /><Progress spotify={spotify} /></div><div className="desktop-volume"><Volume spotify={spotify} /></div><div className="mobile-playback"><button className="icon-button play-toggle" onClick={spotify.toggle} disabled={!spotify.canControl || spotify.busy} aria-label={spotify.paused ? 'Reproduzir' : 'Pausar'}><Icon name={spotify.paused ? 'play' : 'pause'} /></button></div></> : <span className="player-invitation desktop-only">Cada momento, uma música.</span>}
      <button className="connection-button" onClick={onConnect} aria-label={connected ? 'Spotify conectado — opções de conexão' : 'Conectar Spotify'}><span className={`connection-dot ${connected ? 'connected' : ''}`} /><span>{connected ? 'Spotify conectado' : 'Conectar Spotify'}</span><Icon name="spotify" size={18} /></button>
      {spotify.track && <div className="mobile-progress" aria-hidden="true"><div style={{ width: `${spotify.duration ? spotify.position / spotify.duration * 100 : 0}%` }} /></div>}
    </aside>
    <AnimatePresence>{expanded && <Modal key="player" title="Trilha sonora" onClose={() => setExpanded(false)} className="expanded-player">
      <p className="eyebrow">Trilha sonora</p>
      {spotify.track?.image && <img className="expanded-cover" src={spotify.track.image} alt={`Capa de ${spotify.track.album || spotify.track.name}`} />}
      <h3>{spotify.track?.name}</h3><p>{spotify.track?.artist}</p><Progress spotify={spotify} /><Controls spotify={spotify} /><Volume spotify={spotify} />
      {spotify.track?.url && <a className="text-button spotify-link" href={spotify.track.url} target="_blank" rel="noreferrer">Abrir no Spotify <Icon name="external" size={14} /></a>}
      {spotify.currentPlaylist && <button className="button primary expanded-save-playlist" onClick={() => { setExpanded(false); onSavePlaylist(); }}>Salvar esta playlist <Icon name="spotify" size={18} /></button>}
    </Modal>}</AnimatePresence>
  </>;
}
