import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import { project } from '../data/story';

export default function Closing({ onRestart, onPlaylist }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const letterTitle = useRef(null);
  const envelope = useRef(null);
  const paragraphs = (project.finalMessage || '...').split(/\n\s*\n/);
  useEffect(() => { if (open) letterTitle.current?.focus({ preventScroll: true }); }, [open]);
  function close() { setOpen(false); envelope.current?.focus({ preventScroll: true }); }
  return <section id="carta" className="closing-section" aria-labelledby="closing-title">
    <Reveal><p className="eyebrow">Para Júlia</p><h2 id="closing-title">E o que fica,<br /><em>é você.</em></h2>
      <div className="letter-wrap">
        <m.button ref={envelope} className={`letter-envelope ${open ? 'is-open' : ''}`} aria-expanded={open} aria-controls="personal-letter" aria-label={open ? 'Fechar a carta de Gabriel' : 'Abrir a carta de Gabriel'} onClick={() => open ? close() : setOpen(true)} whileHover={reduced ? undefined : { y: -4 }} whileTap={reduced ? undefined : { scale: 0.98 }}>
          <span className="envelope-paper" aria-hidden="true"><span>Para Júlia</span><span>Com amor, Gabriel</span></span>
          <span className="envelope-fold" aria-hidden="true" />
          <m.span className="envelope-flap" aria-hidden="true" animate={{ rotateX: open ? 180 : 0 }} transition={{ duration: reduced ? 0 : 0.5 }} />
          <m.span className="envelope-seal" aria-hidden="true" animate={{ opacity: open ? 0 : 1 }} transition={{ duration: reduced ? 0 : 0.15 }}><Icon name="heart" size={23} /></m.span>
          <span className="envelope-instruction">{open ? 'A sua carta' : 'Toque para abrir'}</span>
        </m.button>
        <AnimatePresence>
          {open && <m.article id="personal-letter" className="personal-letter" aria-labelledby="letter-title" initial={reduced ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 0.25 }}>
            <p className="letter-date">Gabriel & Júlia</p><h3 id="letter-title" ref={letterTitle} tabIndex={-1}>Minha Júlia,</h3>
            <div className="personal-message">{paragraphs.map((paragraph, index) => <m.p key={index} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : Math.min(0.45 + index * 0.2, 2) }}>{paragraph}</m.p>)}</div>
            <p className="signature">Gabriel</p><button className="text-button letter-close" onClick={close}>Guardar a carta <Icon name="heart" size={15} /></button>
          </m.article>}
        </AnimatePresence>
      </div>
      <div className="closing-actions"><button className="button outline" onClick={onPlaylist}>Guardar a nossa playlist <Icon name="spotify" size={18} /></button><button className="text-button restart-button" onClick={onRestart}>Revisitar a nossa história <Icon name="arrow" size={16} /></button></div>
    </Reveal>
    <footer className="story-footer"><span>{project.title}</span><span>{project.subtitle}</span></footer>
  </section>;
}