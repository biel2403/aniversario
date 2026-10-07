import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverPhotos, contentErrors, prepareMemories } from '../src/utils/content.js';

const memory = { id: 'primeiro-encontro', date: null, title: '[Título]', text: '[Texto]', songs: [] };
const data = { project: { title: 'Máquina do Tempo', subtitle: 'Gabriel & Júlia', relationshipStart: null, weddingDate: '2027-07-24' }, memories: [memory] };

test('descobre fotos pelo id e ordena nomes numericamente, sem misturar pastas', () => {
  const files = {
    '/content/memories/primeiro-encontro/10.jpg': '/10.jpg',
    '/content/memories/primeiro-encontro/02.webp': '/02.webp',
    '/content/memories/primeiro-encontro/01.JPG': '/01.JPG',
    '/content/memories/primeiro-encontro/3.PNG': '/3.PNG',
    '/content/memories/primeiro-encontro/04.gif': '/04.gif',
    '/content/memories/primeiro-encontro/05.GIF': '/05.GIF',
    '/content/memories/primeiro-encontro/subpasta/04.jpg': '/nested.jpg',
    '/content/memories/primeiro-encontro/subpasta/06.gif': '/nested.gif',
    '/content/memories/primeiro-encontro/06.gif.txt': '/notes-gif.txt',
    '/content/memories/primeiro-encontro/notas.txt': '/notes.txt',
    '/content/memories/primeiro-encontro-extra/01.jpg': '/other.jpg',
  };
  assert.deepEqual(discoverPhotos(files, memory.id).map((photo) => photo.filename), ['01.JPG', '02.webp', '3.PNG', '04.gif', '05.GIF', '10.jpg']);
});
test('memória sem pasta ou sem músicas funciona', () => {
  const prepared = prepareMemories({ memories: [{ ...memory, songs: undefined }] }, {});
  assert.deepEqual(prepared[0].photos, []);
  assert.deepEqual(prepared[0].songs, []);
  assert.deepEqual(contentErrors(data), []);
});
test('ordena datas reais e preserva a ordem dos placeholders ao final', () => {
  const list = [{ ...memory, id: 'sem-data' }, { ...memory, id: 'recente', date: '2026-10-06' }, { ...memory, id: 'antiga', date: '2024-03-05' }];
  assert.deepEqual(prepareMemories({ memories: list }, {}).map((item) => item.id), ['antiga', 'recente', 'sem-data']);
});
test('valida ids repetidos, caminhos impróprios, datas inexistentes e URIs inválidos', () => {
  assert.match(contentErrors({ ...data, memories: [memory, memory] }).join(' '), /repetido/);
  assert.match(contentErrors({ ...data, memories: [{ ...memory, id: '../fotos' }] }).join(' '), /id simples/);
  assert.match(contentErrors({ ...data, memories: [{ ...memory, date: '2026-02-30' }] }).join(' '), /data inválida/);
  assert.match(contentErrors({ ...data, memories: [{ ...memory, songs: ['spotify:track:AAAA'] }] }).join(' '), /URIs/);
});
test('aceita até três músicas reais na forma de URI, sem exigir metadados', () => {
  const uri = 'spotify:track:0123456789ABCDEFGHIJKL';
  assert.equal(contentErrors({ ...data, memories: [{ ...memory, songs: [uri, uri, uri] }] }).length, 0);
  assert.match(contentErrors({ ...data, memories: [{ ...memory, songs: [uri, uri, uri, uri] }] }).join(' '), /três/);
});
