import { useEffect, useState } from 'react';
import Reveal from '../components/Reveal';
import { project } from '../data/story';
import { formatDate, relationshipDuration } from '../utils/dates';

export default function Together() {
  const [duration, setDuration] = useState(() => relationshipDuration(project.relationshipStart));
  useEffect(() => {
    const timer = setInterval(() => setDuration(relationshipDuration(project.relationshipStart)), 60000);
    return () => clearInterval(timer);
  }, []);
  return <section id="presente" className="together-section" aria-labelledby="together-title">
    <Reveal><p className="eyebrow">O tempo, com você</p><h2 id="together-title">Cada dia.<br /><em>Até aqui.</em></h2></Reveal>
    <Reveal delay={0.1}>{duration ? <><p className="together-caption">Estamos juntos há</p><div className="together-count">{[[duration.years, 'anos'], [duration.months, 'meses'], [duration.days, 'dias']].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div><p className="together-since">Desde {formatDate(project.relationshipStart)}</p></> : <div className="together-pending"><p className="together-caption">O início da nossa contagem</p><p className="pending-date">[Data de início a preencher]</p><p>Assim que a data estiver aqui, o tempo juntos será contado a cada novo dia.</p></div>}</Reveal>
  </section>;
}
