import timeline from '../../content/timeline.json';
import { contentErrors, prepareMemories } from '../utils/content.js';

// Eager imports resolve only asset URLs. Image bytes load when <img> becomes visible.
const photoFiles = import.meta.glob('/content/memories/**/*.{jpg,jpeg,png,webp,gif,JPG,JPEG,PNG,WEBP,GIF}', {
  eager: true, query: '?url', import: 'default',
});

export const errors = contentErrors(timeline);
export const project = timeline.project;
export const memories = errors.length ? [] : prepareMemories(timeline, photoFiles);
