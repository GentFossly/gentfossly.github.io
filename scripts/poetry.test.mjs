import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const poetryScript = await readFile(new URL('../poetry.js', import.meta.url), 'utf8');

async function loadPoem(date) {
  const elements = {
    '.poem-card': { setAttribute() {} },
    '#poemLoading': { hidden: false, textContent: '' },
    '#poemContent': { hidden: true },
    '#poemTitle': { textContent: '' },
    '#poemDate': { dateTime: '', textContent: '' },
    '#poemText': { textContent: '' }
  };
  const errors = [];

  runInNewContext(poetryScript, {
    document: {
      baseURI: 'https://example.test/website%20pages/poetry.html',
      querySelector: selector => elements[selector],
      getElementById: id => elements[`#${id}`]
    },
    fetch: async () => ({
      ok: true,
      json: async () => [{ title: 'Test poem', date, body: 'A poem.' }]
    }),
    console: { error: (...args) => errors.push(args) },
    Date,
    Error,
    Math,
    Number,
    URL
  });
  await new Promise(resolve => setImmediate(resolve));

  return { elements, errors };
}

for (const [date, expected] of [
  ['2026', { year: 'numeric' }],
  ['2026-01', { year: 'numeric', month: 'long' }],
  ['2026-01-02', { year: 'numeric', month: 'long', day: 'numeric' }]
]) {
  test(`displays the available date parts for ${date}`, async () => {
    const { elements, errors } = await loadPoem(date);
    const time = elements['#poemDate'];
    const normalizedDate = date.length === 4
      ? `${date}-01-01`
      : date.length === 7
        ? `${date}-01`
        : date;

    assert.equal(time.dateTime, date);
    assert.equal(time.textContent, new Date(`${normalizedDate}T00:00:00Z`).toLocaleDateString(
      undefined,
      { ...expected, timeZone: 'UTC' }
    ));
    assert.equal(elements['#poemContent'].hidden, false);
    assert.deepEqual(errors, []);
  });
}

test('rejects invalid partial and full dates', async () => {
  for (const date of ['2026-13', '2026-02-29', '2026-01-02-extra']) {
    const { elements, errors } = await loadPoem(date);
    assert.equal(elements['#poemContent'].hidden, true);
    assert.match(elements['#poemLoading'].textContent, /could not be loaded/);
    assert.equal(errors.length, 1);
  }
});
