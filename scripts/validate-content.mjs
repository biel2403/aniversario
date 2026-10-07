import { readFile } from 'node:fs/promises';
import { contentErrors } from '../src/utils/content.js';

try {
  const data = JSON.parse(await readFile(new URL('../content/timeline.json', import.meta.url), 'utf8'));
  const errors = contentErrors(data);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`Conteúdo válido: ${data.memories.length} memórias. Fotos descobertas automaticamente pelo Vite.`);
} catch (error) {
  console.error(`Não foi possível ler content/timeline.json: ${error.message}`);
  process.exitCode = 1;
}
