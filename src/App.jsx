import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, m, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { errors, memories, project } from './data/story';
import { useSpotifyConnection } from './hooks/SpotifyContext';
import { isOAuthCallback } from './services/spotifyAuth';
import Icon from './components/Icon';
import Player from './components/Player';
import SpotifyGate from './components/SpotifyGate';
import Opening from './sections/Opening';
import Memory from './sections/Memory';
import Together from './sections/Together';
import Future from './sections/Future';
import Closing from './sections/Closing';
import PlaylistPage from './pages/PlaylistPage';
import { pad } from './utils/dates';

export default function App() {
  const spotify = useSpotifyConnection();
  const reduced = useReducedMotion();
  const returning = useRef(isOAuthCallback());
  const [started, setStarted] = useState(returning.current);
  const [gate, setGate] = useState(returning.current);
  const [active, setActive] = useState(memories[0]?.id);
  const [path, setPath] = useState(window.location.pathname);
  const playlistPage = path === '/playlist';
  const target = useRef('memorias');
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const onActive = useCallback((id) => setActive(id), []);

  function goTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
  }
  function openGate(destination = 'memorias') { target.current = destination; setGate(true); }
  function continueJourney() { setGate(false); if (playlistPage) return; setStarted(true); requestAnimationFrame(() => requestAnimationFrame(() => goTo(target.current))); }
  function changePage(next) {
    window.history.pushState({}, '', next); setPath(next); setGate(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function returnToStory(id = 'memorias') {
    changePage('/'); setStarted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => goTo(id)));
  }
  function navigate(id) { if (playlistPage) returnToStory(id); else if (started) goTo(id); else openGate(id); }
  useEffect(() => {
    const onPop = () => { setPath(window.location.pathname); setGate(false); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    document.title = `${playlistPage ? 'Salvar playlist — ' : ''}${project.title} — ${project.subtitle}`;
    if (playlistPage) document.getElementById('playlist-page-title')?.focus({ preventScroll: true });
  }, [playlistPage]);

  if (errors.length) return <main className="content-error"><h1>As memórias precisam de um ajuste.</h1><p>Confira o arquivo de conteúdo para continuar.</p><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></main>;
  return <>
    <a className="skip-link" href={playlistPage ? '#playlist-page-title' : started ? '#memorias' : '#opening-title'}>Pular para o conteúdo</a>
    <header className="site-header"><a className="brand" href={playlistPage ? '/' : '#inicio'} onClick={playlistPage ? (event) => { event.preventDefault(); returnToStory('inicio'); } : undefined} aria-label={`${project.title} — voltar ao início`}><span className="brand-symbol"><Icon name="clock" size={23} /></span><span>{project.title}<small>{project.subtitle}</small></span></a><nav aria-label="Navegação principal"><button className="nav-button" onClick={() => navigate('memorias')}>A história</button><button className="nav-button" onClick={() => navigate('futuro')}>O futuro</button><button className="nav-button" aria-current={playlistPage ? 'page' : undefined} onClick={() => changePage('/playlist')}>Playlist</button><button className={`header-sound ${spotify.status === 'connected' ? 'sound-connected' : ''}`} onClick={() => openGate()} aria-label="Configurar trilha sonora"><Icon name="music" size={19} /></button></nav></header>
    {started && !playlistPage && <m.div className="reading-progress" style={{ scaleX: reduced ? scrollYProgress : smoothProgress }} aria-hidden="true" />}
    {playlistPage && <PlaylistPage onBack={() => returnToStory()} />}
    <main hidden={playlistPage}><Opening started={started} onStart={() => started ? goTo('memorias') : openGate()} />
      {started && <div className="journey-content">
        <section id="memorias" className="chapter-intro" aria-labelledby="memories-heading"><div><p className="eyebrow">O que o tempo guardou</p><h2 id="memories-heading">As nossas<br /><em>memórias.</em></h2></div><p>Alguns instantes passam.<br />Outros ficam com a gente.</p></section>
        {memories.length ? <>
          <nav className="chapter-navigation" aria-label="Escolher uma memória">{memories.map((memory, index) => <button key={memory.id} className={active === memory.id ? 'active' : ''} aria-label={`Ir à memória ${index + 1}: ${memory.title}`} aria-current={active === memory.id ? 'step' : undefined} onClick={() => goTo(`memory-${memory.id}`)}><span>{pad(index + 1)}</span><span className="chapter-name">{memory.title}</span>{active === memory.id && <m.span className="chapter-indicator" layoutId="chapter-marker" transition={{ duration: reduced ? 0 : 0.3 }} />}</button>)}</nav>
          {memories.map((memory, index) => <Memory key={memory.id} memory={memory} index={index} onActive={onActive} onConnect={() => openGate()} />)}
        </> : <div className="empty-story"><h3>Um espaço para a nossa história.</h3><p>As memórias ainda serão adicionadas.</p></div>}
        <Together /><Future /><Closing onRestart={() => goTo('memorias')} />
      </div>}
    </main>
    {(started || playlistPage) && <Player onConnect={() => openGate()} onSavePlaylist={() => changePage('/playlist')} />}
    <AnimatePresence>{gate && <SpotifyGate key="spotify-gate" started={started} onClose={() => setGate(false)} onContinue={continueJourney} />}</AnimatePresence>
  </>;
}
