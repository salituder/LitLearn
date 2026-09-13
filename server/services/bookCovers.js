const Book = require('../models/Book');

const pending = new Map();
const retryAfter = new Map();
const negativeCacheMs = 7 * 24 * 60 * 60 * 1000;
let queue = Promise.resolve();
let lastRequestAt = 0;

function normalize(value) {
  return String(value || '').normalize('NFC').toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

async function findBookCover(title, author) {
  const surname = normalize(author).split(' ').at(-1);
  if (!normalize(title) || !surname) return null;
  const params = new URLSearchParams({ text: `${title} ${surname}` });
  const response = await fetch(`https://www.moscowbooks.ru/search/?${params}`, {
    signal: AbortSignal.timeout(10000),
    headers: { 'User-Agent': 'LitLearn/1.0 (book cover lookup)', Accept: 'text/html' }
  });
  if (!response.ok) throw new Error(`Moscowbooks: HTTP ${response.status}`);
  const html = await response.text();
  if (!html.includes('header__main__search__form')) throw new Error('Moscowbooks: unexpected response');
  const candidates = [];
  for (const card of html.split('<div class="book-preview">').slice(1)) {
    const name = card.match(/class="book-preview__title-link"[^>]*>([\s\S]*?)<\/a>/)?.[1];
    const writer = card.match(/class="author-name"[^>]*>([\s\S]*?)<\/a>/)?.[1];
    const image = card.match(/<img\s+src="(\/image\/book\/[^"?]+\.jpg)"/)?.[1];
    if (!name || !writer || !image) continue;
    const normalizedName = normalize(name.replace(/<[^>]*>/g, ''));
    const wanted = normalize(title);
    if (normalize(writer).split(' ').includes(surname) &&
        (normalizedName === wanted || normalizedName.startsWith(`${wanted} `))) {
      candidates.push({ image, exact: normalizedName === wanted });
    }
  }
  candidates.sort((a, b) => Number(b.exact) - Number(a.exact));
  return candidates.length ? `https://www.moscowbooks.ru${candidates[0].image.replace('/w154/', '/orig/')}` : null;
}

function resolveBookCover(book) {
  if (book.cover) return Promise.resolve(book.cover);
  if (book.coverCheckedAt && Date.now() - new Date(book.coverCheckedAt).getTime() < negativeCacheMs) return Promise.resolve(null);
  const key = String(book._id);
  if (pending.has(key)) return pending.get(key);
  if ((retryAfter.get(key) || 0) > Date.now()) return Promise.resolve(null);
  const job = queue.then(async () => {
    const waitMs = Math.max(0, 1100 - (Date.now() - lastRequestAt));
    if (waitMs) await new Promise(resolve => setTimeout(resolve, waitMs));
    lastRequestAt = Date.now();
    try {
      const cover = await findBookCover(book.title, book.author);
      const update = { coverCheckedAt: new Date() };
      if (cover) update.cover = cover;
      const updated = await Book.findOneAndUpdate(
        { _id: book._id, title: book.title, author: book.author, cover: { $in: [null, ''] } },
        { $set: update }, { new: true }
      ).select('cover');
      retryAfter.delete(key);
      return updated?.cover || null;
    } catch (error) {
      // Сбой сервиса не сохраняем как отсутствие обложки в БД.
      retryAfter.set(key, Date.now() + 60 * 1000);
      console.warn('Cover lookup failed:', book.title, error.message);
      return null;
    }
  }).finally(() => pending.delete(key));
  pending.set(key, job);
  queue = job.catch(() => null);
  return job;
}

module.exports = { findBookCover, resolveBookCover };
