import { useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';
import PhotoStory from '../components/PhotoStory';
import MemoryPlaylist from '../components/MemoryPlaylist';
import Reveal from '../components/Reveal';
import { formatDate, pad, parseDate } from '../utils/dates';

export default function Memory({ memory, index, onActive, onConnect }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: '-25% 0px -45% 0px' });
  useEffect(() => { if (inView) onActive(memory.id); }, [inView, memory.id, onActive]);
  const layout = index % 3;
  const date = parseDate(memory.date);
  return <section ref={ref} id={`memory-${memory.id}`} className={`memory-section memory-layout-${layout}`} aria-labelledby={`title-${memory.id}`}>
    <div className="memory-margin"><span className="memory-folio">{pad(index + 1)}</span><span className="memory-year">{date ? date.getUTCFullYear() : 'A preencher'}</span><span className="memory-rule" /></div>
    <div className="memory-composition">
      <Reveal className="memory-copy">
        <p className="eyebrow memory-date">{formatDate(memory.date)}</p>
        <h2 id={`title-${memory.id}`}>{memory.title}</h2>
        {memory.location && <p className="memory-location">{memory.location}</p>}
        <div className="memory-text">{memory.text.split(/\n\s*\n/).filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
        <MemoryPlaylist memory={memory} onConnect={onConnect} />
      </Reveal>
      <Reveal className="memory-images" delay={0.08}><PhotoStory memory={memory} layout={layout} /></Reveal>
    </div>
    <div className="memory-end"><span>Gabriel & Júlia</span><span>{pad(index + 1)}</span></div>
  </section>;
}
