import test from 'node:test';
import assert from 'node:assert/strict';
import { collectStorySongs, buildMemoryQuestions } from '../src/utils/storyExtras.js';
const a = 'spotify:track:0123456789ABCDEFGHIJKL';
const b = 'spotify:track:ABCDEFGHIJKLMNOPQRSTUV';

test('playlist completa mantém a ordem da história, remove repetidas e ignora URIs inválidos', () => {
  assert.deepEqual(collectStorySongs([{ songs: [a, b] }, { songs: [b, a, 'inválido'] }, {}, { songs: [] }]), [a, b]);
  assert.deepEqual(collectStorySongs([]), []);
});

test('perguntas têm uma única resposta correta ligada às fotos e ao texto da memória', () => {
  const memories = [
    { id: 'viagem', date: '2025-11-06', title: 'Viagem', text: 'Ubatuba', photos: [{ src: '/viagem.jpg' }] },
    { id: 'pedido', date: '2026-03-22', title: '[Pedido de Casamento]' },
    { id: 'aniversario', date: '2026-10-10', title: 'Aniversários' },
  ];
  const questions = buildMemoryQuestions(memories);
  assert.equal(questions.length, 3);
  assert.match(questions[0].question, /06 de novembro de 2025/);
  assert.equal(questions[0].memory, memories[0]);
  for (const question of questions) {
    assert.equal(question.choices.filter((choice) => choice.id === question.memory.id).length, 1);
    assert.equal(new Set(question.choices.map((choice) => choice.id)).size, 3);
  }
  assert.equal(questions[1].choices.find((choice) => choice.id === 'pedido').label, 'Pedido de Casamento');
});

test('datas ausentes, inválidas ou compartilhadas não criam perguntas com respostas ambíguas', () => {
  const memories = [
    { id: 'one', date: '2026-03-22', title: 'Um' },
    { id: 'two', date: '2026-03-22', title: 'Dois' },
    { id: 'three', date: null, title: 'Três' },
    { id: 'four', date: '2026-02-31', title: 'Quatro' },
  ];
  assert.deepEqual(buildMemoryQuestions(memories), []);
  assert.deepEqual(buildMemoryQuestions([memories[0]]), []);
});