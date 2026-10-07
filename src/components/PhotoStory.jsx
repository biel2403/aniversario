import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import Icon from './Icon';
import Modal from './Modal';

function Photo({ photo, memory, index, onOpen, active }) {
  const [failed, setFailed] = useState(false);
  return <div className="carousel-slide" role="group" aria-roledescription="slide" aria-label={`${index + 1} de ${memory.photos.length}`} aria-hidden={!active} inert={!active}>
    {failed ? <div className="photo-unavailable"><Icon name="photo" size={28} /><span>Fotografia indisponível</span></div> : <button className="carousel-photo-button" onClick={() => onOpen(index)} tabIndex={active ? 0 : -1} aria-label={`Ampliar fotografia ${index + 1}: ${memory.title}`}>
      <img src={photo.src} alt={`${memory.title} — fotografia ${index + 1}`} loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} />
      <span className="photo-expand"><Icon name="expand" /><span>Ampliar</span></span>
    </button>}
  </div>;
}

function Carousel({ memory, onOpen }) {
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const viewport = useRef(null);
  const activeIndex = useRef(0);
  const gesture = useRef(null);
  const suppressClick = useRef(false);
  const reduced = useReducedMotion();
  const count = memory.photos.length;
  const clamp = (value) => Math.max(0, Math.min(count - 1, value));

  function goTo(next) {
    const target = clamp(next);
    activeIndex.current = target; setIndex(target);
    viewport.current?.scrollTo({ left: target * viewport.current.clientWidth, behavior: reduced ? 'instant' : 'smooth' });
  }
  useEffect(() => {
    const element = viewport.current;
    const observer = new ResizeObserver(() => {
      if (!element.clientWidth) return;
      element.scrollTo({ left: activeIndex.current * element.clientWidth, behavior: 'instant' });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function pointerDown(event) {
    suppressClick.current = false;
    // Touch and trackpad use the browser's native swipe and scroll snapping.
    if (count < 2 || event.pointerType !== 'mouse' || event.button !== 0) return;
    gesture.current = { id: event.pointerId, x: event.clientX, left: event.currentTarget.scrollLeft, moved: false };
  }
  function pointerMove(event) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    const distance = event.clientX - drag.x;
    if (Math.abs(distance) < 6 && !drag.moved) return;
    if (!drag.moved) { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }
    drag.moved = true; suppressClick.current = true;
    event.preventDefault();
    event.currentTarget.scrollLeft = drag.left - distance;
  }
  function pointerEnd(event) {
    const drag = gesture.current;
    if (!drag || drag.id !== event.pointerId) return;
    gesture.current = null; setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.moved) {
      const next = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth);
      requestAnimationFrame(() => goTo(next));
    }
  }
  function keyboard(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    goTo(event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : index + (event.key === 'ArrowRight' ? 1 : -1));
  }
  // A small window of dots stays useful even when a memory has many photographs.
  const dotStart = Math.max(0, Math.min(index - 3, count - 7));
  const dots = Array.from({ length: Math.min(7, count) }, (_, offset) => dotStart + offset);

  return <div className="photo-carousel" role="region" aria-roledescription="carrossel" aria-label={`Fotografias de ${memory.title}`} onKeyDown={keyboard}>
    <div className="carousel-frame">
      <div ref={viewport} className={`carousel-track ${dragging ? 'is-dragging' : ''}`} tabIndex={count > 1 ? 0 : -1} aria-label="Fotos — use as setas para navegar" onScroll={(event) => {
        if (!event.currentTarget.clientWidth) return;
        const current = clamp(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth));
        activeIndex.current = current; setIndex(current);
      }} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} onDragStart={(event) => event.preventDefault()} onClickCapture={(event) => {
        if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
      }}>
        {memory.photos.map((photo, number) => <Photo key={photo.src} photo={photo} memory={memory} index={number} active={index === number} onOpen={onOpen} />)}
      </div>
      {count > 1 && <>
        <span className="carousel-counter" aria-hidden="true">{index + 1} / {count}</span>
        <button className="carousel-arrow carousel-previous" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Fotografia anterior"><Icon name="back" size={18} /></button>
        <button className="carousel-arrow carousel-next" onClick={() => goTo(index + 1)} disabled={index === count - 1} aria-label="Próxima fotografia"><Icon name="forward" size={18} /></button>
      </>}
    </div>
    <div className="carousel-footer">
      <span className="carousel-hint">{count > 1 ? 'Deslize para ver mais' : 'Uma lembrança'}</span>
      {count > 1 && <div className="carousel-dots" role="group" aria-label="Escolher fotografia">{dots.map((number) => <button key={number} className={`carousel-dot ${index === number ? 'active' : ''}`} aria-label={`Ver fotografia ${number + 1} de ${count}`} aria-current={index === number ? 'true' : undefined} onClick={() => goTo(number)}><span /></button>)}</div>}
      <span className="sr-only" aria-live="polite" aria-atomic="true">Fotografia {index + 1} de {count}</span>
    </div>
  </div>;
}

function Lightbox({ memory, initial, onClose }) {
  const [index, setIndex] = useState(initial);
  const reduced = useReducedMotion();
  const count = memory.photos.length;
  const change = (step) => setIndex((current) => (current + step + count) % count);
  useEffect(() => {
    const handle = (event) => { if (event.key === 'ArrowRight') change(1); if (event.key === 'ArrowLeft') change(-1); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [count]);
  return <Modal title={`Fotografias de ${memory.title}`} onClose={onClose} className="lightbox">
    <div className="lightbox-stage">
      <AnimatePresence mode="wait">
        <m.img key={memory.photos[index].src} src={memory.photos[index].src} alt={`${memory.title} — fotografia ${index + 1}`} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.18 }} onPanEnd={(_, info) => { if (Math.abs(info.offset.x) > 55 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) change(info.offset.x < 0 ? 1 : -1); }} />
      </AnimatePresence>
    </div>
    <div className="lightbox-footer">
      <button className="icon-button" onClick={() => change(-1)} disabled={count < 2} aria-label="Fotografia anterior"><Icon name="back" /></button>
      <span aria-live="polite">{index + 1} / {count}</span>
      <button className="icon-button" onClick={() => change(1)} disabled={count < 2} aria-label="Próxima fotografia"><Icon name="forward" /></button>
    </div>
  </Modal>;
}

export default function PhotoStory({ memory, layout }) {
  const [open, setOpen] = useState(null);
  if (!memory.photos.length) return <div className={`photo-placeholder placeholder-${layout}`}>
    <div className="placeholder-line" aria-hidden="true" /><Icon name="photo" size={30} />
    <span>Fotografia a adicionar</span><span className="placeholder-note">Este espaço espera uma lembrança de vocês.</span>
  </div>;
  return <>
    <Carousel key={memory.photos.map((photo) => photo.src).join('|')} memory={memory} onOpen={setOpen} />
    <AnimatePresence>{open !== null && <Lightbox key="photos" memory={memory} initial={open} onClose={() => setOpen(null)} />}</AnimatePresence>
  </>;
}
