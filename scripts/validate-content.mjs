import { readFile } from 'node:fs/promises';
import { contentErrors } from '../src/utils/content.js';
import { rememberErrors } from '../src/utils/storyExtras.js';

try {
  const data = JSON.parse(await readFile(new URL('../content/timeline.json', import.meta.url), 'utf8'));
  const remember = JSON.parse(await readFile(new URL('../content/voce-lembra.json', import.meta.url), 'utf8'));
  const errors = [...contentErrors(data), ...rememberErrors(remember)];
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`Conteúdo válido: ${data.memories.length} memórias e ${remember.questions.length} perguntas independentes. Fotos descobertas automaticamente pelo Vite.`);
} catch (error) {
  console.error(`Não foi possível ler os arquivos de conteúdo: ${error.message}`);
  process.exitCode = 1;
}