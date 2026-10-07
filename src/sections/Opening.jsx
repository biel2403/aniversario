import { m, useReducedMotion } from 'framer-motion';
import Icon from '../components/Icon';
import { project } from '../data/story';
import { formatDate } from '../utils/dates';

export default function Opening({ onStart, started }) {
  const reduced = useReducedMotion();
  const names = project.subtitle.split('&').map((name) => name.trim());
  const entrance = { hidden: { opacity: 0, y: reduced ? 0 : 18 }, visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] } } };
  return <section id="inicio" className="opening" aria-labelledby="opening-title">
    <div className="time-orbit" aria-hidden="true">
      <div className="orbit-ring ring-outer" /><div className="orbit-ring ring-middle" /><div className="orbit-ring ring-inner" />
      <div className="orbit-ticks">{Array.from({ length: 60 }, (_, index) => <i key={index} style={{ '--tick': index }} />)}</div>
      <span className="orbit-point point-top" /><span className="orbit-point point-bottom" />
      <span className="orbit-axis axis-one" /><span className="orbit-axis axis-two" />
    </div>
    <m.div className="opening-content" initial={reduced ? false : 'hidden'} animate="visible" variants={{ visible: { transition: { staggerChildren: reduced ? 0 : 0.14 } } }}>
      <m.p className="eyebrow opening-eyebrow" variants={entrance}>{project.title}</m.p>
      <m.h1 id="opening-title" className="hero-title" variants={entrance}>{names.length === 2 ? <><span>{names[0]}</span><span className="second-name"><em>&</em> {names[1]}</span></> : project.subtitle}</m.h1>
      <m.p className="opening-subtitle" variants={entrance}>Uma história que ainda<br className="mobile-only" /> está sendo escrita.</m.p>
      <m.button className="button primary start-button" variants={entrance} whileTap={reduced ? undefined : { scale: 0.98 }} onClick={onStart}>{started ? 'Voltar às memórias' : 'Iniciar viagem'}<Icon name="arrow" size={19} /></m.button>
      <m.p className="opening-hint" variants={entrance}>Fotos, memórias e músicas. No nosso tempo.</m.p>
    </m.div>
    <div className="opening-footer"><span>Passado <i /> Presente <i /> Futuro</span><span className="opening-date">{formatDate(project.weddingDate)}</span><button onClick={onStart} className="scroll-invitation" aria-label={started ? 'Ir às memórias' : 'Começar a viagem'}><span>Uma viagem a dois</span><Icon name="down" size={16} /></button></div>
  </section>;
}
