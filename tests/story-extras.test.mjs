import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { collectStorySongs, rememberErrors, prepareRememberQuestions } from '../src/utils/storyExtras.js';
const a = 'spotify:track:0123456789ABCDEFGHIJKL';
const b = 'spotify:track:ABCDEFGHIJKLMNOPQRSTUV';

test('playlist completa mantém a ordem da história, remove repetidas e ignora URIs inválidos', () => {
  assert.deepEqual(collectStorySongs([{ songs: [a, b] }, { songs: [b, a, 'inválido'] }, {}, { songs: [] }]), [a, b]);
  assert.deepEqual(collectStorySongs([]), []);
});

const question = { id: 'nova-lembranca', question: 'Qual é a resposta?', options: ['Alternativa A', 'Alternativa B', 'Alternativa C'], answer: 'Alternativa B', title: 'Uma lembrança diferente', text: 'Relato independente' };

test('jogo vazio não importa perguntas nem fotos da linha do tempo', () => {
  const data = { questions: [] };
  assert.deepEqual(rememberErrors(data), []);
  assert.deepEqual(prepareRememberQuestions(data, { '/content/memories/viagem/01.jpg': '/foto-da-historia.jpg' }), []);
});

test('resposta configurada aponta para a alternativa correta, com fotos só da pasta independente', () => {
  const data = { questions: [question] };
  assert.deepEqual(rememberErrors(data), []);
  const files = {
    '/content/memories/nova-lembranca/01.jpg': '/foto-da-historia.jpg',
    '/content/voce-lembra/nova-lembranca/10.GIF': '/gif-do-jogo.gif',
    '/content/voce-lembra/nova-lembranca/2.jpg': '/foto-do-jogo.jpg',
    '/content/voce-lembra/outra/1.jpg': '/outra-foto.jpg',
    '/content/voce-lembra/nova-lembranca/subpasta/1.jpg': '/ignorada.jpg',
  };
  const prepared = prepareRememberQuestions(data, files)[0];
  assert.equal(prepared.question, question.question);
  assert.equal(prepared.choices.find((choice) => choice.id === prepared.answerId).label, question.answer);
  assert.equal(prepared.memory.title, question.title);
  assert.equal(prepared.memory.text, question.text);
  assert.deepEqual(prepared.memory.photos.map((photo) => photo.src), ['/foto-do-jogo.jpg', '/gif-do-jogo.gif']);
  assert.deepEqual(prepareRememberQuestions(data, {})[0].memory.photos, []);
});

test('impede respostas inexistentes, alternativas iguais, ids repetidos e caminhos impróprios', () => {
  assert.ok(rememberErrors({ questions: [{ ...question, answer: 'Não existe' }] }).some((error) => error.includes('answer')));
  assert.ok(rememberErrors({ questions: [{ ...question, options: ['igual', ' IGUAL '] }] }).some((error) => error.includes('diferentes')));
  assert.ok(rememberErrors({ questions: [question, question] }).some((error) => error.includes('repetido')));
  assert.ok(rememberErrors({ questions: [{ ...question, id: '../memories' }] }).some((error) => error.includes('id')));
  assert.ok(rememberErrors({ questions: [null] }).length);
  assert.ok(rememberErrors({}).length);
  assert.ok(rememberErrors({ questions: [{ ...question, options: ['Única'] }] }).length);
});

test('arquivo ativo e modelo de edição têm conteúdo válido', async () => {
  const active = JSON.parse(await readFile(new URL('../content/voce-lembra.json', import.meta.url), 'utf8'));
  const template = JSON.parse(await readFile(new URL('../content/voce-lembra.exemplo.json', import.meta.url), 'utf8'));
  assert.deepEqual(rememberErrors(active), []);
  assert.deepEqual(rememberErrors(template), []);
});