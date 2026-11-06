# @lp-labs/citation-engine

Deterministic citation numbering and two intentionally small reference styles. This is a
self-contained utility, not a CSL implementation, bibliography database, or document renderer.

## Install

```sh
npm install @lp-labs/citation-engine
```

```js
import { createCitationEngine } from '@lp-labs/citation-engine';

const citations = createCitationEngine(
  [
    {
      id: 'paper',
      title: 'A Small Example',
      authors: ['Ada Lovelace'],
      year: 1843,
    },
    {
      id: 'book',
      title: 'Another Example',
      authors: ['Grace Hopper', 'Alan Turing'],
      year: 1952,
    },
  ],
  { style: 'numeric' },
);
console.log(citations.cite('paper')); // [1]
console.log(citations.cite('book')); // [2]
console.log(citations.references().map(({ citation, source }) => `${citation} ${source.title}`));
```

## API

- `createCitationEngine(sources, options?)` creates an isolated in-memory engine. Each source
  requires a unique `id` and `title`. Optional fields are `authors`, positive integer `year`,
  `publisher`, and `url`. Input values are copied.
- `CitationEngine.cite(id)` returns the first-use reference label. Repeated citations reuse their
  original label. Numeric style returns `[n]`; author-date style returns `(Author, year)`, using
  `et al.` for multiple authors and `Anon`/`n.d.` when absent.
- `CitationEngine.references()` returns copies in first-citation order. Each item has `number`,
  copied `source` metadata, and the formatted `citation`.
- `CitationEngine.reset()` clears assigned numbers and the citation-use counter.
- `CitationStyle`, `CitationSource`, `NumberedReference`, `CitationEngine`, and
  `CitationEngineOptions` are exported types.

`options.style` is `numeric` (default) or `author-date`. `maxSources` defaults to 10,000 and
`maxCitations` to 100,000; both may be lowered to a positive integer no greater than the default.
Metadata has bounded string lengths and source authors are limited to 100 names.

Unknown IDs, duplicate source IDs, invalid metadata/options, and exhausted budgets throw
`TypeError` or `RangeError`. The engine is deterministic for the same source list and citation
order. It does not sort, infer metadata, deduplicate works, or implement full CSL formatting.

## Module formats and customization

The package provides ESM, CommonJS, and TypeScript declarations. CommonJS consumers can use
`const { createCitationEngine } = require('@lp-labs/citation-engine')`. Add fields to your own
source records before construction when you need custom metadata; formatting is intentionally
limited to the two documented styles.

There are no runtime or peer dependencies. TypeScript and Prettier are development-only.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
