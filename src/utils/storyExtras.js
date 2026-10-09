import { formatDate, parseDate } from './dates.js';
import { TRACK_URI } from './content.js';

// Input is already in story order; the first occurrence of each song wins.
export function collectStorySongs(memories) {
  return [...new Set(memories.flatMap((memory) => memory.songs || []).filter((uri) => TRACK_URI.test(uri)))];
}

export function memoryLabel(title) { return title.replace(/^\[(.*)\]$/, '$1'); }

export function buildMemoryQuestions(memories) {
  const dated = memories.filter((memory) => parseDate(memory.date));
  return dated.filter((memory) => dated.every((other) => other.id === memory.id || other.date !== memory.date)).map((memory, index) => {
    const choices = [memory, ...memories.filter((other) => other.id !== memory.id).slice(0, 2)];
    if (choices.length < 2) return null;
    const offset = (index + 1) % choices.length;
    return {
      memory, question: `Qual lembrança aconteceu em ${formatDate(memory.date)}?`,
      choices: [...choices.slice(offset), ...choices.slice(0, offset)].map((choice) => ({ id: choice.id, label: memoryLabel(choice.title) })),
    };
  }).filter(Boolean);
}