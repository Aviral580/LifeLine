import { processQuery } from '../utils/queryProcessor.js';

const testQueries = [
    "my my my my home",
    "HELP!!!! Earthquakes in India @@@",
    "the the running   bears are   fighting",
    "How to find a hospital near Allahabad???"
];

console.log("🧪 Testing Query Processor Logic:\n");

testQueries.forEach(q => {
    const result = processQuery(q);
    console.log(`Input:  "${q}"`);
    console.log(`Output: [${result.join(', ')}]\n`);
});