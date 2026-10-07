import { m, useReducedMotion } from 'framer-motion';
export default function Reveal({ children, className, delay = 0, ...props }) {
  const reduced = useReducedMotion();
  return <m.div className={className} initial={reduced ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: reduced ? 0 : 0.65, delay, ease: [0.22, 1, 0.36, 1] }} {...props}>{children}</m.div>;
}
