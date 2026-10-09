import { useRef, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { rememberQuestions as questions } from '../data/story';
import { memoryLabel } from '../utils/storyExtras';
import PhotoStory from '../components/PhotoStory';
import Reveal from '../components/Reveal';
import Icon from '../components/Icon';

function RememberGame() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [unlocked, setUnlocked] = useState([]);
  const focusPending = useRef(false);
  const reduced = useReducedMotion();
  function focusQuestion(node) {
    if (node && focusPending.current) { node.focus({ preventScroll: true }); focusPending.current = false; }
  }

  const current = questions[index];
  const correct = selected === current.answerId;
  function reveal(id = null) {
    setSelected(id); setRevealed(true);
    setUnlocked((ids) => ids.includes(current.memory.id) ? ids : [...ids, current.memory.id]);
  }
  function next() {
    if (index === questions.length - 1) setFinished(true);
    else { setIndex(index + 1); setSelected(null); setRevealed(false); }
    focusPending.current = true;
  }
  function restart() {
    setIndex(0); setSelected(null); setRevealed(false); setFinished(false); setUnlocked([]);
    focusPending.current = true;
  }
  return <section className="remember-section" id="voce-lembra" aria-labelledby="remember-title">
    <Reveal className="remember-intro"><p className="eyebrow">Uma brincadeira a dois</p><h2 id="remember-title">Você<br /><em>lembra?</em></h2><p>Uma pergunta e um instante para viver de novo. Sem pressa de acertar.</p></Reveal>
    <div className="remember-card">
      <div className="remember-progress"><span>{finished ? 'Todas as lembranças reveladas' : `Lembrança ${index + 1} de ${questions.length}`}</span><span>{unlocked.length} / {questions.length}</span></div>
      <div className="remember-progress-track" aria-hidden="true"><span style={{ transform: `scaleX(${unlocked.length / questions.length})` }} /></div>
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={finished ? 'finished' : current.memory.id} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.25 }}>
          {finished ? <div className="remember-finished"><h3 tabIndex={-1} ref={focusQuestion}>O tempo passa.<br /><em>A gente guarda.</em></h3><p>Você reencontrou {questions.length} momentos da nossa história.</p><button className="button primary" onClick={restart}>Brincar de novo <Icon name="arrow" size={17} /></button></div> : <>
            <h3 className="remember-question" tabIndex={-1} ref={focusQuestion}>{current.question}</h3>
            <div className="remember-options" role="group" aria-label="Escolha uma resposta">{current.choices.map((choice, number) => <button key={choice.id} disabled={revealed} className={`remember-option ${revealed && choice.id === current.answerId ? 'is-correct' : selected === choice.id ? 'is-mistaken' : ''}`} aria-pressed={selected === choice.id} onClick={() => choice.id === current.answerId ? reveal(choice.id) : setSelected(choice.id)}><span>{String(number + 1).padStart(2, '0')}</span>{choice.label}{revealed && choice.id === current.answerId && <Icon name="heart" size={17} />}</button>)}</div>
            <p className="remember-feedback" role="status">{revealed ? correct ? 'Você lembrou. Vamos voltar a esse dia?' : 'Essa era a lembrança. Vamos reviver?' : selected ? 'Quase… tente outra lembrança ou revele esse momento.' : 'Escolha uma resposta para reencontrar esse momento.'}</p>
            {!revealed && <button className="text-button" onClick={() => reveal()}>Revelar lembrança <Icon name="arrow" size={15} /></button>}
            {revealed && <m.div className="remember-reveal" initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.4 }}>
              <PhotoStory memory={current.memory} layout={0} />
              <div className="remember-story"><h4>{memoryLabel(current.memory.title)}</h4><p>{current.memory.text}</p></div>
              <button className="button primary" onClick={next}>{index === questions.length - 1 ? 'Concluir as lembranças' : 'Próxima lembrança'} <Icon name="arrow" size={17} /></button>
            </m.div>}
          </>}
        </m.div>
      </AnimatePresence>
    </div>
  </section>;
}
export default function Remember() {
  if (!questions.length) return <section className="remember-section" id="voce-lembra" aria-labelledby="remember-title">
    <Reveal className="remember-intro"><p className="eyebrow">Uma brincadeira a dois</p><h2 id="remember-title">Você<br /><em>lembra?</em></h2></Reveal>
    <div className="remember-card remember-empty"><Icon name="heart" size={30} /><h3>Novas lembranças<br /><em>estão por vir.</em></h3></div>
  </section>;
  return <RememberGame key={JSON.stringify(questions)} />;
}
