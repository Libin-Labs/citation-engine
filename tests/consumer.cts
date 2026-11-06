import api = require('@lp-labs/citation-engine');

const engine = api.createCitationEngine([{ id: 'source', title: 'Source' }]);
const citation: string = engine.cite('source');
console.log(citation);
