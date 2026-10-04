'use strict';
// All source text and search indexes stay off the renderer's event loop.
importScripts('data/catalog-bootstrap.js');
let corpus = self.VTM_CORPUS, loaded = false;
function initialize(libraryReady) {
 if (!libraryReady || loaded) return;
 importScripts('data/catalog.js');
 corpus = self.VTM_CORPUS; loaded = true;
 entries = corpus.entries.map(row => normalize([row.name,row.label,row.parent,row.text].filter(Boolean).join(' ')));
 pages = corpus.pages.map(row => normalize(row.text));
 pageMap = new Map(corpus.pages.map(row => [`${row.book}:${row.page}`,row]));
 cache.clear();
}
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let entries = corpus.entries.map(row => normalize([row.name, row.label, row.parent, row.text].filter(Boolean).join(' ')));
let pages = corpus.pages.map(row => normalize(row.text));
let pageMap = new Map(corpus.pages.map(row => [`${row.book}:${row.page}`, row]));
const cache = new Map();
self.onmessage = ({ data: message }) => {
  try {
    initialize(message.libraryReady);
    if (message.kind === 'page') {
      const page = pageMap.get(`${message.book}:${message.page}`);
      if (!page) throw new Error('Página não encontrada.');
      self.postMessage({ id: message.id, result: page });
      return;
    }
    if (!['catalog', 'library'].includes(message.kind)) throw new Error('Tipo de busca inválido.');
    const query = normalize(message.query).trim();
    const tokens = query.split(/\s+/).filter(Boolean);
    const key = JSON.stringify([message.kind, query, message.book || '', message.category || '']);
    let indices = cache.get(key);
    const list = message.kind === 'catalog' ? corpus.entries : corpus.pages;
    const normalized = message.kind === 'catalog' ? entries : pages;
    if (!indices) {
      indices = [];
      for (let i = 0; i < list.length; i++) {
        const row = list[i];
        if (message.book && row.book !== message.book) continue;
        if (message.category && row.category !== message.category) continue;
        if (tokens.every(token => normalized[i].includes(token))) indices.push(i);
      }
      cache.set(key, indices);
      if (cache.size > 12) cache.delete(cache.keys().next().value);
    }
    const pageSize = Math.max(1, Math.min(100, Number.isInteger(message.pageSize) ? message.pageSize : 30));
    const page = Math.max(0, Math.min(Number.isInteger(message.page) ? message.page : 0, Math.max(0, Math.ceil(indices.length / pageSize) - 1)));
    const rows = indices.slice(page * pageSize, (page + 1) * pageSize).map(i => {
      const row = list[i];
      if (message.kind === 'catalog') return row;
      const at = query ? normalized[i].indexOf(tokens[0]) : 0;
      return { book: row.book, page: row.page, text: row.text.slice(Math.max(0, at - 120), Math.max(0, at) + 400), snippet: true, ocr: !!row.ocr, machineTranslated: !!row.machineTranslated };
    });
    self.postMessage({ id: message.id, result: { rows, total: indices.length, page, pageSize } });
  } catch (error) {
    self.postMessage({ id: message.id, error: error.message });
  }
};
