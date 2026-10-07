import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { m, useReducedMotion } from 'framer-motion';
import Icon from './Icon';

export default function Modal({ title, onClose, children, className = '' }) {
  const dialog = useRef(null);
  const titleId = useId();
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    element.querySelector('[data-autofocus]')?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus?.({ preventScroll: true }); };
  }, []);
  return createPortal(
    <dialog ref={dialog} className={`modal ${className}`} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === dialog.current) onClose(); }}>
      <m.div className="modal-surface" initial={reduced ? false : { opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.25 }}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Fechar"><Icon name="close" /></button>
        <h2 id={titleId} className="sr-only">{title}</h2>
        {children}
      </m.div>
    </dialog>, document.body,
  );
}
