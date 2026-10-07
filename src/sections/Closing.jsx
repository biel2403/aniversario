import Reveal from '../components/Reveal';
import Icon from '../components/Icon';
import { project } from '../data/story';

export default function Closing({ onRestart }) {
  const placeholder = !project.finalMessage || project.finalMessage.startsWith('[');
  return <section className="closing-section" aria-labelledby="closing-title"><Reveal><p className="eyebrow">Para Júlia</p><h2 id="closing-title">E o que fica,<br /><em>é você.</em></h2><div className={`personal-message ${placeholder ? 'message-placeholder' : ''}`}>{(project.finalMessage || '[Escreva aqui a sua mensagem pessoal para Júlia.]').split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><p className="signature">Gabriel</p><button className="text-button restart-button" onClick={onRestart}>Revisitar a nossa história<Icon name="arrow" size={16} /></button></Reveal><footer className="story-footer"><span>{project.title}</span><span>{project.subtitle}</span></footer></section>;
}
