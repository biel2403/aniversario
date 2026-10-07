import { useEffect, useState } from 'react';
import Reveal from '../components/Reveal';
import { project } from '../data/story';
import { formatDate, pad, weddingCountdown } from '../utils/dates';

function Countdown() {
  const [count, setCount] = useState(() => weddingCountdown(project.weddingDate));
  useEffect(() => {
    const timer = setInterval(() => setCount(weddingCountdown(project.weddingDate)), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!count) return <p>Data do casamento a preencher.</p>;
  if (count.reached) return <div className="wedding-arrived"><p className="eyebrow">{count.isToday ? 'Chegou o grande dia' : 'Um novo capítulo começou'}</p><h3>{count.isToday ? 'É hoje.' : 'O nosso futuro, agora.'}</h3><p>{formatDate(project.weddingDate)}</p></div>;
  return <div className="countdown" role="timer" aria-label="Contagem regressiva para o casamento" aria-live="off">
    <p className="countdown-caption">Para o nosso próximo capítulo, faltam</p>
    <div className="countdown-values">{[[count.days, 'dias'], [count.hours, 'horas'], [count.minutes, 'minutos'], [count.seconds, 'segundos']].map(([value, label]) => <div key={label}><strong>{pad(value)}</strong><span>{label}</span></div>)}</div>
  </div>;
}

export default function Future() {
  return <>
    <section className="future-transition" aria-label="A passagem para o futuro"><Reveal><p className="eyebrow">Ainda há muito por viver</p><h2>Até aqui,<br />a nossa história.<br /><em>Daqui em diante,</em><br /><em>o nosso futuro.</em></h2><span className="transition-thread" aria-hidden="true" /></Reveal></section>
    <section id="futuro" className="future-section" aria-labelledby="future-title">
      <div className="future-orbit" aria-hidden="true" />
      <Reveal><p className="eyebrow">O próximo capítulo</p><h2 id="future-title">O nosso <em>sim.</em></h2><p className="wedding-date">{formatDate(project.weddingDate)}</p></Reveal>
      <Reveal delay={0.1}><Countdown /></Reveal>
    </section>
  </>;
}
