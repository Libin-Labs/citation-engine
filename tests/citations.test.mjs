import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createCitationEngine } from '../dist/esm/index.js';

const sources = [
  {
    id: 'a',
    title: 'First work',
    authors: ['Ada Lovelace'],
    year: 1843,
    publisher: 'Example Press',
  },
  {
    id: 'b',
    title: 'Second work',
    authors: ['Grace Hopper', 'Alan Turing'],
    year: 1952,
  },
  { id: 'c', title: 'Untitled', url: 'https://example.test/work' },
];

test('numbers references by first citation and keeps first-use order', () => {
  const engine = createCitationEngine(sources);
  assert.equal(engine.cite('b'), '[1]');
  assert.equal(engine.cite('a'), '[2]');
  assert.equal(engine.cite('b'), '[1]');
  assert.deepEqual(
    engine.references().map(({ number, source }) => [number, source.id]),
    [
      [1, 'b'],
      [2, 'a'],
    ],
  );
});

test('author-date style is a deliberately basic explicit style', () => {
  const engine = createCitationEngine(sources, { style: 'author-date' });
  assert.equal(engine.cite('a'), '(Ada Lovelace, 1843)');
  assert.equal(engine.cite('b'), '(Grace Hopper et al., 1952)');
  assert.equal(engine.cite('c'), '(Anon, n.d.)');
  assert.equal(engine.references()[0].citation, '(Ada Lovelace, 1843)');
});

test('reset starts numbering and the citation budget over', () => {
  const engine = createCitationEngine(sources, { maxCitations: 2 });
  engine.cite('a');
  engine.cite('a');
  assert.throws(() => engine.cite('b'), /capacity/);
  engine.reset();
  assert.deepEqual(engine.references(), []);
  assert.equal(engine.cite('b'), '[1]');
});

test('source data and author arrays are copied and frozen', () => {
  const authorList = ['Original'];
  const input = { id: 'x', title: 'Copied', authors: authorList };
  const engine = createCitationEngine([input]);
  input.title = 'Changed';
  authorList[0] = 'Changed';
  const source = engine.references();
  engine.cite('x');
  assert.throws(() => {
    source[0].source.title = 'mutated';
  }, TypeError);
  assert.equal(engine.references()[0].source.title, 'Copied');
  assert.deepEqual(engine.references()[0].source.authors, ['Original']);
});

test('unknown IDs, malformed sources, and duplicate IDs fail explicitly', () => {
  const engine = createCitationEngine(sources);
  assert.throws(() => engine.cite('missing'), /Unknown source ID/);
  assert.throws(() => createCitationEngine([{ id: '', title: 'x' }]), TypeError);
  assert.throws(() => createCitationEngine([{ id: 'x', title: 'x', year: 0 }]), TypeError);
  assert.throws(() => createCitationEngine([sources[0], sources[0]]), /Duplicate/);
  assert.throws(() => createCitationEngine(sources, { style: 'csl' }), /Style/);
});

test('source and citation limits are enforced', () => {
  assert.throws(() => createCitationEngine(sources, { maxSources: 2 }), /Source capacity/);
  assert.throws(() => createCitationEngine([], { maxCitations: 0 }), /maxCitations/);
  const engine = createCitationEngine(sources, { maxCitations: 1 });
  engine.cite('a');
  assert.throws(() => engine.cite('a'), /Citation capacity/);
});

test('generated citation sequences stay deterministic across resets', () => {
  const items = Array.from({ length: 100 }, (_, index) => ({
    id: `id-${index}`,
    title: `Title ${index}`,
  }));
  const engine = createCitationEngine(items);
  for (let index = 0; index < items.length; index += 1) {
    assert.equal(engine.cite(`id-${index}`), `[${index + 1}]`);
  }
  assert.equal(engine.references().length, items.length);
  engine.reset();
  for (let index = items.length - 1; index >= 0; index -= 1) {
    assert.equal(engine.cite(`id-${index}`), `[${items.length - index}]`);
  }
});

test('CommonJS entry point exposes the same engine', () => {
  const api = createRequire(import.meta.url)('../dist/cjs/index.js');
  assert.equal(api.createCitationEngine([{ id: 'x', title: 'X' }]).cite('x'), '[1]');
});
