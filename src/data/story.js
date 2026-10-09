import timeline from '../../content/timeline.json';
import rememberContent from '../../content/voce-lembra.json';
import { contentErrors, prepareMemories } from '../utils/content.js';
import { rememberErrors, prepareRememberQuestions } from '../utils/storyExtras.js';

// Eager imports resolve only asset URLs. Image bytes load when <img> becomes visible.
const photoFiles = import.meta.glob('/content/memories/**/*.{jpg,jpeg,png,webp,gif,JPG,JPEG,PNG,WEBP,GIF}', {
  eager: true, query: '?url', import: 'default',
});
const rememberPhotoFiles = import.meta.glob('/content/voce-lembra/**/*.{jpg,jpeg,png,webp,gif,JPG,JPEG,PNG,WEBP,GIF}', {
  eager: true, query: '?url', import: 'default',
});

export const errors = [...contentErrors(timeline), ...rememberErrors(rememberContent)];
export const project = timeline.project;
export const memories = errors.length ? [] : prepareMemories(timeline, photoFiles);
export const rememberQuestions = errors.length ? [] : prepareRememberQuestions(rememberContent, rememberPhotoFiles);