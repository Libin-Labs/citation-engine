export interface CitationSource {
  id: string;
  title: string;
  authors?: readonly string[];
  year?: number;
  publisher?: string;
  url?: string;
}

export type CitationStyle = 'numeric' | 'author-date';

export interface NumberedReference {
  number: number;
  source: CitationSource;
  citation: string;
}

export interface CitationEngine {
  cite(id: string): string;
  references(): NumberedReference[];
  reset(): void;
}

export interface CitationEngineOptions {
  style?: CitationStyle;
  maxSources?: number;
  maxCitations?: number;
}

const MAX_SOURCES = 10_000;
const MAX_CITATIONS = 100_000;

function requireText(value: unknown, name: string, maximum = 4096): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maximum) {
    throw new TypeError(`${name} must be a nonempty string of at most ${maximum} characters.`);
  }
}

function positiveLimit(value: number | undefined, fallback: number, name: string): number {
  const limit = value ?? fallback;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > fallback) {
    throw new RangeError(`${name} must be an integer from 1 to ${fallback}.`);
  }
  return limit;
}

function copySource(input: CitationSource): CitationSource {
  if (!input || typeof input !== 'object') throw new TypeError('A citation source is required.');
  requireText(input.id, 'Source ID', 128);
  requireText(input.title, 'Source title');
  if (input.authors !== undefined) {
    if (!Array.isArray(input.authors) || input.authors.length > 100) {
      throw new TypeError('Authors must be an array of at most 100 names.');
    }
    for (const author of input.authors) requireText(author, 'Author name', 256);
  }
  if (input.year !== undefined && (!Number.isSafeInteger(input.year) || input.year < 1)) {
    throw new TypeError('Year must be a positive safe integer.');
  }
  if (input.publisher !== undefined) requireText(input.publisher, 'Publisher', 512);
  if (input.url !== undefined) requireText(input.url, 'URL', 2048);
  return Object.freeze({
    id: input.id,
    title: input.title,
    ...(input.authors === undefined ? {} : { authors: Object.freeze([...input.authors]) }),
    ...(input.year === undefined ? {} : { year: input.year }),
    ...(input.publisher === undefined ? {} : { publisher: input.publisher }),
    ...(input.url === undefined ? {} : { url: input.url }),
  });
}

function formatAuthorDate(source: CitationSource): string {
  const authors = source.authors ?? [];
  const author =
    authors.length === 0 ? 'Anon' : authors.length === 1 ? authors[0] : `${authors[0]} et al.`;
  return `(${author}, ${source.year ?? 'n.d.'})`;
}

export function createCitationEngine(
  input: Iterable<CitationSource>,
  options: CitationEngineOptions = {},
): CitationEngine {
  if (input == null || typeof input[Symbol.iterator] !== 'function') {
    throw new TypeError('Sources must be iterable.');
  }
  const style = options.style ?? 'numeric';
  if (style !== 'numeric' && style !== 'author-date') {
    throw new TypeError('Style must be "numeric" or "author-date".');
  }
  const maxSources = positiveLimit(options.maxSources, MAX_SOURCES, 'maxSources');
  const maxCitations = positiveLimit(options.maxCitations, MAX_CITATIONS, 'maxCitations');
  const sources = new Map<string, CitationSource>();
  for (const inputSource of input) {
    if (sources.size >= maxSources) throw new RangeError('Source capacity exceeded.');
    const source = copySource(inputSource);
    if (sources.has(source.id)) throw new TypeError(`Duplicate source ID: ${source.id}`);
    sources.set(source.id, source);
  }

  const numbered = new Map<string, number>();
  let totalCitations = 0;
  return {
    cite(id) {
      requireText(id, 'Source ID', 128);
      const source = sources.get(id);
      if (!source) throw new TypeError(`Unknown source ID: ${id}`);
      if (totalCitations >= maxCitations) throw new RangeError('Citation capacity exceeded.');
      let number = numbered.get(id);
      if (number === undefined) {
        number = numbered.size + 1;
        numbered.set(id, number);
      }
      totalCitations += 1;
      return style === 'numeric' ? `[${number}]` : formatAuthorDate(source);
    },
    references() {
      return [...numbered.entries()].map(([id, number]) => {
        const source = sources.get(id);
        if (!source) throw new Error('Citation source invariant violated.');
        return Object.freeze({
          number,
          source,
          citation: style === 'numeric' ? `[${number}]` : formatAuthorDate(source),
        });
      });
    },
    reset() {
      numbered.clear();
      totalCitations = 0;
    },
  };
}
