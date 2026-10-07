import { parseDate } from './dates.js';

export const TRACK_URI = /^spotify:track:[A-Za-z0-9]{22}$/;
const IMAGE_FILE = /\.(jpe?g|png|webp|gif)$/i;
const naturalSort = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

export function discoverPhotos(files, memoryId) {
  const prefix = `/content/memories/${memoryId}/`;
  return Object.entries(files)
    .filter(([path]) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/') && IMAGE_FILE.test(path))
    .sort(([a], [b]) => naturalSort.compare(a, b))
    .map(([path, src]) => ({ src, filename: path.slice(prefix.length) }));
}

export function contentErrors(data) {
  const errors = [];
  if (!data?.project || !Array.isArray(data?.memories)) return ['O conteúdo precisa de project e memories.'];
  if (!data.project.title || !data.project.subtitle) errors.push('Preencha title e subtitle do projeto.');
  if (data.project.relationshipStart != null && !parseDate(data.project.relationshipStart)) errors.push('relationshipStart deve ser uma data AAAA-MM-DD válida ou null.');
  if (!parseDate(data.project.weddingDate)) errors.push('weddingDate deve ser uma data AAAA-MM-DD válida.');
  const ids = new Set();
  for (const memory of data.memories) {
    if (!memory || typeof memory !== 'object') { errors.push('Cada memória precisa ser um objeto.'); continue; }
    if (typeof memory.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(memory.id)) errors.push('Use um id simples, como primeiro-encontro.');
    if (ids.has(memory.id)) errors.push(`id repetido: ${memory.id}.`);
    ids.add(memory.id);
    if (memory.date != null && !parseDate(memory.date)) errors.push(`${memory.id}: data inválida; use AAAA-MM-DD ou null.`);
    if (typeof memory.title !== 'string' || !memory.title.trim()) errors.push(`${memory.id}: preencha title.`);
    if (typeof memory.text !== 'string') errors.push(`${memory.id}: text precisa ser um texto.`);
    if (memory.songs != null && (!Array.isArray(memory.songs) || memory.songs.length > 3 || memory.songs.some((song) => !TRACK_URI.test(song)))) errors.push(`${memory.id}: songs deve ter de zero a três URIs Spotify válidos.`);
  }
  return errors;
}

export function prepareMemories(data, files) {
  const list = data.memories.map((memory, order) => ({ ...memory, songs: memory.songs || [], photos: discoverPhotos(files, memory.id), order }));
  const dated = list.filter((memory) => parseDate(memory.date)).sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
  const undated = list.filter((memory) => !parseDate(memory.date));
  return [...dated, ...undated];
}
