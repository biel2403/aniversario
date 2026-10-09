import { discoverPhotos, TRACK_URI } from './content.js';

// Input is already in story order; the first occurrence of each song wins.
export function collectStorySongs(memories) {
  return [...new Set(memories.flatMap((memory) => memory.songs || []).filter((uri) => TRACK_URI.test(uri)))];
}

export function memoryLabel(title) { return title.replace(/^\[(.*)\]$/, '$1'); }

export function rememberErrors(data) {
  if (!data || !Array.isArray(data.questions)) return ['voce-lembra.json: preencha questions com uma lista.'];
  const errors = [];
  const ids = new Set();
  for (const item of data.questions) {
    if (!item || typeof item !== 'object') { errors.push('voce-lembra.json: cada pergunta precisa ser um objeto.'); continue; }
    const label = `Você lembra — ${item.id || 'pergunta sem id'}`;
    if (typeof item.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) errors.push(`${label}: use um id sem espaços ou acentos.`);
    if (ids.has(item.id)) errors.push(`${label}: id repetido.`);
    ids.add(item.id);
    if (typeof item.question !== 'string' || !item.question.trim()) errors.push(`${label}: preencha question.`);
    if (typeof item.title !== 'string' || !item.title.trim()) errors.push(`${label}: preencha title.`);
    if (typeof item.text !== 'string') errors.push(`${label}: text precisa ser um texto.`);
    const validOptions = Array.isArray(item.options) && item.options.length >= 2 && item.options.length <= 6 && item.options.every((option) => typeof option === 'string' && option.trim());
    if (!validOptions) errors.push(`${label}: options precisa ter de duas a seis alternativas preenchidas.`);
    else {
      const options = item.options.map((option) => option.trim());
      if (new Set(options.map((option) => option.toLocaleLowerCase('pt-BR'))).size !== options.length) errors.push(`${label}: as alternativas precisam ser diferentes.`);
      if (typeof item.answer !== 'string' || !options.includes(item.answer.trim())) errors.push(`${label}: answer precisa ser exatamente uma das alternativas.`);
    }
  }
  return errors;
}

export function prepareRememberQuestions(data, files) {
  return data.questions.map((item) => {
    const choices = item.options.map((label, index) => ({ id: `${item.id}-option-${index}`, label: label.trim() }));
    return {
      question: item.question.trim(),
      answerId: choices.find((choice) => choice.label === item.answer.trim()).id,
      choices,
      memory: { id: item.id, title: item.title.trim(), text: item.text, photos: discoverPhotos(files, item.id, '/content/voce-lembra') },
    };
  });
}