import { createCitationEngine, type CitationStyle } from '@lp-labs/citation-engine';

const style: CitationStyle = 'numeric';
const engine = createCitationEngine([{ id: 'source', title: 'Source' }], {
  style,
});
const citation: string = engine.cite('source');
const number: number = engine.references()[0]!.number;
console.log(citation, number);
